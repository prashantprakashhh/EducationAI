package com.eduai.service;

import com.eduai.model.Attendance;
import com.eduai.model.ClassDocument;
import com.eduai.model.Quiz;
import com.eduai.model.QuizAttempt;
import com.eduai.model.User;
import com.eduai.repository.AttendanceRepository;
import com.eduai.repository.ClassDocumentRepository;
import com.eduai.repository.QuizAttemptRepository;
import com.eduai.repository.QuizRepository;
import com.eduai.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherService {

    private final ClassDocumentRepository documentRepository;
    private final AttendanceRepository attendanceRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // VectorStore and ChatModel are optional - app can run without Gemini API key
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private VectorStore vectorStore;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ChatModel chatModel;

    private final String UPLOAD_DIR = "uploads/";

    @Transactional
    public ClassDocument uploadDocument(MultipartFile file) throws IOException {
        // 1. Save file to disk
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) directory.mkdirs();

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());

        // 2. Save metadata to DB
        ClassDocument doc = new ClassDocument();
        doc.setFilename(file.getOriginalFilename());
        doc.setFilePath(filePath.toString());
        doc.setContentType(file.getContentType());
        doc.setSize(file.getSize());
        doc.setProcessed(false);
        
        return documentRepository.save(doc);
    }

    @Transactional
    public String processDocument(Long documentId) {
        ClassDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        try {
            if (vectorStore == null) {
                throw new IllegalStateException("Vector Store not configured (Check API Key)");
            }
            
            if (chatModel == null) {
                throw new IllegalStateException("AI Chat Model not configured (Check API Key)");
            }

            // 1. Read File
            Resource resource = new FileSystemResource(doc.getFilePath());
            if (!resource.exists()) {
                throw new IOException("File not found at path: " + doc.getFilePath());
            }
            
            TextReader reader = new TextReader(resource);
            List<Document> documents = reader.get();

            // 2. Split into chunks (TokenTextSplitter)
            TokenTextSplitter splitter = new TokenTextSplitter();
            List<Document> chunks = splitter.apply(documents);

            // 3. Store in Vector DB
            vectorStore.add(chunks);

            // 4. Generate Summary using AI
            String contentPreview = chunks.isEmpty() ? "" : chunks.get(0).getContent();
            String prompt = "Summarize this document briefly: " + contentPreview.substring(0, Math.min(contentPreview.length(), 2000));
            String summary = chatModel.call(new Prompt(prompt)).getResult().getOutput().getText();
            
            doc.setSummary(summary);
            doc.setProcessed(true);
            documentRepository.save(doc);

            return "Processed " + chunks.size() + " chunks. Summary: " + summary;

        } catch (Exception e) {
            log.error("Error processing document", e);
            // Update document with error so UI shows it instead of getting stuck
            doc.setSummary("Processing failed: " + e.getMessage());
            doc.setProcessed(true);
            documentRepository.save(doc);
            return "Error: " + e.getMessage();
        }
    }

    @Transactional
    public Quiz generateQuiz(Long documentId) {
        return generateExamQuiz(documentId, null, null, 5);
    }

    @Transactional
    public Quiz generateExamQuiz(Long documentId, String examName, String subject, Integer questionCount) {
        ClassDocument doc = documentRepository.findById(documentId).orElseThrow();
        int count = (questionCount != null && questionCount > 0) ? questionCount : 10;
        
        String examContext = "";
        if (examName != null && !examName.isBlank()) {
            examContext = "This is from: " + examName + ". ";
            if (subject != null && !subject.isBlank()) {
                examContext += "Subject: " + subject + ". ";
            }
            examContext += "Generate questions that match the difficulty level and style of this exam. ";
        }
        
        String promptText = """
            You are an expert exam question generator. Based on the document content below, generate %d multiple choice questions.
            %s
            
            IMPORTANT RULES:
            1. Each question MUST have exactly 4 options (A, B, C, D)
            2. Include the correct answer index (0-based)
            3. Include a clear, educational explanation for the correct answer
            4. Tag each question with a topic/chapter name
            5. Assign a difficulty: "easy", "medium", or "hard"
            6. Questions should test conceptual understanding, not just rote memorization
            7. Mix difficulty levels across questions
            
            Return ONLY raw JSON array (no markdown, no code fences):
            [
              {
                "question": "What is...?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctIndex": 0,
                "explanation": "The correct answer is A because...",
                "topic": "Cell Biology",
                "difficulty": "medium"
              }
            ]
            
            Document Content:
            %s
            """.formatted(count, examContext, doc.getSummary() != null ? doc.getSummary() : "No content available");
        
        String jsonResponse = chatModel.call(new Prompt(promptText)).getResult().getOutput().getText();
        jsonResponse = jsonResponse.replace("```json", "").replace("```", "").trim();

        Quiz quiz = new Quiz();
        quiz.setTitle((examName != null && !examName.isBlank()) 
            ? examName + (subject != null ? " - " + subject : "") 
            : "Quiz: " + doc.getFilename());
        quiz.setDocument(doc);
        quiz.setQuestionsJson(jsonResponse);
        quiz.setExamName(examName);
        quiz.setSubject(subject);
        quiz.setQuestionCount(count);
        quiz.setSourceInfo(doc.getFilename());
        
        return quizRepository.save(quiz);
    }

    public List<Quiz> getQuizzesForDocument(Long documentId) {
        return quizRepository.findByDocumentId(documentId);
    }

    public List<QuizAttempt> getQuizResults(Long quizId) {
        return quizAttemptRepository.findByQuizId(quizId);
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    @Transactional
    public QuizAttempt submitQuiz(Long userId, Long quizId, List<Integer> answers, Integer timeTakenSeconds) {
        User student = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
        
        int score = 0;
        int total = 0;
        
        try {
            List<Map<String, Object>> questions = objectMapper.readValue(
                quiz.getQuestionsJson(), 
                new TypeReference<List<Map<String, Object>>>(){}
            );
            total = questions.size();
            
            for (int i = 0; i < total; i++) {
                if (i < answers.size()) {
                    int correctIndex = (Integer) questions.get(i).get("correctIndex");
                    if (answers.get(i) == correctIndex) {
                        score++;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing quiz json during submission", e);
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setStudent(student);
        attempt.setScore(score);
        attempt.setTotalQuestions(total);
        attempt.setTimeTakenSeconds(timeTakenSeconds);
        try {
            attempt.setAnswersJson(objectMapper.writeValueAsString(answers));
        } catch (Exception e) {
            attempt.setAnswersJson("[]");
        }
        
        // Generate analysis
        String analysis = generateQuizAnalysis(quiz, answers, score, total);
        attempt.setAnalysisJson(analysis);
        
        return quizAttemptRepository.save(attempt);
    }

    /**
     * Submit quiz and return detailed analysis with wrong questions, topic breakdown, recommendations
     */
    @Transactional
    public Map<String, Object> submitQuizWithAnalysis(Long userId, Long quizId, List<Integer> answers, Integer timeTakenSeconds) {
        QuizAttempt attempt = submitQuiz(userId, quizId, answers, timeTakenSeconds);
        Quiz quiz = attempt.getQuiz();
        
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", attempt.getScore());
        result.put("totalQuestions", attempt.getTotalQuestions());
        result.put("percentage", attempt.getTotalQuestions() > 0 
            ? Math.round((attempt.getScore() * 100.0 / attempt.getTotalQuestions()) * 10.0) / 10.0 : 0);
        result.put("timeTakenSeconds", timeTakenSeconds);
        
        try {
            List<Map<String, Object>> questions = objectMapper.readValue(
                quiz.getQuestionsJson(), new TypeReference<List<Map<String, Object>>>(){});
            
            // Build wrong questions list
            List<Map<String, Object>> wrongQuestions = new ArrayList<>();
            Map<String, int[]> topicStats = new LinkedHashMap<>(); // topic -> [correct, total]
            
            for (int i = 0; i < questions.size(); i++) {
                Map<String, Object> q = questions.get(i);
                int correctIdx = (Integer) q.get("correctIndex");
                int selectedIdx = (i < answers.size()) ? answers.get(i) : -1;
                String topic = (String) q.getOrDefault("topic", "General");
                List<String> options = (List<String>) q.get("options");
                
                topicStats.computeIfAbsent(topic, k -> new int[]{0, 0});
                topicStats.get(topic)[1]++;
                
                if (selectedIdx == correctIdx) {
                    topicStats.get(topic)[0]++;
                } else {
                    Map<String, Object> wrong = new LinkedHashMap<>();
                    wrong.put("questionIndex", i);
                    wrong.put("question", q.get("question"));
                    wrong.put("selectedAnswer", (selectedIdx >= 0 && selectedIdx < options.size()) ? options.get(selectedIdx) : "Not answered");
                    wrong.put("correctAnswer", options.get(correctIdx));
                    wrong.put("explanation", q.getOrDefault("explanation", ""));
                    wrong.put("topic", topic);
                    wrongQuestions.add(wrong);
                }
            }
            
            result.put("wrongQuestions", wrongQuestions);
            
            // Topic breakdown
            List<Map<String, Object>> topicBreakdown = new ArrayList<>();
            List<String> weakTopics = new ArrayList<>();
            List<String> strongTopics = new ArrayList<>();
            
            for (Map.Entry<String, int[]> entry : topicStats.entrySet()) {
                Map<String, Object> tb = new LinkedHashMap<>();
                tb.put("topic", entry.getKey());
                tb.put("correct", entry.getValue()[0]);
                tb.put("total", entry.getValue()[1]);
                double pct = entry.getValue()[1] > 0 ? (entry.getValue()[0] * 100.0 / entry.getValue()[1]) : 0;
                tb.put("percentage", Math.round(pct * 10.0) / 10.0);
                topicBreakdown.add(tb);
                
                if (pct < 50) weakTopics.add(entry.getKey());
                else if (pct >= 80) strongTopics.add(entry.getKey());
            }
            
            result.put("topicBreakdown", topicBreakdown);
            result.put("weakTopics", weakTopics);
            result.put("strongTopics", strongTopics);
            
            // Generate recommendations
            List<String> recommendations = new ArrayList<>();
            if (!weakTopics.isEmpty()) {
                recommendations.add("Focus more on: " + String.join(", ", weakTopics));
            }
            if (!strongTopics.isEmpty()) {
                recommendations.add("Great performance in: " + String.join(", ", strongTopics));
            }
            double overallPct = attempt.getTotalQuestions() > 0 
                ? (attempt.getScore() * 100.0 / attempt.getTotalQuestions()) : 0;
            if (overallPct < 40) {
                recommendations.add("Consider revisiting the fundamentals of this subject before attempting more practice papers.");
            } else if (overallPct < 70) {
                recommendations.add("Good effort! Focus on your weak areas and practice similar questions to improve.");
            } else {
                recommendations.add("Excellent performance! Keep practicing to maintain your edge.");
            }
            result.put("recommendations", recommendations);
            
        } catch (Exception e) {
            log.error("Error building quiz analysis", e);
            result.put("wrongQuestions", List.of());
            result.put("topicBreakdown", List.of());
            result.put("weakTopics", List.of());
            result.put("strongTopics", List.of());
            result.put("recommendations", List.of("Unable to generate detailed analysis."));
        }
        
        return result;
    }
    
    /**
     * Generate a JSON analysis string stored in the attempt
     */
    private String generateQuizAnalysis(Quiz quiz, List<Integer> answers, int score, int total) {
        try {
            List<Map<String, Object>> questions = objectMapper.readValue(
                quiz.getQuestionsJson(), new TypeReference<List<Map<String, Object>>>(){});
            
            Map<String, int[]> topicStats = new LinkedHashMap<>();
            for (int i = 0; i < questions.size(); i++) {
                Map<String, Object> q = questions.get(i);
                String topic = (String) q.getOrDefault("topic", "General");
                int correctIdx = (Integer) q.get("correctIndex");
                int selectedIdx = (i < answers.size()) ? answers.get(i) : -1;
                
                topicStats.computeIfAbsent(topic, k -> new int[]{0, 0});
                topicStats.get(topic)[1]++;
                if (selectedIdx == correctIdx) topicStats.get(topic)[0]++;
            }
            
            List<String> weakTopics = new ArrayList<>();
            List<String> strongTopics = new ArrayList<>();
            List<Map<String, Object>> breakdown = new ArrayList<>();
            
            for (Map.Entry<String, int[]> entry : topicStats.entrySet()) {
                double pct = entry.getValue()[1] > 0 ? (entry.getValue()[0] * 100.0 / entry.getValue()[1]) : 0;
                Map<String, Object> tb = Map.of(
                    "topic", entry.getKey(), 
                    "correct", entry.getValue()[0], 
                    "total", entry.getValue()[1]
                );
                breakdown.add(tb);
                if (pct < 50) weakTopics.add(entry.getKey());
                else if (pct >= 80) strongTopics.add(entry.getKey());
            }
            
            Map<String, Object> analysis = Map.of(
                "weakTopics", weakTopics, 
                "strongTopics", strongTopics,
                "topicBreakdown", breakdown
            );
            return objectMapper.writeValueAsString(analysis);
        } catch (Exception e) {
            log.error("Error generating quiz analysis", e);
            return "{}";
        }
    }

    public List<QuizAttempt> getStudentQuizHistory(Long userId) {
        return quizAttemptRepository.findByStudentIdOrderByCompletedAtDesc(userId);
    }

    @Transactional
    public List<Attendance> markAttendanceByVoice(String transcript) {
        List<User> allStudents = userRepository.findAll(); // Filter by role STUDENT in prod
        List<Attendance> markedAttendance = new ArrayList<>();
        LocalDate today = LocalDate.now();

        String[] spokenWords = transcript.toLowerCase().split("\\s+");

        for (User student : allStudents) {
            if (isNameInTranscript(student.getFullName(), spokenWords)) {
                Attendance attendance = attendanceRepository.findByStudentIdAndDate(student.getId(), today)
                        .orElse(new Attendance());
                
                attendance.setStudent(student);
                attendance.setDate(today);
                attendance.setStatus(Attendance.Status.PRESENT);
                
                markedAttendance.add(attendanceRepository.save(attendance));
            }
        }
        return markedAttendance;
    }

    // Simple fuzzy matching logic
    private boolean isNameInTranscript(String fullName, String[] transcriptWords) {
        if (fullName == null) return false;
        String[] nameParts = fullName.toLowerCase().split("\\s+");
        
        // Check if first name matches any word in transcript
        for (String part : nameParts) {
            for (String word : transcriptWords) {
                if (calculateLevenshteinDistance(part, word) <= 1) { // Allow 1 char error
                    return true;
                }
            }
        }
        return false;
    }

    private int calculateLevenshteinDistance(String x, String y) {
        int[][] dp = new int[x.length() + 1][y.length() + 1];
        for (int i = 0; i <= x.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= y.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= x.length(); i++) {
            for (int j = 1; j <= y.length(); j++) {
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + (x.charAt(i - 1) == y.charAt(j - 1) ? 0 : 1));
            }
        }
        return dp[x.length()][y.length()];
    }
    
    public List<ClassDocument> getAllDocuments() {
        return documentRepository.findAll();
    }

    @Transactional
    public boolean deleteDocument(Long documentId) {
        ClassDocument doc = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));

        // Delete all quizzes linked to this document (and their attempts)
        List<Quiz> quizzes = quizRepository.findByDocumentId(documentId);
        for (Quiz quiz : quizzes) {
            List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quiz.getId());
            if (!attempts.isEmpty()) {
                quizAttemptRepository.deleteAll(attempts);
                log.info("Deleted {} attempts for quiz {}", attempts.size(), quiz.getId());
            }
        }
        if (!quizzes.isEmpty()) {
            quizRepository.deleteAll(quizzes);
            log.info("Deleted {} quizzes for document {}", quizzes.size(), documentId);
        }

        // Delete the physical file
        if (doc.getFilePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(doc.getFilePath()));
                log.info("Deleted file: {}", doc.getFilePath());
            } catch (IOException e) {
                log.warn("Could not delete file {}: {}", doc.getFilePath(), e.getMessage());
            }
        }

        documentRepository.delete(doc);
        log.info("Deleted document: {} ({})", doc.getFilename(), documentId);
        return true;
    }
    
    public List<Attendance> getTodayAttendance() {
        return attendanceRepository.findByDate(LocalDate.now());
    }
}

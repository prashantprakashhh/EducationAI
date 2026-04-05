package com.eduai.service;

import com.eduai.model.*;
import com.eduai.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MimeType;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamPrepService {

    private final ClassDocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ExamPaperSetRepository examPaperSetRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ChatModel is optional - app can start without Gemini API key
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ChatModel chatModel;

    private static final String UPLOAD_DIR = "uploads/";

    @Transactional
    public Map<String, Object> uploadPaperToSet(MultipartFile file, Long userId,
            String examName, String subject, Long existingSetId) throws IOException {

        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) directory.mkdirs();

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());

        ClassDocument doc = new ClassDocument();
        doc.setFilename(file.getOriginalFilename());
        doc.setFilePath(filePath.toString());
        doc.setContentType(file.getContentType());
        doc.setSize(file.getSize());
        doc.setProcessed(false);
        doc = documentRepository.save(doc);

        String fileContent = extractFullText(filePath);
        log.info("Extracted {} characters from {}", fileContent.length(), file.getOriginalFilename());

        ExamPaperSet paperSet;
        if (existingSetId != null) {
            paperSet = examPaperSetRepository.findById(existingSetId)
                .orElseThrow(() -> new RuntimeException("Paper set not found: " + existingSetId));
        } else {
            paperSet = new ExamPaperSet();
            paperSet.setExamName(examName);
            paperSet.setSubject(subject);
            paperSet.setUploadedByUserId(userId);
            paperSet.setPaperCount(0);
            paperSet.setTotalSourceQuestions(0);
            paperSet.setPaperFilenames("[]");
            paperSet.setDocumentIds("[]");
            paperSet.setCombinedContent("");
            paperSet.setStatus(ExamPaperSet.Status.UPLOADING);
        }

        try {
            List<String> filenames = objectMapper.readValue(paperSet.getPaperFilenames(), new TypeReference<List<String>>(){});
            filenames.add(file.getOriginalFilename());
            paperSet.setPaperFilenames(objectMapper.writeValueAsString(filenames));
            List<Long> docIds = objectMapper.readValue(paperSet.getDocumentIds(), new TypeReference<List<Long>>(){});
            docIds.add(doc.getId());
            paperSet.setDocumentIds(objectMapper.writeValueAsString(docIds));
        } catch (Exception e) {
            paperSet.setPaperFilenames("[\"" + file.getOriginalFilename() + "\"]");
            paperSet.setDocumentIds("[" + doc.getId() + "]");
        }

        // Store actual file path for multimodal AI (sending the raw PDF to Gemini)
        try {
            String existingPaths = paperSet.getFilePaths();
            List<String> paths = (existingPaths != null && !existingPaths.isBlank())
                ? objectMapper.readValue(existingPaths, new TypeReference<List<String>>(){})
                : new ArrayList<>();
            paths.add(filePath.toString());
            paperSet.setFilePaths(objectMapper.writeValueAsString(paths));
        } catch (Exception e) {
            paperSet.setFilePaths("[\"" + filePath.toString() + "\"]");
        }

        // Also extract text as fallback (works for text-based PDFs)
        String existing = paperSet.getCombinedContent() != null ? paperSet.getCombinedContent() : "";
        paperSet.setCombinedContent(existing + "\n\n========== PAPER: " + file.getOriginalFilename() + " ==========\n\n" + fileContent);
        paperSet.setPaperCount(paperSet.getPaperCount() + 1);
        paperSet = examPaperSetRepository.save(paperSet);

        doc.setProcessed(true);
        doc.setSummary("Extracted " + fileContent.length() + " chars, exam set " + paperSet.getId());
        documentRepository.save(doc);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("paperSetId", paperSet.getId());
        result.put("documentId", doc.getId());
        result.put("filename", file.getOriginalFilename());
        result.put("paperCount", paperSet.getPaperCount());
        result.put("extractedChars", fileContent.length());
        result.put("status", paperSet.getStatus().name());
        return result;
    }

    private String extractFullText(Path filePath) {
        String filename = filePath.getFileName().toString().toLowerCase();
        if (filename.endsWith(".pdf")) {
            return extractPdfText(filePath);
        }
        try {
            return Files.readString(filePath);
        } catch (IOException e) {
            log.error("Failed to read file: {}", filePath, e);
            return "[ERROR: Could not read " + filePath.getFileName() + "]";
        }
    }

    private String extractPdfText(Path filePath) {
        try {
            File pdfFile = filePath.toFile();
            try (PDDocument document = Loader.loadPDF(pdfFile)) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                String text = stripper.getText(document);
                int pages = document.getNumberOfPages();
                log.info("PDF {}: {} pages, {} chars", filePath.getFileName(), pages, text.length());
                return text;
            }
        } catch (Exception e) {
            log.error("PDFBox failed for {}: {}", filePath, e.getMessage());
            try { return Files.readString(filePath); }
            catch (IOException ex) { return "[ERROR: PDF extraction failed for " + filePath.getFileName() + "]"; }
        }
    }

    @Transactional
    public Quiz generateQuizFromPaperSet(Long paperSetId, Integer questionCount) {
        ExamPaperSet paperSet = examPaperSetRepository.findById(paperSetId)
            .orElseThrow(() -> new RuntimeException("Paper set not found"));
        if (chatModel == null) throw new IllegalStateException("AI not configured. Set GEMINI_API_KEY.");

        paperSet.setStatus(ExamPaperSet.Status.PROCESSING);
        examPaperSetRepository.save(paperSet);

        String examName = paperSet.getExamName() != null ? paperSet.getExamName() : "Practice Exam";
        String subject = paperSet.getSubject() != null ? paperSet.getSubject() : "";
        int papersCnt = paperSet.getPaperCount() != null ? paperSet.getPaperCount() : 1;
        boolean autoDetect = (questionCount == null || questionCount <= 0);
        int requested = autoDetect ? 0 : questionCount;

        try {
            log.info("Generating quiz: {} papers, '{}', count={}", papersCnt, examName, autoDetect ? "AUTO" : requested);

            // ─── RENDER PDF PAGES TO IMAGES FOR GEMINI VISION ───
            // The OpenAI-compatible endpoint supports inline base64 images.
            // We render each PDF page to a PNG image so Gemini can visually read
            // scanned papers, diagrams, formulas, everything.
            List<Media> pageImages = renderPdfPagesToImages(getPaperFilePaths(paperSet));

            String promptText;
            String jsonResponse;

            if (!pageImages.isEmpty()) {
                // MULTIMODAL: Send page images to Gemini via vision API
                promptText = buildPrompt(examName, subject, requested, autoDetect, papersCnt, null);
                log.info("Sending {} page images to AI for visual reading", pageImages.size());
                UserMessage userMessage = new UserMessage(promptText, pageImages);
                jsonResponse = chatModel.call(new Prompt(List.of(userMessage)))
                    .getResult().getOutput().getText();
                log.info("Generated quiz using VISION (PDF pages rendered as images)");
            } else {
                // Fallback: use extracted text (for text-based PDFs or if rendering fails)
                promptText = buildPrompt(examName, subject, requested, autoDetect, papersCnt, paperSet.getCombinedContent());
                jsonResponse = chatModel.call(new Prompt(promptText))
                    .getResult().getOutput().getText();
                log.info("Generated quiz using text extraction fallback");
            }

            jsonResponse = cleanJson(jsonResponse);

            List<Map<String, Object>> questions = objectMapper.readValue(jsonResponse, new TypeReference<List<Map<String, Object>>>(){});
            log.info("AI generated {} questions (first pass)", questions.size());

            List<String> paths = getPaperFilePaths(paperSet);
            if (!autoDetect && questions.size() < requested && questions.size() >= 5) {
                questions = generateMore(questions, requested, examName, subject, paths, paperSet.getCombinedContent());
                jsonResponse = objectMapper.writeValueAsString(questions);
            }

            Quiz quiz = new Quiz();
            quiz.setTitle(examName + (!subject.isBlank() ? " - " + subject : "") + " (AI Generated)");
            quiz.setQuestionsJson(jsonResponse);
            quiz.setExamPaperSet(paperSet);
            quiz.setExamName(examName);
            quiz.setSubject(subject);
            quiz.setQuestionCount(questions.size());
            quiz.setSourceInfo(papersCnt + " paper(s) analyzed");
            quiz = quizRepository.save(quiz);

            paperSet.setStatus(ExamPaperSet.Status.READY);
            paperSet.setTotalSourceQuestions(questions.size());
            paperSet.setProcessedAt(LocalDateTime.now());
            examPaperSetRepository.save(paperSet);
            return quiz;
        } catch (Exception e) {
            log.error("Quiz generation failed: {}", e.getMessage(), e);
            paperSet.setStatus(ExamPaperSet.Status.FAILED);
            examPaperSetRepository.save(paperSet);
            throw new RuntimeException("Quiz generation failed: " + e.getMessage());
        }
    }

    /**
     * Renders all pages of all PDFs to PNG images for Gemini vision API.
     * Each page becomes a separate Media object with image/png MIME type.
     * Uses 150 DPI for good readability while keeping size manageable.
     */
    private List<Media> renderPdfPagesToImages(List<String> filePaths) {
        List<Media> images = new ArrayList<>();
        MimeType pngMime = MimeType.valueOf("image/png");

        for (String path : filePaths) {
            File pdfFile = new File(path);
            if (!pdfFile.exists() || !path.toLowerCase().endsWith(".pdf")) {
                log.warn("Skipping non-existent or non-PDF file: {}", path);
                continue;
            }

            try (PDDocument document = Loader.loadPDF(pdfFile)) {
                PDFRenderer renderer = new PDFRenderer(document);
                int pageCount = document.getNumberOfPages();
                log.info("Rendering {} pages from: {}", pageCount, pdfFile.getName());

                for (int i = 0; i < pageCount; i++) {
                    try {
                        // Render at 150 DPI — good balance of readability vs size
                        BufferedImage pageImage = renderer.renderImageWithDPI(i, 150);
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        ImageIO.write(pageImage, "png", baos);
                        byte[] imageBytes = baos.toByteArray();

                        ByteArrayResource resource = new ByteArrayResource(imageBytes);
                        images.add(new Media(pngMime, resource));
                        log.debug("Rendered page {} of {} ({} KB)", i + 1, pdfFile.getName(), imageBytes.length / 1024);
                    } catch (Exception e) {
                        log.warn("Failed to render page {} of {}: {}", i + 1, pdfFile.getName(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to open PDF for rendering: {}: {}", pdfFile.getName(), e.getMessage());
            }
        }

        log.info("Total page images rendered: {}", images.size());
        return images;
    }

    private List<String> getPaperFilePaths(ExamPaperSet paperSet) {
        try {
            if (paperSet.getFilePaths() != null && !paperSet.getFilePaths().isBlank()) {
                return objectMapper.readValue(paperSet.getFilePaths(), new TypeReference<List<String>>(){});
            }
        } catch (Exception e) {
            log.warn("Could not parse file paths: {}", e.getMessage());
        }
        return List.of();
    }

    private List<Map<String, Object>> generateMore(List<Map<String, Object>> existing, int target,
            String examName, String subject, List<String> filePaths, String textContent) {
        List<Map<String, Object>> all = new ArrayList<>(existing);

        // Pre-render images once for all rounds (reuse across chunk calls)
        List<Media> pageImages = renderPdfPagesToImages(filePaths);

        for (int round = 0; round < 10 && all.size() < target; round++) {
            int remaining = Math.min(target - all.size(), 60);
            log.info("Chunk round {}: have {}, generating {} more", round + 1, all.size(), remaining);
            Set<String> covered = new HashSet<>();
            for (Map<String, Object> q : all) covered.add((String) q.getOrDefault("topic", ""));

            String promptText = "You are continuing to generate exam questions for \"" + examName + "\" " +
                (subject != null && !subject.isBlank() ? "(" + subject + ") " : "") +
                ". You already generated " + all.size() + " questions covering: " + String.join(", ", covered) +
                ". Now generate " + remaining + " MORE original questions in the exact same exam style. " +
                "Do NOT repeat concepts. Cover under-represented topics. " +
                "Return ONLY raw JSON array: [{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctIndex\":0,\"explanation\":\"...\",\"topic\":\"...\",\"difficulty\":\"...\"}]" +
                "\n\nRefer to the attached source paper page images for style and content reference.";

            try {
                String resp;
                if (!pageImages.isEmpty()) {
                    // Send page images for visual reference
                    UserMessage msg = new UserMessage(promptText, pageImages);
                    resp = chatModel.call(new Prompt(List.of(msg))).getResult().getOutput().getText();
                } else {
                    // Fallback to text
                    resp = chatModel.call(new Prompt(promptText + "\n\nSOURCE:\n" + (textContent != null ? textContent : ""))).getResult().getOutput().getText();
                }
                resp = cleanJson(resp);
                List<Map<String, Object>> newQ = objectMapper.readValue(resp, new TypeReference<List<Map<String, Object>>>(){});
                all.addAll(newQ);
                log.info("Round {} added {}, total: {}", round + 1, newQ.size(), all.size());
            } catch (Exception e) {
                log.warn("Chunk round {} failed: {}", round + 1, e.getMessage());
                break;
            }
        }
        if (all.size() > target) all = new ArrayList<>(all.subList(0, target));
        return all;
    }

    @Transactional
    public Map<String, Object> submitAndAnalyze(Long userId, Long quizId, List<Integer> answers, Integer timeTakenSeconds) {
        User student = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));

        List<Map<String, Object>> questions;
        try { questions = objectMapper.readValue(quiz.getQuestionsJson(), new TypeReference<List<Map<String, Object>>>(){}); }
        catch (Exception e) { throw new RuntimeException("Invalid quiz data"); }

        int total = questions.size(), score = 0;
        List<Map<String, Object>> wrongQuestions = new ArrayList<>();
        Map<String, int[]> topicStats = new LinkedHashMap<>();
        Map<String, List<String>> topicWrongDetails = new LinkedHashMap<>();

        for (int i = 0; i < total; i++) {
            Map<String, Object> q = questions.get(i);
            int correctIdx = ((Number) q.get("correctIndex")).intValue();
            int selectedIdx = (i < answers.size()) ? answers.get(i) : -1;
            String topic = (String) q.getOrDefault("topic", "General");
            String difficulty = (String) q.getOrDefault("difficulty", "medium");
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) q.get("options");

            topicStats.computeIfAbsent(topic, k -> new int[]{0, 0});
            topicStats.get(topic)[1]++;

            if (selectedIdx == correctIdx) {
                score++;
                topicStats.get(topic)[0]++;
            } else {
                Map<String, Object> wrong = new LinkedHashMap<>();
                wrong.put("questionIndex", i);
                wrong.put("question", q.get("question"));
                wrong.put("selectedAnswer", (selectedIdx >= 0 && options != null && selectedIdx < options.size()) ? options.get(selectedIdx) : "Not answered");
                wrong.put("correctAnswer", options != null ? options.get(correctIdx) : "N/A");
                wrong.put("explanation", q.getOrDefault("explanation", ""));
                wrong.put("topic", topic);
                wrong.put("difficulty", difficulty);
                wrongQuestions.add(wrong);
                topicWrongDetails.computeIfAbsent(topic, k -> new ArrayList<>());
                topicWrongDetails.get(topic).add((String) q.get("question"));
            }
        }

        List<Map<String, Object>> topicBreakdown = new ArrayList<>();
        List<String> weakTopics = new ArrayList<>(), strongTopics = new ArrayList<>();
        for (Map.Entry<String, int[]> entry : topicStats.entrySet()) {
            double pct = entry.getValue()[1] > 0 ? Math.round((entry.getValue()[0] * 100.0 / entry.getValue()[1]) * 10.0) / 10.0 : 0;
            Map<String, Object> tb = new LinkedHashMap<>();
            tb.put("topic", entry.getKey()); tb.put("correct", entry.getValue()[0]); tb.put("total", entry.getValue()[1]); tb.put("percentage", pct);
            topicBreakdown.add(tb);
            if (pct < 50) weakTopics.add(entry.getKey());
            else if (pct >= 80) strongTopics.add(entry.getKey());
        }

        List<String> recommendations = getRecommendations(quiz, score, total, weakTopics, strongTopics, topicStats, topicWrongDetails);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz); attempt.setStudent(student); attempt.setScore(score); attempt.setTotalQuestions(total); attempt.setTimeTakenSeconds(timeTakenSeconds);
        try { attempt.setAnswersJson(objectMapper.writeValueAsString(answers)); } catch (Exception e) { attempt.setAnswersJson("[]"); }
        try { attempt.setAnalysisJson(objectMapper.writeValueAsString(Map.of("weakTopics", weakTopics, "strongTopics", strongTopics, "topicBreakdown", topicBreakdown, "recommendations", recommendations))); }
        catch (Exception e) { attempt.setAnalysisJson("{}"); }
        quizAttemptRepository.save(attempt);

        double percentage = total > 0 ? Math.round((score * 100.0 / total) * 10.0) / 10.0 : 0;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score); result.put("totalQuestions", total); result.put("percentage", percentage); result.put("timeTakenSeconds", timeTakenSeconds);
        result.put("wrongQuestions", wrongQuestions); result.put("topicBreakdown", topicBreakdown);
        result.put("weakTopics", weakTopics); result.put("strongTopics", strongTopics); result.put("recommendations", recommendations);
        return result;
    }

    public Map<String, Object> getStudentInsights(Long userId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentIdOrderByCompletedAtDesc(userId);
        Map<String, Object> insights = new LinkedHashMap<>();
        if (attempts.isEmpty()) { insights.put("totalAttempts", 0); insights.put("message", "No attempts yet."); return insights; }

        double avgScore = attempts.stream().mapToDouble(a -> a.getTotalQuestions() > 0 ? (a.getScore() * 100.0 / a.getTotalQuestions()) : 0).average().orElse(0);
        Map<String, int[]> cumulative = new LinkedHashMap<>();
        for (QuizAttempt attempt : attempts) {
            try {
                if (attempt.getAnalysisJson() != null && !attempt.getAnalysisJson().equals("{}")) {
                    Map<String, Object> analysis = objectMapper.readValue(attempt.getAnalysisJson(), new TypeReference<Map<String, Object>>(){});
                    @SuppressWarnings("unchecked") List<Map<String, Object>> bd = (List<Map<String, Object>>) analysis.get("topicBreakdown");
                    if (bd != null) for (Map<String, Object> tb : bd) {
                        String t = (String) tb.get("topic"); int c = ((Number) tb.get("correct")).intValue(); int tot = ((Number) tb.get("total")).intValue();
                        cumulative.computeIfAbsent(t, k -> new int[]{0,0}); cumulative.get(t)[0] += c; cumulative.get(t)[1] += tot;
                    }
                }
            } catch (Exception e) { log.warn("Parse error for attempt {}", attempt.getId()); }
        }

        List<Map<String, Object>> cbd = new ArrayList<>(); List<String> weak = new ArrayList<>(), mastered = new ArrayList<>();
        for (Map.Entry<String, int[]> e : cumulative.entrySet()) {
            double p = e.getValue()[1] > 0 ? Math.round((e.getValue()[0] * 100.0 / e.getValue()[1]) * 10.0) / 10.0 : 0;
            cbd.add(Map.of("topic", e.getKey(), "correct", e.getValue()[0], "total", e.getValue()[1], "percentage", p));
            if (p < 50) weak.add(e.getKey()); else if (p >= 85) mastered.add(e.getKey());
        }

        List<Map<String, Object>> trend = attempts.stream().limit(5).map(a -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("quizTitle", a.getQuiz() != null ? a.getQuiz().getTitle() : "Quiz");
            p.put("score", a.getScore()); p.put("total", a.getTotalQuestions());
            p.put("percentage", a.getTotalQuestions() > 0 ? Math.round((a.getScore() * 100.0 / a.getTotalQuestions()) * 10.0) / 10.0 : 0);
            p.put("date", a.getCompletedAt() != null ? a.getCompletedAt().toString() : ""); return p;
        }).collect(Collectors.toList());

        insights.put("totalAttempts", attempts.size()); insights.put("averageScore", Math.round(avgScore * 10.0) / 10.0);
        insights.put("cumulativeTopicBreakdown", cbd); insights.put("persistentWeakAreas", weak);
        insights.put("masteredAreas", mastered); insights.put("recentTrend", trend);
        return insights;
    }

    public List<ExamPaperSet> getUserPaperSets(Long userId) { return examPaperSetRepository.findByUploadedByUserIdOrderByCreatedAtDesc(userId); }
    public ExamPaperSet getPaperSet(Long id) { return examPaperSetRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found")); }

    @Transactional
    public boolean deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
        // Delete all attempts for this quiz first (child records)
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quizId);
        if (!attempts.isEmpty()) {
            quizAttemptRepository.deleteAll(attempts);
            log.info("Deleted {} attempts for quiz {}", attempts.size(), quizId);
        }
        quizRepository.delete(quiz);
        log.info("Deleted quiz: {} ({})", quiz.getTitle(), quizId);
        return true;
    }

    private String buildPrompt(String examName, String subject, int count, boolean autoDetect, int papers, String content) {
        String countInstr = autoDetect
            ? "CRITICAL: Count the EXACT number of questions in the source paper(s). If the paper has 180 questions, generate EXACTLY 180. If 50, generate 50. If 200, generate 200. Match the EXACT count. Do NOT generate fewer."
            : "Generate EXACTLY " + count + " questions.";

        String sourceSection;
        if (content != null && !content.isBlank() && content.length() > 100) {
            sourceSection = "SOURCE PAPERS (" + papers + " documents):\n" + content;
        } else {
            sourceSection = "The source paper(s) are attached as PDF files. Read EVERY page, EVERY question, EVERY option, and EVERY solution/answer key from the attached PDF(s).";
        }

        return "You are the question paper setter for \"" + examName + "\"" + (subject != null && !subject.isBlank() ? " (" + subject + ")" : "") + ". " +
            "You have " + papers + " real previous year paper(s) with questions AND solutions.\n\n" +
            "YOUR JOB: Read EVERY SINGLE question in the source papers. Understand the EXACT patterns. " +
            "Generate a COMPLETE NEW paper with BRAND NEW questions INDISTINGUISHABLE from the real exam.\n\n" +
            countInstr + "\n\n" +
            "RULES:\n" +
            "- Match the EXACT section/subject distribution (e.g. Physics 45 + Chemistry 45 + Biology 90 = 180 for NEET)\n" +
            "- Match topic distribution, question types, difficulty spread, language style\n" +
            "- Each question: 4 options, correctIndex (0-based), thorough explanation, specific topic tag, difficulty (easy/medium/hard)\n" +
            "- Explanations must explain WHY correct answer is right AND WHY wrong options are wrong\n" +
            "- For numerical: show full step-by-step solution\n" +
            "- Questions must be ORIGINAL but identical in style to the source\n" +
            "- Do NOT water down difficulty. Match the actual exam level\n" +
            "- Do NOT generate generic textbook questions. Generate EXAM-LEVEL questions\n\n" +
            "OUTPUT: ONLY raw JSON array. No markdown. No code fences. No text before/after.\n" +
            "[{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctIndex\":0,\"explanation\":\"...\",\"topic\":\"...\",\"difficulty\":\"...\"}]\n\n" +
            sourceSection;
    }

    private List<String> getRecommendations(Quiz quiz, int score, int total, List<String> weak, List<String> strong,
            Map<String, int[]> stats, Map<String, List<String>> wrongDetails) {
        List<String> recs = new ArrayList<>();
        double pct = total > 0 ? (score * 100.0 / total) : 0;
        if (chatModel != null && total > 0) {
            try {
                StringBuilder d = new StringBuilder();
                for (Map.Entry<String, int[]> e : stats.entrySet()) {
                    double tp = e.getValue()[1] > 0 ? (e.getValue()[0] * 100.0 / e.getValue()[1]) : 0;
                    d.append("- ").append(e.getKey()).append(": ").append(e.getValue()[0]).append("/").append(e.getValue()[1]).append(" (").append(Math.round(tp)).append("%)");
                    List<String> missed = wrongDetails.get(e.getKey());
                    if (missed != null && !missed.isEmpty()) d.append(" — Wrong: ").append(missed.stream().limit(2).map(q -> q.length() > 80 ? q.substring(0, 80) + "..." : q).collect(Collectors.joining("; ")));
                    d.append("\n");
                }
                String prompt = "Student scored " + score + "/" + total + " (" + Math.round(pct) + "%) on " + (quiz.getExamName() != null ? quiz.getExamName() : "exam") +
                    ".\nTopic breakdown:\n" + d + "Weak (<50%): " + (weak.isEmpty() ? "None" : String.join(", ", weak)) +
                    "\nStrong (>80%): " + (strong.isEmpty() ? "None" : String.join(", ", strong)) +
                    "\nGive 5 specific actionable study recommendations. Reference topics. Be direct. One per line, numbered 1-5.";
                String aiRecs = chatModel.call(new Prompt(prompt)).getResult().getOutput().getText();
                for (String line : aiRecs.split("\\n")) {
                    line = line.trim().replaceAll("^\\d+\\.\\s*", "").replaceAll("^[-*]\\s*", "").trim();
                    if (!line.isEmpty() && line.length() > 15) recs.add(line);
                }
            } catch (Exception e) { log.warn("AI recs failed: {}", e.getMessage()); }
        }
        if (recs.isEmpty()) {
            if (!weak.isEmpty()) recs.add("Priority revision: " + String.join(", ", weak));
            if (!strong.isEmpty()) recs.add("Strong in: " + String.join(", ", strong));
            recs.add(pct < 40 ? "Focus on fundamentals first." : pct < 70 ? "Good base. Target weak topics." : "Excellent. Polish remaining gaps.");
        }
        return recs;
    }

    private String cleanJson(String r) {
        if (r == null) return "[]";
        r = r.trim().replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
        int s = r.indexOf('['), e = r.lastIndexOf(']');
        return (s >= 0 && e > s) ? r.substring(s, e + 1) : r;
    }
}

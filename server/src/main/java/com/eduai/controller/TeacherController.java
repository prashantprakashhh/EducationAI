package com.eduai.controller;

import com.eduai.auth.RequireRole;
import com.eduai.model.Attendance;
import com.eduai.model.ClassDocument;
import com.eduai.model.Quiz;
import com.eduai.model.QuizAttempt;
import com.eduai.model.User;
import com.eduai.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    // --- REST Endpoint for File Upload (easier for large files) ---
    @PostMapping("/api/teacher/upload")
    @ResponseBody
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN})
    public ResponseEntity<ClassDocument> uploadFile(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(teacherService.uploadDocument(file));
    }

    // Also allow students to upload question papers for self-prep
    @PostMapping("/api/student/upload-paper")
    @ResponseBody
    @RequireRole({User.Role.STUDENT})
    public ResponseEntity<ClassDocument> uploadPaper(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(teacherService.uploadDocument(file));
    }

    // --- GraphQL Endpoints ---

    @QueryMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN})
    public List<ClassDocument> allDocuments() {
        return teacherService.getAllDocuments();
    }

    @MutationMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN, User.Role.STUDENT})
    public String processDocument(@Argument Long id) {
        return teacherService.processDocument(id);
    }

    @QueryMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN, User.Role.STUDENT})
    public List<Quiz> quizzesForDocument(@Argument Long documentId) {
        return teacherService.getQuizzesForDocument(documentId);
    }

    @QueryMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN, User.Role.STUDENT})
    public List<Quiz> allQuizzes() {
        return teacherService.getAllQuizzes();
    }

    @MutationMapping
    @RequireRole({User.Role.STUDENT})
    public QuizAttempt submitQuiz(@Argument Long userId, @Argument Long quizId, @Argument List<Integer> answers, @Argument Integer timeTakenSeconds) {
        return teacherService.submitQuiz(userId, quizId, answers, timeTakenSeconds);
    }

    @MutationMapping
    @RequireRole({User.Role.STUDENT})
    public Map<String, Object> submitQuizWithAnalysis(@Argument Long userId, @Argument Long quizId, @Argument List<Integer> answers, @Argument Integer timeTakenSeconds) {
        return teacherService.submitQuizWithAnalysis(userId, quizId, answers, timeTakenSeconds);
    }

    @QueryMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN})
    public List<QuizAttempt> quizResults(@Argument Long quizId) {
        return teacherService.getQuizResults(quizId);
    }

    @QueryMapping
    @RequireRole({User.Role.STUDENT})
    public List<QuizAttempt> studentQuizHistory(@Argument Long userId) {
        return teacherService.getStudentQuizHistory(userId);
    }

    @MutationMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN})
    public Quiz generateQuiz(@Argument Long documentId) {
        return teacherService.generateQuiz(documentId);
    }

    @MutationMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN, User.Role.STUDENT})
    public Quiz generateExamQuiz(@Argument Long documentId, @Argument String examName, @Argument String subject, @Argument Integer questionCount) {
        return teacherService.generateExamQuiz(documentId, examName, subject, questionCount);
    }

    @MutationMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN})
    public List<Attendance> markAttendanceVoice(@Argument String transcript) {
        return teacherService.markAttendanceByVoice(transcript);
    }

    @MutationMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN})
    public Boolean deleteDocument(@Argument Long documentId) {
        return teacherService.deleteDocument(documentId);
    }

    @QueryMapping
    @RequireRole({User.Role.TEACHER, User.Role.ADMIN})
    public List<Attendance> todayAttendance() {
        return teacherService.getTodayAttendance();
    }
}

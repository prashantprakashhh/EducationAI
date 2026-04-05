package com.eduai.controller;

import com.eduai.auth.RequireRole;
import com.eduai.model.ExamPaperSet;
import com.eduai.model.Quiz;
import com.eduai.model.User;
import com.eduai.service.ExamPrepService;
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

/**
 * Controller for the Exam Prep system.
 * Handles multi-file upload (REST) and quiz generation/submission (GraphQL).
 */
@Controller
@RequiredArgsConstructor
public class ExamPrepController {

    private final ExamPrepService examPrepService;

    // ─── REST: Multi-File Upload ───

    /**
     * Upload a paper to an exam prep set.
     * First call: no paperSetId → creates new set, returns paperSetId.
     * Subsequent calls: include paperSetId → adds to existing set.
     */
    @PostMapping("/api/exam-prep/upload")
    @ResponseBody
    @RequireRole({User.Role.STUDENT, User.Role.TEACHER, User.Role.ADMIN})
    public ResponseEntity<Map<String, Object>> uploadPaper(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId,
            @RequestParam(value = "examName", required = false) String examName,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "paperSetId", required = false) Long paperSetId
    ) throws IOException {
        Map<String, Object> result = examPrepService.uploadPaperToSet(
            file, userId, examName, subject, paperSetId);
        return ResponseEntity.ok(result);
    }

    // ─── GraphQL: Quiz Generation & Submission ───

    @MutationMapping
    @RequireRole({User.Role.STUDENT, User.Role.TEACHER, User.Role.ADMIN})
    public Quiz generateQuizFromPapers(
            @Argument Long paperSetId,
            @Argument Integer questionCount
    ) {
        return examPrepService.generateQuizFromPaperSet(paperSetId, questionCount);
    }

    @MutationMapping
    @RequireRole({User.Role.STUDENT})
    public Map<String, Object> submitExamPrepQuiz(
            @Argument Long userId,
            @Argument Long quizId,
            @Argument List<Integer> answers,
            @Argument Integer timeTakenSeconds
    ) {
        return examPrepService.submitAndAnalyze(userId, quizId, answers, timeTakenSeconds);
    }

    @QueryMapping
    @RequireRole({User.Role.STUDENT, User.Role.TEACHER, User.Role.ADMIN})
    public Map<String, Object> studentExamInsights(@Argument Long userId) {
        return examPrepService.getStudentInsights(userId);
    }

    @QueryMapping
    @RequireRole({User.Role.STUDENT, User.Role.TEACHER, User.Role.ADMIN})
    public List<ExamPaperSet> userPaperSets(@Argument Long userId) {
        return examPrepService.getUserPaperSets(userId);
    }

    @QueryMapping
    @RequireRole({User.Role.STUDENT, User.Role.TEACHER, User.Role.ADMIN})
    public ExamPaperSet paperSetDetails(@Argument Long paperSetId) {
        return examPrepService.getPaperSet(paperSetId);
    }

    @MutationMapping
    @RequireRole({User.Role.STUDENT, User.Role.TEACHER, User.Role.ADMIN})
    public Boolean deleteQuiz(@Argument Long quizId) {
        return examPrepService.deleteQuiz(quizId);
    }
}

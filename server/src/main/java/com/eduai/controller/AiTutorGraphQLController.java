package com.eduai.controller;

import com.eduai.model.Message;
import com.eduai.service.AiTutorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class AiTutorGraphQLController {
    
    private final AiTutorService aiTutorService;
    
    @Autowired
    public AiTutorGraphQLController(AiTutorService aiTutorService) {
        this.aiTutorService = aiTutorService;
    }
    
    /**
     * Send a message to the AI tutor and receive a response
     */
    @MutationMapping
    public Message chatWithTutor(
            @Argument Long userId,
            @Argument String message,
            @Argument String persona) {
        
        // Default to SOCRATIC if no persona specified
        String selectedPersona = persona != null ? persona : "SOCRATIC";
        return aiTutorService.chat(userId, message, selectedPersona);
    }
    
    /**
     * Get personalized study suggestions
     */
    @QueryMapping
    public String studySuggestions(@Argument Long userId) {
        return aiTutorService.getStudySuggestions(userId);
    }
    
    /**
     * Generate a quiz question
     */
    @QueryMapping
    public QuizQuestion generateQuiz(@Argument Long userId, @Argument String subject) {
        Map<String, Object> quizData = aiTutorService.generateQuizQuestion(userId, subject);
        
        QuizQuestion quiz = new QuizQuestion();
        quiz.setQuestion((String) quizData.get("question"));
        quiz.setOptions((java.util.List<String>) quizData.get("options"));
        quiz.setCorrectAnswer((String) quizData.get("correctAnswer"));
        quiz.setExplanation((String) quizData.get("explanation"));
        
        return quiz;
    }
    
    // Inner class for quiz response
    public static class QuizQuestion {
        private String question;
        private java.util.List<String> options;
        private String correctAnswer;
        private String explanation;
        
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        
        public java.util.List<String> getOptions() { return options; }
        public void setOptions(java.util.List<String> options) { this.options = options; }
        
        public String getCorrectAnswer() { return correctAnswer; }
        public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
        
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
    }
}

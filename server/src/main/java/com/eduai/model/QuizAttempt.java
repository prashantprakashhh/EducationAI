package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "quiz_attempts")
public class QuizAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    private Integer score;
    private Integer totalQuestions;
    private Integer timeTakenSeconds;     // how long the student took
    
    @Column(columnDefinition = "TEXT")
    private String answersJson;           // [0, 2, 1, 3, -1, ...] student's selected indices
    
    @Column(columnDefinition = "TEXT")
    private String analysisJson;          // AI-generated analysis: {"weakTopics":["Cell Biology","Genetics"],"strongTopics":["Ecology"],"recommendations":["Focus on..."],"topicBreakdown":[{"topic":"...","correct":2,"total":5}]}

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        completedAt = LocalDateTime.now();
    }
}
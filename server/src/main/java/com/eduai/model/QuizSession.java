package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Represents a quiz session - can be from Preparatory mode or regular quiz.
 */
@Entity
@Table(name = "quiz_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String subject; // e.g., "Mathematics", "Physics"
    
    @Column(length = 100)
    private String topic; // Specific topic within subject
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuizType quizType;
    
    @Column(nullable = false)
    private Integer totalQuestions;
    
    @Column(nullable = false)
    private Integer correctAnswers;
    
    @Column(nullable = false)
    private Integer wrongAnswers;
    
    // Calculated accuracy percentage
    @Column(nullable = false)
    private Double accuracy;
    
    @Column(nullable = false)
    private Integer xpEarned;
    
    @Column(nullable = false)
    private LocalDateTime startedAt;
    
    @Column
    private LocalDateTime completedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;
    
    // Duration in seconds
    @Column
    private Integer durationSeconds;
    
    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        status = SessionStatus.IN_PROGRESS;
        if (accuracy == null) accuracy = 0.0;
        if (xpEarned == null) xpEarned = 0;
    }
    
    public void complete() {
        this.completedAt = LocalDateTime.now();
        this.status = SessionStatus.COMPLETED;
        if (startedAt != null && completedAt != null) {
            this.durationSeconds = (int) java.time.Duration.between(startedAt, completedAt).getSeconds();
        }
        // Calculate accuracy
        if (totalQuestions > 0) {
            this.accuracy = (double) correctAnswers / totalQuestions * 100;
        }
        // Calculate XP: base 10 per correct answer + bonus for accuracy
        this.xpEarned = correctAnswers * 10;
        if (accuracy >= 80) xpEarned += 20; // Bonus for 80%+
        if (accuracy >= 90) xpEarned += 30; // Additional bonus for 90%+
        if (accuracy == 100) xpEarned += 50; // Perfect score bonus
    }
    
    public enum QuizType {
        QUICK_QUIZ,      // Short quiz during regular chat
        PREPARATORY,     // Full exam prep session
        TOPIC_PRACTICE,  // Practice specific topic
        DAILY_CHALLENGE  // Daily challenge quiz
    }
    
    public enum SessionStatus {
        IN_PROGRESS,
        COMPLETED,
        ABANDONED
    }
}

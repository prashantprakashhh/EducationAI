package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tracks daily learning activity for streaks and progress.
 */
@Entity
@Table(name = "learning_sessions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "session_date"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private LocalDate sessionDate;
    
    // Total time spent learning in minutes
    @Column(nullable = false)
    private Integer totalMinutes;
    
    // Number of chat messages exchanged
    @Column(nullable = false)
    private Integer chatMessages;
    
    // Number of quizzes taken
    @Column(nullable = false)
    private Integer quizzesTaken;
    
    // Total XP earned this day
    @Column(nullable = false)
    private Integer xpEarned;
    
    @Column
    private LocalDateTime lastActivity;
    
    @PrePersist
    protected void onCreate() {
        if (sessionDate == null) sessionDate = LocalDate.now();
        if (totalMinutes == null) totalMinutes = 0;
        if (chatMessages == null) chatMessages = 0;
        if (quizzesTaken == null) quizzesTaken = 0;
        if (xpEarned == null) xpEarned = 0;
        lastActivity = LocalDateTime.now();
    }
    
    public void addActivity(int minutes, int messages, int quizzes, int xp) {
        this.totalMinutes += minutes;
        this.chatMessages += messages;
        this.quizzesTaken += quizzes;
        this.xpEarned += xp;
        this.lastActivity = LocalDateTime.now();
    }
}

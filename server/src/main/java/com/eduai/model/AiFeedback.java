package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Stores student feedback about AI interactions.
 * This helps us improve the AI tutor over time.
 */
@Entity
@Table(name = "ai_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiFeedback {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private Message relatedMessage; // The AI message this feedback is about
    
    @Column(nullable = false)
    private Integer rating; // 1-5 stars
    
    @Enumerated(EnumType.STRING)
    private FeedbackCategory category;
    
    @Column(length = 1000)
    private String comment; // Optional detailed feedback
    
    @Column(nullable = false)
    private String persona; // Which AI persona was used
    
    @Column(length = 100)
    private String topic; // What subject/topic was being discussed
    
    @Column(nullable = false)
    private Boolean wasHelpful;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum FeedbackCategory {
        EXPLANATION_CLARITY,    // Was the explanation clear?
        RESPONSE_RELEVANCE,     // Was the response relevant to my question?
        TEACHING_STYLE,         // Did I like how it taught me?
        ENGAGEMENT_LEVEL,       // Was it engaging/interesting?
        ACCURACY,               // Was the information accurate?
        PACE,                   // Was it too fast or too slow?
        GENERAL                 // General feedback
    }
}

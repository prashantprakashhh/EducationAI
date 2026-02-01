package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Tracks badges/achievements earned by students.
 * Badges are awarded based on quiz performance, streaks, and milestones.
 */
@Entity
@Table(name = "badges", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "badge_type"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Badge {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BadgeType badgeType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BadgeLevel level;
    
    @Column(nullable = false)
    private LocalDateTime earnedAt;
    
    @Column(length = 500)
    private String description;
    
    @PrePersist
    protected void onCreate() {
        earnedAt = LocalDateTime.now();
    }
    
    public enum BadgeType {
        // Accuracy based (from Preparatory mode)
        ACCURACY_BEGINNER,    // First quiz with 70%+ accuracy
        ACCURACY_INTERMEDIATE, // Average 80%+ across 5 quizzes
        ACCURACY_EXPERT,      // Average 90%+ across 10 quizzes
        PERFECT_SCORE,        // 100% on any quiz
        
        // Streak based
        STREAK_STARTER,       // 3 day learning streak
        STREAK_WARRIOR,       // 7 day learning streak
        STREAK_CHAMPION,      // 30 day learning streak
        
        // Volume based
        QUIZ_ROOKIE,          // Complete 5 quizzes
        QUIZ_VETERAN,         // Complete 25 quizzes
        QUIZ_MASTER,          // Complete 100 quizzes
        
        // Subject mastery
        MATH_WHIZ,            // 85%+ average in Math
        SCIENCE_STAR,         // 85%+ average in Science
        LANGUAGE_LOVER,       // 85%+ average in Language
        
        // Special achievements
        FIRST_CHAT,           // First conversation with AI tutor
        CURIOUS_MIND,         // Asked 50 questions
        KNOWLEDGE_SEEKER,     // Completed profile with all interests
        EARLY_BIRD,           // Study session before 7 AM
        NIGHT_OWL,            // Study session after 10 PM
        FAST_LEARNER,         // Complete quiz in under 5 minutes with 80%+
        
        // XP milestones
        XP_MILESTONE_100,
        XP_MILESTONE_500,
        XP_MILESTONE_1000,
        XP_MILESTONE_5000
    }
    
    public enum BadgeLevel {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM
    }
    
    // Static factory methods for badge creation
    public static Badge createAccuracyBadge(User user, BadgeType type, double accuracy) {
        Badge badge = new Badge();
        badge.setUser(user);
        badge.setBadgeType(type);
        badge.setDescription("Achieved " + String.format("%.1f", accuracy) + "% accuracy");
        
        if (accuracy >= 95) badge.setLevel(BadgeLevel.PLATINUM);
        else if (accuracy >= 90) badge.setLevel(BadgeLevel.GOLD);
        else if (accuracy >= 80) badge.setLevel(BadgeLevel.SILVER);
        else badge.setLevel(BadgeLevel.BRONZE);
        
        return badge;
    }
    
    public static Badge createStreakBadge(User user, BadgeType type, int streakDays) {
        Badge badge = new Badge();
        badge.setUser(user);
        badge.setBadgeType(type);
        badge.setDescription(streakDays + " day learning streak!");
        
        if (streakDays >= 30) badge.setLevel(BadgeLevel.PLATINUM);
        else if (streakDays >= 14) badge.setLevel(BadgeLevel.GOLD);
        else if (streakDays >= 7) badge.setLevel(BadgeLevel.SILVER);
        else badge.setLevel(BadgeLevel.BRONZE);
        
        return badge;
    }
}

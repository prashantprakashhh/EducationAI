package com.eduai.service;

import com.eduai.model.*;
import com.eduai.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {
    
    private final QuizSessionRepository quizSessionRepository;
    private final BadgeRepository badgeRepository;
    private final LearningSessionRepository learningSessionRepository;
    private final UserRepository userRepository;
    
    /**
     * Get comprehensive progress stats for a user
     */
    public ProgressStats getProgressStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ProgressStats stats = new ProgressStats();
        
        // Learning stats
        Integer totalMinutes = learningSessionRepository.getTotalLearningMinutes(user);
        stats.setTotalLearningMinutes(totalMinutes != null ? totalMinutes : 0);
        stats.setTotalLearningHours(stats.getTotalLearningMinutes() / 60.0);
        
        Integer learningDays = learningSessionRepository.countLearningDays(user);
        stats.setTotalLearningDays(learningDays != null ? learningDays : 0);
        
        // Quiz stats
        Integer completedQuizzes = quizSessionRepository.countCompletedQuizzes(user);
        stats.setTotalQuizzes(completedQuizzes != null ? completedQuizzes : 0);
        
        Double avgAccuracy = quizSessionRepository.getAverageAccuracy(user);
        stats.setAverageQuizAccuracy(avgAccuracy != null ? avgAccuracy : 0.0);
        
        Integer perfectScores = quizSessionRepository.countPerfectScores(user);
        stats.setPerfectScores(perfectScores != null ? perfectScores : 0);
        
        // XP stats
        Integer quizXp = quizSessionRepository.getTotalXpFromQuizzes(user);
        Integer sessionXp = learningSessionRepository.getTotalXpEarned(user);
        stats.setTotalXp((quizXp != null ? quizXp : 0) + (sessionXp != null ? sessionXp : 0));
        
        // Streak calculation
        stats.setCurrentStreak(calculateStreak(user));
        
        // Chat stats
        Integer chatMessages = learningSessionRepository.getTotalChatMessages(user);
        stats.setTotalChatMessages(chatMessages != null ? chatMessages : 0);
        
        // Badge count
        Integer badgeCount = badgeRepository.countUserBadges(user);
        stats.setTotalBadges(badgeCount != null ? badgeCount : 0);
        
        return stats;
    }
    
    /**
     * Calculate current learning streak
     */
    private int calculateStreak(User user) {
        List<LocalDate> dates = learningSessionRepository.getSessionDates(user);
        if (dates.isEmpty()) return 0;
        
        int streak = 0;
        LocalDate today = LocalDate.now();
        LocalDate expectedDate = today;
        
        for (LocalDate date : dates) {
            // Allow for today or yesterday as the start
            if (streak == 0 && ChronoUnit.DAYS.between(date, today) <= 1) {
                streak = 1;
                expectedDate = date.minusDays(1);
            } else if (date.equals(expectedDate)) {
                streak++;
                expectedDate = date.minusDays(1);
            } else {
                break; // Streak broken
            }
        }
        
        return streak;
    }
    
    /**
     * Get all badges for a user
     */
    public List<Badge> getUserBadges(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return badgeRepository.findByUserOrderByEarnedAtDesc(user);
    }
    
    /**
     * Get recent quiz sessions
     */
    public List<QuizSession> getRecentQuizzes(Long userId, int limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return quizSessionRepository.getRecentQuizzes(user, limit);
    }
    
    /**
     * Start a new quiz session
     */
    @Transactional
    public QuizSession startQuizSession(Long userId, String subject, String topic, 
            QuizSession.QuizType quizType, int totalQuestions) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        QuizSession session = new QuizSession();
        session.setUser(user);
        session.setSubject(subject);
        session.setTopic(topic);
        session.setQuizType(quizType);
        session.setTotalQuestions(totalQuestions);
        session.setCorrectAnswers(0);
        session.setWrongAnswers(0);
        
        return quizSessionRepository.save(session);
    }
    
    /**
     * Complete a quiz session and check for badges
     */
    @Transactional
    public QuizSession completeQuizSession(Long sessionId, int correctAnswers, int wrongAnswers) {
        QuizSession session = quizSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Quiz session not found"));
        
        session.setCorrectAnswers(correctAnswers);
        session.setWrongAnswers(wrongAnswers);
        session.complete();
        
        QuizSession completedSession = quizSessionRepository.save(session);
        
        // Check and award badges
        checkAndAwardBadges(session.getUser());
        
        // Update learning session for today
        updateDailyLearningSession(session.getUser(), 
                session.getDurationSeconds() != null ? session.getDurationSeconds() / 60 : 5, 
                0, 1, session.getXpEarned());
        
        return completedSession;
    }
    
    /**
     * Record a chat message and update daily session
     */
    @Transactional
    public void recordChatActivity(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        updateDailyLearningSession(user, 1, 1, 0, 2); // 1 minute, 1 message, 0 quizzes, 2 XP
        
        // Check for first chat badge
        if (!badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.FIRST_CHAT)) {
            Badge badge = new Badge();
            badge.setUser(user);
            badge.setBadgeType(Badge.BadgeType.FIRST_CHAT);
            badge.setLevel(Badge.BadgeLevel.BRONZE);
            badge.setDescription("Started your learning journey!");
            badgeRepository.save(badge);
        }
    }
    
    /**
     * Update or create daily learning session
     */
    @Transactional
    public void updateDailyLearningSession(User user, int minutes, int messages, int quizzes, int xp) {
        LocalDate today = LocalDate.now();
        
        LearningSession session = learningSessionRepository.findByUserAndSessionDate(user, today)
                .orElseGet(() -> {
                    LearningSession newSession = new LearningSession();
                    newSession.setUser(user);
                    newSession.setSessionDate(today);
                    newSession.setTotalMinutes(0);
                    newSession.setChatMessages(0);
                    newSession.setQuizzesTaken(0);
                    newSession.setXpEarned(0);
                    return newSession;
                });
        
        session.addActivity(minutes, messages, quizzes, xp);
        learningSessionRepository.save(session);
        
        // Check streak badges
        int streak = calculateStreak(user);
        checkStreakBadges(user, streak);
    }
    
    /**
     * Check and award badges based on current stats
     */
    @Transactional
    public void checkAndAwardBadges(User user) {
        // Quiz count badges
        int quizCount = quizSessionRepository.countCompletedQuizzes(user);
        if (quizCount >= 5 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.QUIZ_ROOKIE)) {
            awardBadge(user, Badge.BadgeType.QUIZ_ROOKIE, Badge.BadgeLevel.BRONZE, "Completed 5 quizzes!");
        }
        if (quizCount >= 25 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.QUIZ_VETERAN)) {
            awardBadge(user, Badge.BadgeType.QUIZ_VETERAN, Badge.BadgeLevel.SILVER, "Completed 25 quizzes!");
        }
        if (quizCount >= 100 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.QUIZ_MASTER)) {
            awardBadge(user, Badge.BadgeType.QUIZ_MASTER, Badge.BadgeLevel.GOLD, "Completed 100 quizzes!");
        }
        
        // Accuracy badges
        Double avgAccuracy = quizSessionRepository.getAverageAccuracy(user);
        if (avgAccuracy != null) {
            if (avgAccuracy >= 70 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.ACCURACY_BEGINNER)) {
                awardBadge(user, Badge.BadgeType.ACCURACY_BEGINNER, Badge.BadgeLevel.BRONZE, 
                        String.format("%.1f%% average accuracy!", avgAccuracy));
            }
            if (avgAccuracy >= 80 && quizCount >= 5 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.ACCURACY_INTERMEDIATE)) {
                awardBadge(user, Badge.BadgeType.ACCURACY_INTERMEDIATE, Badge.BadgeLevel.SILVER, 
                        String.format("%.1f%% average accuracy over 5+ quizzes!", avgAccuracy));
            }
            if (avgAccuracy >= 90 && quizCount >= 10 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.ACCURACY_EXPERT)) {
                awardBadge(user, Badge.BadgeType.ACCURACY_EXPERT, Badge.BadgeLevel.GOLD, 
                        String.format("%.1f%% average accuracy over 10+ quizzes!", avgAccuracy));
            }
        }
        
        // Perfect score badge
        Integer perfectScores = quizSessionRepository.countPerfectScores(user);
        if (perfectScores != null && perfectScores > 0 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.PERFECT_SCORE)) {
            awardBadge(user, Badge.BadgeType.PERFECT_SCORE, Badge.BadgeLevel.GOLD, "Perfect 100% score!");
        }
        
        // XP badges
        Integer totalXp = quizSessionRepository.getTotalXpFromQuizzes(user);
        Integer sessionXp = learningSessionRepository.getTotalXpEarned(user);
        int totalXpValue = (totalXp != null ? totalXp : 0) + (sessionXp != null ? sessionXp : 0);
        
        if (totalXpValue >= 100 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.XP_MILESTONE_100)) {
            awardBadge(user, Badge.BadgeType.XP_MILESTONE_100, Badge.BadgeLevel.BRONZE, "Earned 100 XP!");
        }
        if (totalXpValue >= 500 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.XP_MILESTONE_500)) {
            awardBadge(user, Badge.BadgeType.XP_MILESTONE_500, Badge.BadgeLevel.SILVER, "Earned 500 XP!");
        }
        if (totalXpValue >= 1000 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.XP_MILESTONE_1000)) {
            awardBadge(user, Badge.BadgeType.XP_MILESTONE_1000, Badge.BadgeLevel.GOLD, "Earned 1000 XP!");
        }
        if (totalXpValue >= 5000 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.XP_MILESTONE_5000)) {
            awardBadge(user, Badge.BadgeType.XP_MILESTONE_5000, Badge.BadgeLevel.PLATINUM, "Earned 5000 XP!");
        }
        
        // Subject mastery badges
        checkSubjectMasteryBadge(user, "Mathematics", Badge.BadgeType.MATH_WHIZ);
        checkSubjectMasteryBadge(user, "Science", Badge.BadgeType.SCIENCE_STAR);
        checkSubjectMasteryBadge(user, "English", Badge.BadgeType.LANGUAGE_LOVER);
    }
    
    private void checkSubjectMasteryBadge(User user, String subject, Badge.BadgeType badgeType) {
        if (!badgeRepository.existsByUserAndBadgeType(user, badgeType)) {
            Double subjectAccuracy = quizSessionRepository.getAverageAccuracyBySubject(user, subject);
            if (subjectAccuracy != null && subjectAccuracy >= 85) {
                awardBadge(user, badgeType, Badge.BadgeLevel.GOLD, 
                        String.format("%.1f%% mastery in %s!", subjectAccuracy, subject));
            }
        }
    }
    
    private void checkStreakBadges(User user, int streak) {
        if (streak >= 3 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.STREAK_STARTER)) {
            awardBadge(user, Badge.BadgeType.STREAK_STARTER, Badge.BadgeLevel.BRONZE, "3 day learning streak!");
        }
        if (streak >= 7 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.STREAK_WARRIOR)) {
            awardBadge(user, Badge.BadgeType.STREAK_WARRIOR, Badge.BadgeLevel.SILVER, "7 day learning streak!");
        }
        if (streak >= 30 && !badgeRepository.existsByUserAndBadgeType(user, Badge.BadgeType.STREAK_CHAMPION)) {
            awardBadge(user, Badge.BadgeType.STREAK_CHAMPION, Badge.BadgeLevel.GOLD, "30 day learning streak!");
        }
    }
    
    private void awardBadge(User user, Badge.BadgeType type, Badge.BadgeLevel level, String description) {
        Badge badge = new Badge();
        badge.setUser(user);
        badge.setBadgeType(type);
        badge.setLevel(level);
        badge.setDescription(description);
        badgeRepository.save(badge);
        log.info("Awarded badge {} to user {}", type, user.getEmail());
    }
    
    // DTO for progress stats
    public static class ProgressStats {
        private int totalLearningMinutes;
        private double totalLearningHours;
        private int totalLearningDays;
        private int totalQuizzes;
        private double averageQuizAccuracy;
        private int perfectScores;
        private int totalXp;
        private int currentStreak;
        private int totalChatMessages;
        private int totalBadges;
        
        // Getters and Setters
        public int getTotalLearningMinutes() { return totalLearningMinutes; }
        public void setTotalLearningMinutes(int totalLearningMinutes) { this.totalLearningMinutes = totalLearningMinutes; }
        
        public double getTotalLearningHours() { return totalLearningHours; }
        public void setTotalLearningHours(double totalLearningHours) { this.totalLearningHours = totalLearningHours; }
        
        public int getTotalLearningDays() { return totalLearningDays; }
        public void setTotalLearningDays(int totalLearningDays) { this.totalLearningDays = totalLearningDays; }
        
        public int getTotalQuizzes() { return totalQuizzes; }
        public void setTotalQuizzes(int totalQuizzes) { this.totalQuizzes = totalQuizzes; }
        
        public double getAverageQuizAccuracy() { return averageQuizAccuracy; }
        public void setAverageQuizAccuracy(double averageQuizAccuracy) { this.averageQuizAccuracy = averageQuizAccuracy; }
        
        public int getPerfectScores() { return perfectScores; }
        public void setPerfectScores(int perfectScores) { this.perfectScores = perfectScores; }
        
        public int getTotalXp() { return totalXp; }
        public void setTotalXp(int totalXp) { this.totalXp = totalXp; }
        
        public int getCurrentStreak() { return currentStreak; }
        public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
        
        public int getTotalChatMessages() { return totalChatMessages; }
        public void setTotalChatMessages(int totalChatMessages) { this.totalChatMessages = totalChatMessages; }
        
        public int getTotalBadges() { return totalBadges; }
        public void setTotalBadges(int totalBadges) { this.totalBadges = totalBadges; }
    }
}

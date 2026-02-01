package com.eduai.service;

import com.eduai.model.User;
import com.eduai.repository.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminStatsService {
    
    private final UserRepository userRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final BadgeRepository badgeRepository;
    private final LearningSessionRepository learningSessionRepository;
    private final MessageRepository messageRepository;
    
    public AdminStats getAdminStats() {
        AdminStats stats = new AdminStats();
        
        // User counts
        stats.setTotalUsers((int) userRepository.count());
        stats.setTotalStudents((int) userRepository.countByRole(User.Role.STUDENT));
        stats.setTotalTeachers((int) userRepository.countByRole(User.Role.TEACHER));
        
        // Today's activity
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        
        Long activeToday = learningSessionRepository.countActiveUsersOnDate(today);
        stats.setActiveUsersToday(activeToday != null ? activeToday.intValue() : 0);
        
        Long quizzesToday = quizSessionRepository.countQuizzesSince(startOfDay);
        stats.setTotalQuizzesToday(quizzesToday != null ? quizzesToday.intValue() : 0);
        
        // Messages today
        Long messagesToday = messageRepository.countMessagesSince(startOfDay);
        stats.setTotalMessagesToday(messagesToday != null ? messagesToday.intValue() : 0);
        
        // Overall accuracy
        Double avgAccuracy = quizSessionRepository.getOverallAverageAccuracy();
        stats.setAverageAccuracy(avgAccuracy != null ? avgAccuracy : 0.0);
        
        // Total badges
        Long totalBadges = badgeRepository.countTotalBadges();
        stats.setTotalBadgesAwarded(totalBadges != null ? totalBadges.intValue() : 0);
        
        return stats;
    }
    
    // DTO for admin stats
    public static class AdminStats {
        private int totalUsers;
        private int totalStudents;
        private int totalTeachers;
        private int activeUsersToday;
        private int totalQuizzesToday;
        private int totalMessagesToday;
        private double averageAccuracy;
        private int totalBadgesAwarded;
        
        // Getters and Setters
        public int getTotalUsers() { return totalUsers; }
        public void setTotalUsers(int totalUsers) { this.totalUsers = totalUsers; }
        
        public int getTotalStudents() { return totalStudents; }
        public void setTotalStudents(int totalStudents) { this.totalStudents = totalStudents; }
        
        public int getTotalTeachers() { return totalTeachers; }
        public void setTotalTeachers(int totalTeachers) { this.totalTeachers = totalTeachers; }
        
        public int getActiveUsersToday() { return activeUsersToday; }
        public void setActiveUsersToday(int activeUsersToday) { this.activeUsersToday = activeUsersToday; }
        
        public int getTotalQuizzesToday() { return totalQuizzesToday; }
        public void setTotalQuizzesToday(int totalQuizzesToday) { this.totalQuizzesToday = totalQuizzesToday; }
        
        public int getTotalMessagesToday() { return totalMessagesToday; }
        public void setTotalMessagesToday(int totalMessagesToday) { this.totalMessagesToday = totalMessagesToday; }
        
        public double getAverageAccuracy() { return averageAccuracy; }
        public void setAverageAccuracy(double averageAccuracy) { this.averageAccuracy = averageAccuracy; }
        
        public int getTotalBadgesAwarded() { return totalBadgesAwarded; }
        public void setTotalBadgesAwarded(int totalBadgesAwarded) { this.totalBadgesAwarded = totalBadgesAwarded; }
    }
}

package com.eduai.repository;

import com.eduai.model.LearningSession;
import com.eduai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LearningSessionRepository extends JpaRepository<LearningSession, Long> {
    
    Optional<LearningSession> findByUserAndSessionDate(User user, LocalDate date);
    
    List<LearningSession> findByUserOrderBySessionDateDesc(User user);
    
    @Query("SELECT l FROM LearningSession l WHERE l.user = :user ORDER BY l.sessionDate DESC LIMIT :limit")
    List<LearningSession> getRecentSessions(@Param("user") User user, @Param("limit") int limit);
    
    @Query("SELECT SUM(l.totalMinutes) FROM LearningSession l WHERE l.user = :user")
    Integer getTotalLearningMinutes(@Param("user") User user);
    
    @Query("SELECT SUM(l.chatMessages) FROM LearningSession l WHERE l.user = :user")
    Integer getTotalChatMessages(@Param("user") User user);
    
    @Query("SELECT SUM(l.xpEarned) FROM LearningSession l WHERE l.user = :user")
    Integer getTotalXpEarned(@Param("user") User user);
    
    @Query("SELECT COUNT(l) FROM LearningSession l WHERE l.user = :user")
    Integer countLearningDays(@Param("user") User user);
    
    // Get consecutive days (streak) - returns list of dates to calculate in service
    @Query("SELECT l.sessionDate FROM LearningSession l WHERE l.user = :user ORDER BY l.sessionDate DESC")
    List<LocalDate> getSessionDates(@Param("user") User user);
    
    // For admin stats
    @Query("SELECT COUNT(DISTINCT l.user) FROM LearningSession l WHERE l.sessionDate = :date")
    Long countActiveUsersOnDate(@Param("date") LocalDate date);
    
    @Query("SELECT SUM(l.totalMinutes) FROM LearningSession l WHERE l.sessionDate = :date")
    Integer getTotalMinutesOnDate(@Param("date") LocalDate date);
}

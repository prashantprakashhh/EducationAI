package com.eduai.repository;

import com.eduai.model.QuizSession;
import com.eduai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {
    
    List<QuizSession> findByUserOrderByStartedAtDesc(User user);
    
    List<QuizSession> findByUserAndStatusOrderByStartedAtDesc(User user, QuizSession.SessionStatus status);
    
    List<QuizSession> findByUserAndQuizTypeOrderByStartedAtDesc(User user, QuizSession.QuizType quizType);
    
    @Query("SELECT COUNT(q) FROM QuizSession q WHERE q.user = :user AND q.status = 'COMPLETED'")
    Integer countCompletedQuizzes(@Param("user") User user);
    
    @Query("SELECT AVG(q.accuracy) FROM QuizSession q WHERE q.user = :user AND q.status = 'COMPLETED'")
    Double getAverageAccuracy(@Param("user") User user);
    
    @Query("SELECT AVG(q.accuracy) FROM QuizSession q WHERE q.user = :user AND q.status = 'COMPLETED' AND q.subject = :subject")
    Double getAverageAccuracyBySubject(@Param("user") User user, @Param("subject") String subject);
    
    @Query("SELECT SUM(q.xpEarned) FROM QuizSession q WHERE q.user = :user")
    Integer getTotalXpFromQuizzes(@Param("user") User user);
    
    @Query("SELECT q FROM QuizSession q WHERE q.user = :user AND q.status = 'COMPLETED' ORDER BY q.completedAt DESC LIMIT :limit")
    List<QuizSession> getRecentQuizzes(@Param("user") User user, @Param("limit") int limit);
    
    @Query("SELECT COUNT(q) FROM QuizSession q WHERE q.user = :user AND q.accuracy = 100 AND q.status = 'COMPLETED'")
    Integer countPerfectScores(@Param("user") User user);
    
    @Query("SELECT SUM(q.durationSeconds) FROM QuizSession q WHERE q.user = :user AND q.status = 'COMPLETED'")
    Integer getTotalQuizTimeSeconds(@Param("user") User user);
    
    // For admin stats
    @Query("SELECT COUNT(q) FROM QuizSession q WHERE q.startedAt >= :since")
    Long countQuizzesSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT AVG(q.accuracy) FROM QuizSession q WHERE q.status = 'COMPLETED'")
    Double getOverallAverageAccuracy();
}

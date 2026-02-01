package com.eduai.repository;

import com.eduai.model.AiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AiFeedbackRepository extends JpaRepository<AiFeedback, Long> {
    List<AiFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Optional<AiFeedback> findByUserIdAndRelatedMessageId(Long userId, Long messageId);
    
    Optional<AiFeedback> findByRelatedMessageId(Long messageId);
    
    void deleteAllByUserId(Long userId);
    
    @Query("SELECT AVG(f.rating) FROM AiFeedback f WHERE f.persona = :persona")
    Double getAverageRatingByPersona(@Param("persona") String persona);
    
    @Query("SELECT f.persona, AVG(f.rating) FROM AiFeedback f GROUP BY f.persona")
    List<Object[]> getAverageRatingsAllPersonas();
    
    @Query("SELECT COUNT(f) FROM AiFeedback f WHERE f.wasHelpful = true")
    Long countHelpfulFeedback();
    
    @Query("SELECT f.category, COUNT(f) FROM AiFeedback f GROUP BY f.category")
    List<Object[]> countByCategory();
    
    @Query("SELECT f FROM AiFeedback f WHERE f.createdAt >= :since ORDER BY f.createdAt DESC")
    List<AiFeedback> findRecentFeedback(@Param("since") LocalDateTime since);
}

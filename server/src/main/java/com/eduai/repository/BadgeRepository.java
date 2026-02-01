package com.eduai.repository;

import com.eduai.model.Badge;
import com.eduai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {
    
    List<Badge> findByUserOrderByEarnedAtDesc(User user);
    
    List<Badge> findByUserAndBadgeTypeIn(User user, List<Badge.BadgeType> badgeTypes);
    
    Optional<Badge> findByUserAndBadgeType(User user, Badge.BadgeType badgeType);
    
    boolean existsByUserAndBadgeType(User user, Badge.BadgeType badgeType);
    
    @Query("SELECT COUNT(b) FROM Badge b WHERE b.user = :user")
    Integer countUserBadges(@Param("user") User user);
    
    @Query("SELECT COUNT(b) FROM Badge b WHERE b.user = :user AND b.level = :level")
    Integer countUserBadgesByLevel(@Param("user") User user, @Param("level") Badge.BadgeLevel level);
    
    // For admin stats
    @Query("SELECT COUNT(b) FROM Badge b")
    Long countTotalBadges();
    
    @Query("SELECT b.badgeType, COUNT(b) FROM Badge b GROUP BY b.badgeType ORDER BY COUNT(b) DESC")
    List<Object[]> getMostCommonBadges();
}

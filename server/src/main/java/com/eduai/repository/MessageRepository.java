package com.eduai.repository;

import com.eduai.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByUserIdOrderByTimestampAsc(Long userId);
    
    @Query("SELECT COUNT(m) FROM Message m WHERE m.timestamp >= :since")
    Long countMessagesSince(@Param("since") LocalDateTime since);
    
    void deleteAllByUserId(Long userId);
}
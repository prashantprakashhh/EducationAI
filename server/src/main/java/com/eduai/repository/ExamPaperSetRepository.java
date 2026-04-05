package com.eduai.repository;

import com.eduai.model.ExamPaperSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamPaperSetRepository extends JpaRepository<ExamPaperSet, Long> {
    List<ExamPaperSet> findByUploadedByUserIdOrderByCreatedAtDesc(Long userId);
    List<ExamPaperSet> findByStatus(ExamPaperSet.Status status);
}

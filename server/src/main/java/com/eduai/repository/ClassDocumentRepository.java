package com.eduai.repository;

import com.eduai.model.ClassDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassDocumentRepository extends JpaRepository<ClassDocument, Long> {
}
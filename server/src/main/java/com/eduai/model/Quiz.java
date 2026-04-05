package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "quizzes")
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String questionsJson; // [{"question":"...","options":[],"correctIndex":0,"explanation":"...","topic":"...","difficulty":"..."}]

    @ManyToOne
    @JoinColumn(name = "document_id")
    private ClassDocument document;

    @ManyToOne
    @JoinColumn(name = "exam_paper_set_id")
    private ExamPaperSet examPaperSet;  // Links to multi-paper set (null for single-doc quizzes)

    // Exam context — generic, not hardcoded to any specific exam
    private String examName;          // e.g. "NEET 2024", "JEE Main 2023", "Class 10 Unit Test"
    private String subject;           // e.g. "Biology", "Physics", "Chemistry"
    private Integer totalMarks;
    private Integer durationMinutes;
    private Integer questionCount;
    
    @Column(columnDefinition = "TEXT")
    private String sourceInfo;        // e.g. "NEET 2024 Paper - Set A" or "Chapter 5 - Cell Biology"

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
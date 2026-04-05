package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;


/**
 * Represents a collection of uploaded exam papers for a single exam prep session.
 * E.g., A student uploads 4 NEET 2024 papers → one ExamPaperSet with 4 documents.
 * The AI then analyzes ALL papers together to generate a new practice quiz.
 */
@Entity
@Data
@Table(name = "exam_paper_sets")
public class ExamPaperSet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String examName;        // e.g. "NEET 2024", "JEE Main 2023"
    private String subject;         // e.g. "Biology", "Physics", "Chemistry"
    
    @Column(name = "uploaded_by")
    private Long uploadedByUserId;  // Who uploaded these papers

    private Integer totalSourceQuestions;  // Total questions across all papers (e.g., 4×50 = 200)
    private Integer paperCount;            // How many papers were uploaded

    @Column(columnDefinition = "TEXT")
    private String paperFilenames;  // JSON array of original filenames

    @Column(columnDefinition = "TEXT")
    private String documentIds;     // JSON array of ClassDocument IDs: [1, 2, 3, 4]

    @Column(columnDefinition = "TEXT")
    private String filePaths;       // JSON array of actual file paths on disk for multimodal AI

    @Column(columnDefinition = "TEXT")
    private String combinedContent; // Text extracted via PDFBox (fallback — may be empty for scanned PDFs)

    @Enumerated(EnumType.STRING)
    private Status status = Status.UPLOADING;

    private LocalDateTime createdAt;
    private LocalDateTime processedAt;

    public enum Status {
        UPLOADING,      // Papers still being uploaded
        PROCESSING,     // AI is processing/analyzing
        READY,          // Quiz has been generated
        FAILED          // Something went wrong
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

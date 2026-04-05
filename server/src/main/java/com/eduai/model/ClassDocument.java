package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "class_documents")
public class ClassDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String filename;
    
    private String filePath;
    
    private String contentType;
    
    private Long size;

    @Column(length = 5000)
    private String summary;

    private LocalDateTime uploadDate;
    
    private boolean isProcessed; // True if ingested into Vector Store

    @PrePersist
    protected void onCreate() {
        uploadDate = LocalDateTime.now();
    }
}

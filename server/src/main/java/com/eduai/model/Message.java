package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SenderType sender; // USER or AI

    @Enumerated(EnumType.STRING)
    private MessageType type; // TEXT, WIDGET_GRAPH, HOMEWORK_HIGHLIGHT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime timestamp;

    private String persona; // e.g., "SOCRATIC", "NEWTON", "SHAKESPEARE"

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
        if (type == null) type = MessageType.TEXT;
    }

    public enum SenderType { USER, AI }
    public enum MessageType { TEXT, WIDGET_GRAPH, HOMEWORK_HIGHLIGHT }
}
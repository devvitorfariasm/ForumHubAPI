package com.example.forum.dto.Topic;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class Topic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    private User author;

    private Instant createdAt = Instant.now();

    // Getters e setters
}
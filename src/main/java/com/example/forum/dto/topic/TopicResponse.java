package com.example.forum.dto.topic;

import com.example.forum.domain.topic.Topic;
import com.example.forum.domain.topic.TopicStatus;

import java.time.Instant;

public record TopicResponse(
        Long id,
        String title,
        String message,
        TopicStatus status,
        Long authorId,
        String authorName,
        Instant createdAt,
        Instant updatedAt
) {
    public static TopicResponse from(Topic topic) {
        return new TopicResponse(
                topic.getId(),
                topic.getTitle(),
                topic.getMessage(),
                topic.getStatus(),
                topic.getAuthor().getId(),
                topic.getAuthor().getName(),
                topic.getCreatedAt(),
                topic.getUpdatedAt()
        );
    }
}

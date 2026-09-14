package com.example.forum.dto.reply;

import com.example.forum.domain.reply.Reply;

import java.time.Instant;

public record ReplyResponse(
        Long id,
        String message,
        boolean solution,
        Long topicId,
        Long authorId,
        String authorName,
        Instant createdAt,
        Instant updatedAt
) {
    public static ReplyResponse from(Reply reply) {
        return new ReplyResponse(
                reply.getId(),
                reply.getMessage(),
                reply.isSolution(),
                reply.getTopic().getId(),
                reply.getAuthor().getId(),
                reply.getAuthor().getName(),
                reply.getCreatedAt(),
                reply.getUpdatedAt()
        );
    }
}

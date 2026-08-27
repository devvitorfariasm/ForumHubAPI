package com.example.forum.dto.Topic;

import java.time.Instant;

public record TopicResponse( Long id, String title, String message, String authorName, Instant createdAt ) {}
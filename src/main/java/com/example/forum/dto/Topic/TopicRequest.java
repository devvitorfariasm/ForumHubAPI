package com.example.forum.dto.Topic;

import jakarta.validation.constraints.NotBlank;

public record TopicRequest( @NotBlank String title, @NotBlank String message ) {}
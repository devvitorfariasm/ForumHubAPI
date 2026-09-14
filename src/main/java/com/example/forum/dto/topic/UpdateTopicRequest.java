package com.example.forum.dto.topic;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTopicRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank String message
) {}

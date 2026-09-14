package com.example.forum.dto.reply;

import jakarta.validation.constraints.NotBlank;

public record CreateReplyRequest(@NotBlank String message) {}

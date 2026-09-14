package com.example.forum.dto.auth;

public record AuthResponse(
        String token,
        String type,
        long expiresInSeconds
) {}

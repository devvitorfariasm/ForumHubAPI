package com.example.forum.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Origens permitidas para CORS. Configuradas via {@code app.cors.allowed-origins} ({@code CORS_ALLOWED_ORIGINS}). */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {

    public CorsProperties {
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            allowedOrigins = List.of("*");
        }
    }
}

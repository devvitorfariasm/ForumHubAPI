package com.example.forum.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Configuração do JWT ({@code security.jwt.*}).
 *
 * @param secret            segredo HMAC com no mínimo 32 caracteres ({@code JWT_SECRET})
 * @param expirationMinutes validade do token em minutos ({@code JWT_EXPIRATION_MINUTES})
 */
@Validated
@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32, message = "security.jwt.secret precisa ter pelo menos 32 caracteres") String secret,
        @Positive long expirationMinutes
) {}

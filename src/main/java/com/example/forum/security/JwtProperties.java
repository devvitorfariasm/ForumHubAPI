package com.example.forum.security;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.Name;
import org.springframework.validation.annotation.Validated;

/**
 * Configuração do JWT ({@code security.jwt.*}).
 *
 * <p>{@code @Name} fixa o nome de cada propriedade, para que a vinculação não dependa
 * do compilador ter gravado os nomes dos parâmetros do construtor ({@code -parameters}).
 *
 * @param secret            segredo HMAC com no mínimo 32 caracteres ({@code JWT_SECRET})
 * @param expirationMinutes validade do token em minutos ({@code JWT_EXPIRATION_MINUTES})
 */
@Validated
@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(
        @Name("secret")
        @NotBlank @Size(min = 32, message = "security.jwt.secret precisa ter pelo menos 32 caracteres")
        String secret,

        @Name("expiration-minutes")
        @Positive
        long expirationMinutes
) {}

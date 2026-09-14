package com.example.forum.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI forumOpenApi() {
        var bearer = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Informe o token obtido em /api/v1/auth/login");

        return new OpenAPI()
                .info(new Info()
                        .title("ForumHub API")
                        .version("v1")
                        .description("API RESTful para gerenciamento de tópicos e respostas de um fórum."))
                .components(new Components().addSecuritySchemes("bearerAuth", bearer));
    }
}

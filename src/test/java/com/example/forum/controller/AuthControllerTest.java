package com.example.forum.controller;

import com.example.forum.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest extends ApiTestSupport {

    @Test
    @DisplayName("Registro retorna 201 com token Bearer")
    void registerReturnsToken() throws Exception {
        var email = uniqueEmail("maria");
        var body = """
                {"name": "Maria Silva", "email": "%s", "password": "%s"}
                """.formatted(email, PASSWORD);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.expiresInSeconds").value(300));
    }

    @Test
    @DisplayName("Registro com e-mail duplicado retorna 409")
    void registerDuplicateEmailReturnsConflict() throws Exception {
        var email = uniqueEmail("dup");
        registerAndGetToken("Primeiro", email);

        var body = """
                {"name": "Segundo", "email": "%s", "password": "%s"}
                """.formatted(email.toUpperCase(), PASSWORD);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("E-mail já cadastrado."));
    }

    @Test
    @DisplayName("Registro com dados inválidos retorna 400 com lista de campos")
    void registerInvalidReturnsBadRequest() throws Exception {
        var body = """
                {"name": "", "email": "nao-e-email", "password": "123"}
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields").isArray())
                .andExpect(jsonPath("$.fields", not(hasSize(0))));
    }

    @Test
    @DisplayName("JSON mal formatado retorna 400")
    void malformedJsonReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("Login com credenciais corretas retorna token")
    void loginReturnsToken() throws Exception {
        var email = uniqueEmail("login");
        registerAndGetToken("Login User", email);

        var body = """
                {"email": "%s", "password": "%s"}
                """.formatted(email, PASSWORD);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Login com senha errada retorna 401 (e não 500)")
    void loginWrongPasswordReturnsUnauthorized() throws Exception {
        var email = uniqueEmail("wrong");
        registerAndGetToken("Wrong Pass", email);

        var body = """
                {"email": "%s", "password": "senha-errada-123"}
                """.formatted(email);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Login de usuário inexistente retorna 401")
    void loginUnknownUserReturnsUnauthorized() throws Exception {
        var body = """
                {"email": "ninguem@example.com", "password": "%s"}
                """.formatted(PASSWORD);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Rota protegida sem token retorna 401 em JSON")
    void protectedRouteWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/topics"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.path").value("/api/v1/topics"));
    }

    @Test
    @DisplayName("Token inválido retorna 401")
    void invalidTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/topics").header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Health check é público")
    void healthIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}

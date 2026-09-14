package com.example.forum.controller;

import com.example.forum.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TopicControllerTest extends ApiTestSupport {

    @Test
    @DisplayName("Cria tópico e retorna 201 com autor")
    void createTopic() throws Exception {
        var token = registerAndGetToken("Ana", uniqueEmail("ana"));

        mockMvc.perform(post("/api/v1/topics")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "  Dúvida sobre JPA  ", "message": "Como configurar lazy loading?"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Dúvida sobre JPA"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.authorName").value("Ana"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    @DisplayName("Tópico duplicado (mesmo título e mensagem) retorna 409")
    void duplicateTopicReturnsConflict() throws Exception {
        var token = registerAndGetToken("Bia", uniqueEmail("bia"));
        createTopic(token, "Titulo repetido", "Mensagem repetida");

        mockMvc.perform(post("/api/v1/topics")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "TITULO REPETIDO", "message": "Mensagem repetida"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Validação de campos obrigatórios retorna 400")
    void createTopicInvalidReturnsBadRequest() throws Exception {
        var token = registerAndGetToken("Val", uniqueEmail("val"));

        mockMvc.perform(post("/api/v1/topics")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "", "message": "   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields", hasSize(2)));
    }

    @Test
    @DisplayName("Lista tópicos paginados no formato via_dto")
    void listTopicsPaged() throws Exception {
        var token = registerAndGetToken("Lis", uniqueEmail("lis"));
        createTopic(token, "Primeiro tópico", "Mensagem 1");
        createTopic(token, "Segundo tópico", "Mensagem 2");

        mockMvc.perform(get("/api/v1/topics")
                        .header("Authorization", "Bearer " + token)
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.page.size").value(1))
                .andExpect(jsonPath("$.page.totalElements").value(2))
                .andExpect(jsonPath("$.page.totalPages").value(2));
    }

    @Test
    @DisplayName("Buscar tópico inexistente retorna 404")
    void findMissingTopicReturnsNotFound() throws Exception {
        var token = registerAndGetToken("Nf", uniqueEmail("nf"));

        mockMvc.perform(get("/api/v1/topics/999999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Tópico não encontrado."));
    }

    @Test
    @DisplayName("Id não numérico retorna 400")
    void nonNumericIdReturnsBadRequest() throws Exception {
        var token = registerAndGetToken("Bad", uniqueEmail("bad"));

        mockMvc.perform(get("/api/v1/topics/abc")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Autor atualiza o próprio tópico")
    void authorUpdatesTopic() throws Exception {
        var token = registerAndGetToken("Own", uniqueEmail("own"));
        var id = createTopic(token, "Original", "Mensagem original");

        mockMvc.perform(put("/api/v1/topics/" + id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Editado", "message": "Mensagem editada"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Editado"));
    }

    @Test
    @DisplayName("Outro usuário não pode atualizar nem apagar o tópico (403)")
    void otherUserCannotModifyTopic() throws Exception {
        var owner = registerAndGetToken("Owner", uniqueEmail("owner"));
        var intruder = registerAndGetToken("Intruder", uniqueEmail("intruder"));
        var id = createTopic(owner, "Meu tópico", "Só eu edito");

        mockMvc.perform(put("/api/v1/topics/" + id)
                        .header("Authorization", "Bearer " + intruder)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Hack", "message": "Hack"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(delete("/api/v1/topics/" + id)
                        .header("Authorization", "Bearer " + intruder))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Apagar tópico com respostas retorna 204 e remove tudo")
    void deleteTopicWithReplies() throws Exception {
        var token = registerAndGetToken("Del", uniqueEmail("del"));
        var id = createTopic(token, "Para apagar", "Com respostas");
        createReply(token, id, "Resposta 1");
        createReply(token, id, "Resposta 2");

        mockMvc.perform(delete("/api/v1/topics/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/topics/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Fechar tópico impede novas respostas e novo fechamento")
    void closeTopicBlocksReplies() throws Exception {
        var token = registerAndGetToken("Cls", uniqueEmail("cls"));
        var id = createTopic(token, "Vai fechar", "Mensagem");

        mockMvc.perform(patch("/api/v1/topics/" + id + "/close")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        mockMvc.perform(post("/api/v1/topics/" + id + "/replies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message": "Tentativa"}
                                """))
                .andExpect(status().isConflict());

        mockMvc.perform(patch("/api/v1/topics/" + id + "/close")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Lista respostas em ordem de criação com autor")
    void listReplies() throws Exception {
        var token = registerAndGetToken("Rep", uniqueEmail("rep"));
        var id = createTopic(token, "Com respostas", "Mensagem");
        createReply(token, id, "Primeira");
        createReply(token, id, "Segunda");

        mockMvc.perform(get("/api/v1/topics/" + id + "/replies")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].message").value("Primeira"))
                .andExpect(jsonPath("$[0].authorName").value("Rep"))
                .andExpect(jsonPath("$[0].topicId").value(id));
    }

    @Test
    @DisplayName("Marcar resposta como solução resolve o tópico")
    void markReplyAsSolution() throws Exception {
        var author = registerAndGetToken("Author", uniqueEmail("author"));
        var helper = registerAndGetToken("Helper", uniqueEmail("helper"));
        var topicId = createTopic(author, "Preciso de ajuda", "Alguém sabe?");
        var replyId = createReply(helper, topicId, "Sei sim!");

        // Quem não é autor do tópico não pode marcar solução.
        mockMvc.perform(patch("/api/v1/topics/" + topicId + "/replies/" + replyId + "/solution")
                        .header("Authorization", "Bearer " + helper))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/topics/" + topicId + "/replies/" + replyId + "/solution")
                        .header("Authorization", "Bearer " + author))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solution").value(true));

        mockMvc.perform(get("/api/v1/topics/" + topicId)
                        .header("Authorization", "Bearer " + author))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SOLVED"));
    }

    @Test
    @DisplayName("Resposta de outro tópico não pode ser marcada como solução (404)")
    void solutionFromAnotherTopicReturnsNotFound() throws Exception {
        var token = registerAndGetToken("Mix", uniqueEmail("mix"));
        var topicA = createTopic(token, "Tópico A", "Mensagem A");
        var topicB = createTopic(token, "Tópico B", "Mensagem B");
        var replyOnB = createReply(token, topicB, "Resposta em B");

        mockMvc.perform(patch("/api/v1/topics/" + topicA + "/replies/" + replyOnB + "/solution")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}

package com.example.forum.support;

import com.example.forum.repository.ReplyRepository;
import com.example.forum.repository.TopicRepository;
import com.example.forum.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base para testes de integração HTTP contra o H2 em memória do perfil "test".
 * Cada requisição abre a própria transação, como em produção, e o banco é
 * limpo ao final de cada teste.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestSupport {

    private static final AtomicInteger SEQUENCE = new AtomicInteger();

    public static final String PASSWORD = "SenhaSegura123";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    private ReplyRepository replyRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private UserRepository userRepository;

    @AfterEach
    void cleanDatabase() {
        replyRepository.deleteAllInBatch();
        topicRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    protected String uniqueEmail(String prefix) {
        return prefix + "-" + SEQUENCE.incrementAndGet() + "@example.com";
    }

    /** Registra um usuário e devolve o token JWT. */
    protected String registerAndGetToken(String name, String email) throws Exception {
        var body = """
                {"name": "%s", "email": "%s", "password": "%s"}
                """.formatted(name, email, PASSWORD);

        var response = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return JsonPath.read(response, "$.token");
    }

    protected Long createTopic(String token, String title, String message) throws Exception {
        var body = """
                {"title": "%s", "message": "%s"}
                """.formatted(title, message);

        var response = mockMvc.perform(post("/api/v1/topics")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    protected Long createReply(String token, Long topicId, String message) throws Exception {
        var body = """
                {"message": "%s"}
                """.formatted(message);

        var response = mockMvc.perform(post("/api/v1/topics/" + topicId + "/replies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }
}

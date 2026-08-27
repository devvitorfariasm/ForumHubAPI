package com.example.forum.controller;

import com.example.forum.dto.Topic.TopicRequest;
import com.example.forum.dto.Topic.TopicResponse;
import com.example.forum.service.TopicService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/topics")
public class TopicController {
    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @PostMapping
    public TopicResponse create(@RequestBody @Valid TopicRequest request) {
        String authorName = "Usuário Exemplo"; // depois, pegue do contexto de segurança
        return topicService.create(request, authorName);
    }

    @GetMapping
    public List<TopicResponse> list() {
        return topicService.findAll();
    }
}
package com.example.forum.service;

import com.example.forum.domain.Topic;
import com.example.forum.dto.Topic.TopicRequest;
import com.example.forum.dto.Topic.TopicResponse;
import com.example.forum.repository.TopicRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TopicService {
    private final TopicRepository topicRepository;

    public TopicService(TopicRepository topicRepository) {
        this.topicRepository = topicRepository;
    }

    public TopicResponse create(TopicRequest request, String authorName) {
        Topic topic = new Topic();
        topic.setTitle(request.title());
        topic.setMessage(request.message());
        // topic.setAuthor(...); // buscar usuário autenticado
        Topic saved = topicRepository.save(topic);
        return new TopicResponse(saved.getId(), saved.getTitle(), saved.getMessage(), authorName, saved.getCreatedAt());
    }

    public List<TopicResponse> findAll() {
        return topicRepository.findAll().stream()
                .map(t -> new TopicResponse(t.getId(), t.getTitle(), t.getMessage(), t.getAuthor().getName(), t.getCreatedAt()))
                .toList();
    }
}
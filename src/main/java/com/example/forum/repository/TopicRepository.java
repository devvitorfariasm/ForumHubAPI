package com.example.forum.repository;

import com.example.forum.domain.topic.Topic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {

    @Override
    @EntityGraph(attributePaths = "author")
    Page<Topic> findAll(Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "author")
    Optional<Topic> findById(Long id);

    boolean existsByTitleIgnoreCaseAndMessage(String title, String message);

    boolean existsByTitleIgnoreCaseAndMessageAndIdNot(String title, String message, Long id);
}

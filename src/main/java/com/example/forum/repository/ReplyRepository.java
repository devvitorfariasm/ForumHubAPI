package com.example.forum.repository;

import com.example.forum.domain.reply.Reply;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReplyRepository extends JpaRepository<Reply, Long> {

    @EntityGraph(attributePaths = "author")
    List<Reply> findAllByTopicIdOrderByCreatedAtAsc(Long topicId);

    @EntityGraph(attributePaths = "author")
    Optional<Reply> findByIdAndTopicId(Long id, Long topicId);
}

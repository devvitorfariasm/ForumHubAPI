package com.example.forum.service;

import com.example.forum.domain.reply.Reply;
import com.example.forum.domain.topic.Topic;
import com.example.forum.domain.user.User;
import com.example.forum.dto.reply.CreateReplyRequest;
import com.example.forum.dto.reply.ReplyResponse;
import com.example.forum.exception.BusinessException;
import com.example.forum.exception.ResourceNotFoundException;
import com.example.forum.repository.ReplyRepository;
import com.example.forum.repository.TopicRepository;
import com.example.forum.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReplyService {

    private final ReplyRepository replyRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    public ReplyService(ReplyRepository replyRepository, TopicRepository topicRepository, UserRepository userRepository) {
        this.replyRepository = replyRepository;
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReplyResponse create(Long topicId, CreateReplyRequest request, String email) {
        var topic = findTopic(topicId);

        if (topic.isClosed()) {
            throw new BusinessException("Não é possível responder a um tópico fechado.");
        }

        var author = findUser(email);
        var reply = replyRepository.save(new Reply(request.message().trim(), topic, author));
        return ReplyResponse.from(reply);
    }

    @Transactional(readOnly = true)
    public List<ReplyResponse> findByTopic(Long topicId) {
        if (!topicRepository.existsById(topicId)) {
            throw new ResourceNotFoundException("Tópico não encontrado.");
        }
        return replyRepository.findAllByTopicIdOrderByCreatedAtAsc(topicId)
                .stream()
                .map(ReplyResponse::from)
                .toList();
    }

    /** Marca a resposta como solução e o tópico como resolvido. Apenas o autor do tópico ou moderadores. */
    @Transactional
    public ReplyResponse markAsSolution(Long topicId, Long replyId, String email) {
        var topic = findTopic(topicId);
        var current = findUser(email);

        if (!topic.canBeManagedBy(current)) {
            throw new AccessDeniedException("Sem permissão para alterar este tópico.");
        }
        if (topic.isClosed()) {
            throw new BusinessException("Não é possível marcar solução em um tópico fechado.");
        }

        var reply = replyRepository.findByIdAndTopicId(replyId, topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Resposta não encontrada neste tópico."));

        if (reply.isSolution()) {
            throw new BusinessException("Esta resposta já está marcada como solução.");
        }

        reply.markAsSolution();
        topic.solve();
        return ReplyResponse.from(reply);
    }

    private Topic findTopic(Long id) {
        return topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tópico não encontrado."));
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }
}

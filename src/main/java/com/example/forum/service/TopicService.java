package com.example.forum.service;

import com.example.forum.domain.topic.Topic;
import com.example.forum.domain.user.User;
import com.example.forum.dto.topic.CreateTopicRequest;
import com.example.forum.dto.topic.TopicResponse;
import com.example.forum.dto.topic.UpdateTopicRequest;
import com.example.forum.exception.BusinessException;
import com.example.forum.exception.ResourceNotFoundException;
import com.example.forum.repository.TopicRepository;
import com.example.forum.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TopicService {

    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    public TopicService(TopicRepository topicRepository, UserRepository userRepository) {
        this.topicRepository = topicRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TopicResponse create(CreateTopicRequest request, String email) {
        var author = findUser(email);
        var title = request.title().trim();
        var message = request.message().trim();

        if (topicRepository.existsByTitleIgnoreCaseAndMessage(title, message)) {
            throw new BusinessException("Já existe um tópico com o mesmo título e mensagem.");
        }

        var topic = topicRepository.save(new Topic(title, message, author));
        return TopicResponse.from(topic);
    }

    @Transactional(readOnly = true)
    public Page<TopicResponse> findAll(Pageable pageable) {
        return topicRepository.findAll(pageable).map(TopicResponse::from);
    }

    @Transactional(readOnly = true)
    public TopicResponse findById(Long id) {
        return TopicResponse.from(findTopic(id));
    }

    @Transactional
    public TopicResponse update(Long id, UpdateTopicRequest request, String email) {
        var topic = findTopic(id);
        ensureCanManage(topic, email);

        if (topic.isClosed()) {
            throw new BusinessException("Não é possível alterar um tópico fechado.");
        }

        var title = request.title().trim();
        var message = request.message().trim();

        if (topicRepository.existsByTitleIgnoreCaseAndMessageAndIdNot(title, message, id)) {
            throw new BusinessException("Já existe um tópico com o mesmo título e mensagem.");
        }

        topic.update(title, message);
        return TopicResponse.from(topic);
    }

    /** As respostas são removidas em cascata pelo mapeamento em {@link Topic}. */
    @Transactional
    public void delete(Long id, String email) {
        var topic = findTopic(id);
        ensureCanManage(topic, email);
        topicRepository.delete(topic);
    }

    @Transactional
    public TopicResponse close(Long id, String email) {
        var topic = findTopic(id);
        ensureCanManage(topic, email);

        if (topic.isClosed()) {
            throw new BusinessException("O tópico já está fechado.");
        }

        topic.close();
        return TopicResponse.from(topic);
    }

    @Transactional
    public TopicResponse solve(Long id, String email) {
        var topic = findTopic(id);
        ensureCanManage(topic, email);

        if (topic.isClosed()) {
            throw new BusinessException("Não é possível marcar um tópico fechado como resolvido.");
        }
        if (topic.isSolved()) {
            throw new BusinessException("O tópico já está marcado como resolvido.");
        }

        topic.solve();
        return TopicResponse.from(topic);
    }

    private Topic findTopic(Long id) {
        return topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tópico não encontrado."));
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
    }

    private void ensureCanManage(Topic topic, String email) {
        var current = findUser(email);
        if (!topic.canBeManagedBy(current)) {
            throw new AccessDeniedException("Sem permissão para alterar este tópico.");
        }
    }
}

package com.example.forum.controller;

import com.example.forum.dto.reply.CreateReplyRequest;
import com.example.forum.dto.reply.ReplyResponse;
import com.example.forum.dto.topic.CreateTopicRequest;
import com.example.forum.dto.topic.TopicResponse;
import com.example.forum.dto.topic.UpdateTopicRequest;
import com.example.forum.service.ReplyService;
import com.example.forum.service.TopicService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/topics")
@Tag(name = "Tópicos", description = "CRUD de tópicos e respostas do fórum")
@SecurityRequirement(name = "bearerAuth")
public class TopicController {

    private final TopicService topicService;
    private final ReplyService replyService;

    public TopicController(TopicService topicService, ReplyService replyService) {
        this.topicService = topicService;
        this.replyService = replyService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TopicResponse create(
            @Valid @RequestBody CreateTopicRequest request,
            @AuthenticationPrincipal UserDetails user
    ) {
        return topicService.create(request, user.getUsername());
    }

    @GetMapping
    public Page<TopicResponse> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return topicService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public TopicResponse findById(@PathVariable Long id) {
        return topicService.findById(id);
    }

    @PutMapping("/{id}")
    public TopicResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTopicRequest request,
            @AuthenticationPrincipal UserDetails user
    ) {
        return topicService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        topicService.delete(id, user.getUsername());
    }

    @PatchMapping("/{id}/close")
    public TopicResponse close(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return topicService.close(id, user.getUsername());
    }

    @PatchMapping("/{id}/solve")
    public TopicResponse solve(@PathVariable Long id, @AuthenticationPrincipal UserDetails user) {
        return topicService.solve(id, user.getUsername());
    }

    @PostMapping("/{topicId}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public ReplyResponse createReply(
            @PathVariable Long topicId,
            @Valid @RequestBody CreateReplyRequest request,
            @AuthenticationPrincipal UserDetails user
    ) {
        return replyService.create(topicId, request, user.getUsername());
    }

    @GetMapping("/{topicId}/replies")
    public List<ReplyResponse> findReplies(@PathVariable Long topicId) {
        return replyService.findByTopic(topicId);
    }

    @PatchMapping("/{topicId}/replies/{replyId}/solution")
    public ReplyResponse markAsSolution(
            @PathVariable Long topicId,
            @PathVariable Long replyId,
            @AuthenticationPrincipal UserDetails user
    ) {
        return replyService.markAsSolution(topicId, replyId, user.getUsername());
    }
}

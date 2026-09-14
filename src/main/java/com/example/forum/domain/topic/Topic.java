package com.example.forum.domain.topic;

import com.example.forum.domain.reply.Reply;
import com.example.forum.domain.user.Role;
import com.example.forum.domain.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "topics")
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TopicStatus status = TopicStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    /** O topico e dono das respostas: ao remover o topico, as respostas sao removidas junto. */
    @OneToMany(mappedBy = "topic", cascade = CascadeType.REMOVE)
    private List<Reply> replies = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Topic() {}

    public Topic(String title, String message, User author) {
        this.title = title;
        this.message = message;
        this.author = author;
    }

    @PrePersist
    void onCreate() {
        var now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public TopicStatus getStatus() { return status; }
    public User getAuthor() { return author; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public boolean isClosed() { return status == TopicStatus.CLOSED; }
    public boolean isSolved() { return status == TopicStatus.SOLVED; }

    /** O autor do topico, moderadores e administradores podem gerencia-lo. */
    public boolean canBeManagedBy(User user) {
        return author.getId().equals(user.getId())
                || user.getRole() == Role.MODERATOR
                || user.getRole() == Role.ADMIN;
    }

    public void update(String title, String message) {
        this.title = title;
        this.message = message;
    }

    public void close() { this.status = TopicStatus.CLOSED; }
    public void solve() { this.status = TopicStatus.SOLVED; }
}

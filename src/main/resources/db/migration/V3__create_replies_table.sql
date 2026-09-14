CREATE TABLE replies (
    id BIGINT NOT NULL AUTO_INCREMENT,
    message TEXT NOT NULL,
    solution BOOLEAN NOT NULL DEFAULT FALSE,
    topic_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_replies PRIMARY KEY (id),
    CONSTRAINT fk_replies_topic FOREIGN KEY (topic_id) REFERENCES topics(id),
    CONSTRAINT fk_replies_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX ix_replies_topic_id ON replies(topic_id);

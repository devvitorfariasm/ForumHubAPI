CREATE TABLE topics (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_topics PRIMARY KEY (id),
    CONSTRAINT fk_topics_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX ix_topics_created_at ON topics(created_at);
CREATE INDEX ix_topics_status ON topics(status);

package com.example.forum;

import com.example.forum.security.CorsProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(CorsProperties.class)
public class ForumApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ForumApiApplication.class, args);
    }
}

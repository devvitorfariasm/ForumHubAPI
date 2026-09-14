package com.example.forum.service;

import com.example.forum.domain.user.Role;
import com.example.forum.domain.user.User;
import com.example.forum.dto.auth.AuthResponse;
import com.example.forum.dto.auth.LoginRequest;
import com.example.forum.dto.auth.RegisterRequest;
import com.example.forum.exception.BusinessException;
import com.example.forum.repository.UserRepository;
import com.example.forum.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        var email = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("E-mail já cadastrado.");
        }

        var user = new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                Role.USER
        );

        return tokenResponse(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        // Senha incorreta ou usuário inexistente lançam AuthenticationException,
        // convertida em 401 pelo GlobalExceptionHandler.
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizeEmail(request.email()), request.password())
        );

        return tokenResponse((User) authentication.getPrincipal());
    }

    private AuthResponse tokenResponse(User user) {
        return new AuthResponse(jwtService.generate(user), "Bearer", jwtService.expirationSeconds());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}

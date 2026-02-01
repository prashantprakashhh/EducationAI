package com.eduai.service;

import com.eduai.dto.AuthPayload;
import com.eduai.model.User;
import com.eduai.repository.UserRepository;
import com.eduai.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public AuthPayload register(String username, String email, String password, String fullName, User.Role role) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use");
        }
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already taken");
        }
        
        // Simple Email Validation
        if (!email.contains("@") || !email.contains(".")) {
             throw new RuntimeException("Invalid email format");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(password));
        
        User savedUser = userRepository.save(user);
        String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole().name());

        return new AuthPayload(token, savedUser);
    }

    public AuthPayload login(String email, String password) {
        // This authenticates using Spring Security
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email).orElseThrow();
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return new AuthPayload(token, user);
    }
}
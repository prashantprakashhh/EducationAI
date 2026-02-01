package com.eduai.controller;

import com.eduai.dto.AuthPayload;
import com.eduai.model.User;
import com.eduai.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class UserGraphQLController {
    private final UserService userService;

    @QueryMapping
    public List<User> allUsers() {
        return userService.getAllUsers();
    }

    @QueryMapping
    public String systemStatus() {
        return "EduAI Neural Core Online";
    }

    // --- Authentication Mutations ---

    @MutationMapping
    public AuthPayload register(@Argument("input") RegisterInput input) {
        return userService.register(
            input.username(),
            input.email(),
            input.password(),
            input.fullName(),
            User.Role.valueOf(input.role())
        );
    }

    @MutationMapping
    public AuthPayload login(@Argument("input") LoginInput input) {
        return userService.login(input.email(), input.password());
    }

    // --- Input Records (DTOs) matching GraphQL Schema ---
    public record RegisterInput(String username, String email, String password, String fullName, String role) {}
    public record LoginInput(String email, String password) {}
}
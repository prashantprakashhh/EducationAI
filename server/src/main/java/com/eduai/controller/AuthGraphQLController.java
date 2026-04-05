package com.eduai.controller;

import com.eduai.model.AuthPayload;
import com.eduai.model.User;
import com.eduai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

/**
 * GraphQL controller for public authentication mutations (register & login).
 * Matches the schema: register(input: RegisterInput!), login(input: LoginInput!)
 */
@Controller
@RequiredArgsConstructor
public class AuthGraphQLController {

    private final AuthService authService;

    /**
     * Public register — only STUDENT and PARENT roles allowed.
     */
    @MutationMapping
    public AuthPayload register(@Argument("input") RegisterInput input) {
        return authService.signup(
                input.username(),
                input.email(),
                input.fullName(),
                input.password(),
                User.Role.valueOf(input.role())
        );
    }

    /**
     * Public login — returns user + JWT token.
     */
    @MutationMapping
    public AuthPayload login(@Argument("input") LoginInput input) {
        return authService.login(input.email(), input.password());
    }

    // --- Input Records matching GraphQL Schema ---
    public record RegisterInput(String username, String email, String password, String fullName, String role) {}
    public record LoginInput(String email, String password) {}
}

package com.eduai.controller;

import com.eduai.model.AuthPayload;
import com.eduai.model.User;
import com.eduai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

/**
 * GraphQL controller for public authentication mutations (signup & login).
 * No authentication required for these endpoints.
 */
@Controller
@RequiredArgsConstructor
public class AuthGraphQLController {

    private final AuthService authService;

    /**
     * Public signup — only STUDENT and PARENT roles allowed.
     */
    @MutationMapping
    public AuthPayload signup(
            @Argument String username,
            @Argument String email,
            @Argument String fullName,
            @Argument String password,
            @Argument User.Role role) {
        return authService.signup(username, email, fullName, password, role);
    }

    /**
     * Public login — returns user + JWT token.
     */
    @MutationMapping
    public AuthPayload login(@Argument String username, @Argument String password) {
        return authService.login(username, password);
    }
}

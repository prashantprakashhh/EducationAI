package com.eduai.controller;

import com.eduai.auth.RequireRole;
import com.eduai.model.User;
import com.eduai.service.AuthService;
import com.eduai.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

/**
 * GraphQL controller for admin-only operations.
 * All methods require ADMIN role.
 */
@Controller
@RequiredArgsConstructor
public class AdminGraphQLController {

    private final AuthService authService;
    private final UserService userService;

    /**
     * Admin creates a user account (typically TEACHER, but can be any role).
     */
    @MutationMapping
    @RequireRole(User.Role.ADMIN)
    public User adminCreateUser(
            @Argument String username,
            @Argument String email,
            @Argument String fullName,
            @Argument String password,
            @Argument User.Role role) {
        return authService.createUserByAdmin(username, email, fullName, password, role);
    }

    /**
     * Admin deletes any user account.
     */
    @MutationMapping
    @RequireRole(User.Role.ADMIN)
    public Boolean adminDeleteUser(@Argument Long id) {
        return userService.deleteUser(id);
    }

    /**
     * Admin lists all users.
     */
    @QueryMapping
    @RequireRole(User.Role.ADMIN)
    public List<User> allUsers() {
        return userService.getAllUsers();
    }

    /**
     * Admin lists users by role.
     */
    @QueryMapping
    @RequireRole(User.Role.ADMIN)
    public List<User> usersByRole(@Argument User.Role role) {
        return userService.getUsersByRole(role);
    }
}

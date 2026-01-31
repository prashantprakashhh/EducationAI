package com.eduai.controller;

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
        return "EduAI Core System is Online";
    }

    @MutationMapping
    public User createUser(@Argument String username, 
                          @Argument String fullName, 
                          @Argument String role) {
        return userService.createUser(username, fullName, User.Role.valueOf(role));
    }
}
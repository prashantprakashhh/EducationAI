package com.eduai.controller;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

/**
 * General system queries.
 * Authentication is handled by AuthGraphQLController.
 * User management is handled by AdminGraphQLController.
 */
@Controller
public class UserGraphQLController {

    @QueryMapping
    public String systemStatus() {
        return "EduAI Online";
    }
}
package com.eduai.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response returned after successful authentication (login/signup).
 * Contains the user info and JWT token.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthPayload {
    private User user;
    private String token;
}

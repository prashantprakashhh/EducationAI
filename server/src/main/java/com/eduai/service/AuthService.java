package com.eduai.service;

import com.eduai.auth.JwtService;
import com.eduai.model.AuthPayload;
import com.eduai.model.User;
import com.eduai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Handles authentication: signup, login, and admin user creation.
 *
 * Signup is restricted to STUDENT and PARENT roles only.
 * TEACHER and ADMIN accounts can only be created by an authenticated ADMIN user.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Allowed roles for public self-registration.
     */
    private static final Set<User.Role> SELF_SIGNUP_ROLES = Set.of(User.Role.STUDENT, User.Role.PARENT);

    /**
     * Public signup — only STUDENT and PARENT can self-register.
     */
    public AuthPayload signup(String username, String email, String fullName, String password, User.Role role) {
        // Validate role
        if (!SELF_SIGNUP_ROLES.contains(role)) {
            throw new RuntimeException("Only STUDENT and PARENT accounts can be created via signup. " +
                    "Teacher accounts must be created by an admin.");
        }

        // Check uniqueness
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username '" + username + "' is already taken.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email '" + email + "' is already registered.");
        }

        // Validate password
        if (password == null || password.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);

        log.info("New {} account created: {}", role, username);
        return new AuthPayload(savedUser, token);
    }

    /**
     * Login with email and password. Returns JWT token on success.
     */
    public AuthPayload login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        // Authenticate using Spring Security (uses username internally)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), password)
        );

        String token = jwtService.generateToken(user);
        log.info("User '{}' logged in successfully", user.getUsername());
        return new AuthPayload(user, token);
    }

    /**
     * Admin-only: create a TEACHER or ADMIN account.
     */
    public User createUserByAdmin(String username, String email, String fullName, String password, User.Role role) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username '" + username + "' is already taken.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email '" + email + "' is already registered.");
        }
        if (password == null || password.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters.");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

        User savedUser = userRepository.save(user);
        log.info("Admin created {} account: {}", role, username);
        return savedUser;
    }
}

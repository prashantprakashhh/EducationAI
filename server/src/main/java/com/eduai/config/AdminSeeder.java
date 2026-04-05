package com.eduai.config;

import com.eduai.model.User;
import com.eduai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds a default ADMIN user on startup if none exists.
 * Credentials are configured in application.properties.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.seed.username}")
    private String adminUsername;

    @Value("${admin.seed.email}")
    private String adminEmail;

    @Value("${admin.seed.password}")
    private String adminPassword;

    @Value("${admin.seed.fullName}")
    private String adminFullName;

    @Bean
    public CommandLineRunner seedAdminUser() {
        return args -> {
            var existingAdmin = userRepository.findByUsername(adminUsername);
            if (existingAdmin.isEmpty()) {
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setFullName(adminFullName);
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
                log.info("Default ADMIN user '{}' created successfully.", adminUsername);
            } else {
                // Update password & email if changed in config
                User admin = existingAdmin.get();
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setEmail(adminEmail);
                admin.setFullName(adminFullName);
                userRepository.save(admin);
                log.info("ADMIN user '{}' password & details synced from config.", adminUsername);
            }
        };
    }
}

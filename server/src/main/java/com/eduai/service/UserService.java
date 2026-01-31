package com.eduai.service;

import com.eduai.model.User;
import com.eduai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(String username, String fullName, User.Role role) {
        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setRole(role);
        // Default password for demo; in prod, users would set their own via email link
        user.setPassword(passwordEncoder.encode("password123")); 
        return userRepository.save(user);
    }
}
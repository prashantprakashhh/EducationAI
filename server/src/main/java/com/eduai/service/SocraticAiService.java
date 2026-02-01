package com.eduai.service;

import com.eduai.model.Message;
import com.eduai.model.User;
import com.eduai.repository.MessageRepository;
import com.eduai.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SocraticAiService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public Message processUserMessage(Long userId, String content, String persona) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Save User Message
        Message userMsg = new Message();
        userMsg.setUser(user);
        userMsg.setContent(content);
        userMsg.setSender(Message.SenderType.USER);
        userMsg.setPersona(persona);
        messageRepository.save(userMsg);

        // 2. "The Socratic Loop" - Logic to determine response
        // In production, this calls the LLM with the 'persona' System Prompt
        String aiResponseText = mockAiGeneration(content, persona);

        // 3. Save AI Response
        Message aiMsg = new Message();
        aiMsg.setUser(user);
        aiMsg.setContent(aiResponseText);
        aiMsg.setSender(Message.SenderType.AI);
        aiMsg.setPersona(persona);
        
        return messageRepository.save(aiMsg);
    }

    public List<Message> getChatHistory(Long userId) {
        return messageRepository.findByUserIdOrderByTimestampAsc(userId);
    }

    // Mocking the "Time-Travel Roleplay" logic for demonstration
    private String mockAiGeneration(String input, String persona) {
        if ("NEWTON".equals(persona)) {
            return "By the laws of motion, your query intrigues me. However, have you considered the equal and opposite reaction to your logic?";
        } else if ("SHAKESPEARE".equals(persona)) {
            return "To solve, or not to solve, that is the question. Yet methinks thou hast missed a variable.";
        }
        // Default Socratic Mode
        return "That is an interesting answer. But if x is 5, what happens to the left side of the equation?";
    }
}
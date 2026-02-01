package com.eduai.service;

import com.eduai.model.Message;
import com.eduai.model.User;
import com.eduai.model.StudentProfile;
import com.eduai.repository.MessageRepository;
import com.eduai.repository.UserRepository;
import com.eduai.repository.StudentProfileRepository;
import com.eduai.repository.AiFeedbackRepository;
import com.eduai.ai.PersonaPrompts;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocraticAiService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PersonaPrompts personaPrompts;
    private final ChatModel chatModel;
    private final ProgressService progressService;
    private final AiFeedbackRepository aiFeedbackRepository;

    @Value("${spring.ai.openai.api-key:}")
    private String openAiApiKey;

    @PostConstruct
    public void init() {
        // Check API key configuration on startup
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            log.error("⚠️ OPENAI_API_KEY is not configured! Set the environment variable: export OPENAI_API_KEY=sk-xxx");
        } else if (openAiApiKey.startsWith("sk-")) {
            log.info("✅ OpenAI API key is configured (starts with: {}...)", openAiApiKey.substring(0, Math.min(10, openAiApiKey.length())));
        } else {
            log.warn("⚠️ OpenAI API key doesn't look valid (should start with 'sk-')");
        }
    }

    @Transactional
    public Message processUserMessage(Long userId, String content, String persona) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get student profile for personalization
        StudentProfile profile = studentProfileRepository.findByUserId(userId).orElse(null);

        // 1. Save User Message
        Message userMsg = new Message();
        userMsg.setUser(user);
        userMsg.setContent(content);
        userMsg.setSender(Message.SenderType.USER);
        userMsg.setPersona(persona);
        userMsg.setType(Message.MessageType.TEXT);
        messageRepository.save(userMsg);

        // 2. Get conversation history for context
        List<Message> history = messageRepository.findByUserIdOrderByTimestampAsc(userId);
        if (history.size() > 10) {
            history = history.subList(history.size() - 10, history.size());
        }

        // 3. Generate AI response using OpenAI
        String aiResponseText = generateAiResponse(content, persona, profile, history);

        // 4. Save AI Response
        Message aiMsg = new Message();
        aiMsg.setUser(user);
        aiMsg.setContent(aiResponseText);
        aiMsg.setSender(Message.SenderType.AI);
        aiMsg.setPersona(persona);
        aiMsg.setType(Message.MessageType.TEXT);
        
        Message savedMsg = messageRepository.save(aiMsg);

        // 5. Award XP for engagement
        if (profile != null) {
            awardEngagementXP(profile);
        }

        return savedMsg;
    }

    public List<Message> getChatHistory(Long userId) {
        return messageRepository.findByUserIdOrderByTimestampAsc(userId);
    }
    
    /**
     * Clear chat history for a user
     */
    @Transactional
    public Boolean clearChatHistory(Long userId) {
        try {
            // First delete feedback related to user's messages
            aiFeedbackRepository.deleteAllByUserId(userId);
            // Then delete messages
            messageRepository.deleteAllByUserId(userId);
            log.info("Cleared chat history for user {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Error clearing chat history: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Generate AI response using OpenAI via Spring AI
     */
    private String generateAiResponse(String userMessage, String persona, 
                                       StudentProfile profile, List<Message> history) {
        // Check if API key is configured
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            log.error("❌ Cannot generate AI response: OPENAI_API_KEY is not configured!");
            return generateFallbackResponse(userMessage, profile, persona, "API key not configured. Please set the OPENAI_API_KEY environment variable.");
        }

        try {
            log.debug("Generating AI response for persona: {} with {} history messages", persona, history.size());
            
            // Build system prompt based on persona
            String systemPrompt = buildSystemPrompt(persona, profile);

            // Build messages list for the API
            List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
            
            // Add system prompt
            messages.add(new SystemMessage(systemPrompt));
            
            // Add conversation history (excluding the just-saved user message to avoid duplication)
            for (int i = 0; i < history.size() - 1; i++) {
                Message msg = history.get(i);
                if (msg.getSender() == Message.SenderType.USER) {
                    messages.add(new UserMessage(msg.getContent()));
                } else {
                    messages.add(new AssistantMessage(msg.getContent()));
                }
            }
            
            // Add current user message
            messages.add(new UserMessage(userMessage));
            
            // Create prompt and get response
            log.debug("Calling OpenAI API...");
            Prompt prompt = new Prompt(messages);
            ChatResponse response = chatModel.call(prompt);
            
            String responseText = response.getResult().getOutput().getText();
            log.info("✅ AI Response generated successfully for persona: {}", persona);
            return responseText;
            
        } catch (Exception e) {
            String errorMessage = e.getMessage();
            log.error("❌ Error generating AI response: {}", errorMessage, e);
            
            // Provide more specific error context
            String errorContext;
            if (errorMessage != null && errorMessage.contains("401")) {
                errorContext = "Invalid API key. Please check your OPENAI_API_KEY.";
            } else if (errorMessage != null && errorMessage.contains("429")) {
                errorContext = "Rate limit exceeded. Please try again later.";
            } else if (errorMessage != null && errorMessage.contains("Connection")) {
                errorContext = "Cannot connect to OpenAI. Check your internet connection.";
            } else {
                errorContext = errorMessage;
            }
            
            return generateFallbackResponse(userMessage, profile, persona, errorContext);
        }
    }

    /**
     * Build system prompt based on persona and student profile
     */
    private String buildSystemPrompt(String persona, StudentProfile profile) {
        StringBuilder prompt = new StringBuilder();
        
        // Get base persona prompt
        prompt.append(personaPrompts.getSystemPrompt(persona, profile));
        
        // Add curriculum context if profile exists
        if (profile != null && profile.getGradeLevel() != null) {
            prompt.append("\n\n📚 CURRICULUM CONTEXT:\n");
            prompt.append(personaPrompts.getCurriculumContext(profile.getGradeLevel()));
        }
        
        // Add safety guidelines
        prompt.append("\n\n🛡️ SAFETY GUIDELINES:\n");
        prompt.append("- Never provide inappropriate content for any age\n");
        prompt.append("- If asked about dangerous activities, redirect to safe learning\n");
        prompt.append("- Encourage students to talk to parents/teachers about personal issues\n");
        prompt.append("- Keep all content educational and supportive\n");
        
        return prompt.toString();
    }

    /**
     * Fallback response when AI API is unavailable
     */
    private String generateFallbackResponse(String userMessage, StudentProfile profile, String persona) {
        return generateFallbackResponse(userMessage, profile, persona, null);
    }

    /**
     * Fallback response when AI API is unavailable with specific error reason
     */
    private String generateFallbackResponse(String userMessage, StudentProfile profile, String persona, String errorReason) {
        String name = profile != null ? profile.getDisplayName() : "there";
        String lowerMessage = userMessage.toLowerCase();
        
        String personaIntro = switch (persona) {
            case "NEWTON" -> "As Sir Isaac Newton, ";
            case "SHAKESPEARE" -> "Hark, good scholar! ";
            default -> "";
        };
        
        // If we have a specific error reason, log it for debugging
        if (errorReason != null) {
            log.warn("Fallback triggered: {}", errorReason);
        }
        
        if (lowerMessage.contains("hello") || lowerMessage.contains("hi") || lowerMessage.contains("hey")) {
            return String.format("%sGreetings, %s! 👋 I'm currently experiencing a brief technical issue connecting to my knowledge base. " +
                    "But don't worry - I'll be fully operational shortly! What subject would you like to explore today?", personaIntro, name);
        }
        
        if (lowerMessage.contains("help") || lowerMessage.contains("stuck") || lowerMessage.contains("don't understand")) {
            return String.format("%sI can see you're looking for help, %s! 🤔 While I reconnect to my full capabilities, " +
                    "let me suggest: try breaking down the problem into smaller steps. What's the very first thing you know about this topic?", personaIntro, name);
        }
        
        return String.format("%sThank you for your question, %s! 💭 I'm experiencing a temporary connection issue with my AI systems. " +
                "Please try again in a moment. Your curiosity is wonderful - keep those questions coming!", personaIntro, name);
    }

    /**
     * Award XP for engagement and track activity
     */
    private void awardEngagementXP(StudentProfile profile) {
        int currentXP = profile.getTotalXp() != null ? profile.getTotalXp() : 0;
        profile.setTotalXp(currentXP + 5);
        studentProfileRepository.save(profile);
        
        // Track chat activity for progress/badges
        try {
            progressService.recordChatActivity(profile.getUser().getId());
        } catch (Exception e) {
            log.warn("Could not record chat activity: {}", e.getMessage());
        }
    }
}
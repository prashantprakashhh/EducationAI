package com.eduai.service;

import com.eduai.ai.PersonaPrompts;
import com.eduai.model.*;
import com.eduai.repository.MessageRepository;
import com.eduai.repository.StudentProfileRepository;
import com.eduai.repository.UserRepository;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AiTutorService {
    
    @Autowired(required = false)
    private ChatModel chatModel;
    
    private final MessageRepository messageRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final PersonaPrompts personaPrompts;
    
    @Autowired
    public AiTutorService(MessageRepository messageRepository,
                          StudentProfileRepository studentProfileRepository,
                          UserRepository userRepository,
                          PersonaPrompts personaPrompts) {
        this.messageRepository = messageRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userRepository = userRepository;
        this.personaPrompts = personaPrompts;
    }
    
    /**
     * Send a message to the AI tutor and get a personalized response.
     * 
     * @param userId The ID of the student
     * @param content The message content
     * @param persona The AI persona to use (SOCRATIC, NEWTON, SHAKESPEARE)
     * @return The AI's response message
     */
    public Message chat(Long userId, String content, String persona) {
        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get student profile for personalization
        StudentProfile profile = studentProfileRepository.findByUserId(userId).orElse(null);
        
        // Build the system prompt with persona and student context
        String systemPrompt = buildSystemPrompt(persona, profile);
        
        // Get conversation history for context (last 10 messages)
        List<Message> history = messageRepository.findByUserIdOrderByTimestampAsc(userId);
        if (history.size() > 10) {
            history = history.subList(history.size() - 10, history.size());
        }
        
        // Save the user's message first
        Message userMessage = new Message();
        userMessage.setUser(user);
        userMessage.setContent(content);
        userMessage.setSender(Message.SenderType.USER);
        userMessage.setPersona(persona);
        userMessage.setType(Message.MessageType.TEXT);
        messageRepository.save(userMessage);
        
        // Build the prompt with conversation history
        String aiResponse = generateResponse(systemPrompt, history, content, profile);
        
        // Save and return the AI response
        Message responseMessage = new Message();
        responseMessage.setUser(user);
        responseMessage.setContent(aiResponse);
        responseMessage.setSender(Message.SenderType.AI);
        responseMessage.setPersona(persona);
        responseMessage.setType(Message.MessageType.TEXT);
        messageRepository.save(responseMessage);
        
        // Award XP for engagement (if profile exists)
        if (profile != null) {
            awardEngagementXP(profile);
        }
        
        return responseMessage;
    }
    
    /**
     * Build a comprehensive system prompt based on persona and student profile.
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
        prompt.append("- If unsure about age-appropriateness, err on the side of caution\n");
        
        return prompt.toString();
    }
    
    /**
     * Generate a response using Spring AI ChatClient.
     */
    private String generateResponse(String systemPrompt, List<Message> history, 
                                   String userMessage, StudentProfile profile) {
        try {
            // Build messages list for the API
            List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
            
            // Add system prompt
            messages.add(new SystemMessage(systemPrompt));
            
            // Add conversation history
            for (Message msg : history) {
                if (msg.getSender() == Message.SenderType.USER) {
                    messages.add(new UserMessage(msg.getContent()));
                } else {
                    messages.add(new AssistantMessage(msg.getContent()));
                }
            }
            
            // Add current user message
            messages.add(new UserMessage(userMessage));
            
            // Create prompt and get response
            Prompt prompt = new Prompt(messages);
            ChatResponse response = chatModel.call(prompt);
            
            return response.getResult().getOutput().getText();
            
        } catch (Exception e) {
            // Fallback response if API fails
            return generateFallbackResponse(userMessage, profile);
        }
    }
    
    /**
     * Generate a fallback response when the AI API is unavailable.
     */
    private String generateFallbackResponse(String userMessage, StudentProfile profile) {
        String name = profile != null ? profile.getDisplayName() : "there";
        
        // Check for common patterns and provide helpful fallbacks
        String lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.contains("hello") || lowerMessage.contains("hi")) {
            return String.format("Hello %s! 👋 I'm your AI tutor. I'm having a small technical issue right now, " +
                    "but I'll be back to full power soon! In the meantime, is there something specific you'd like to learn about?", name);
        }
        
        if (lowerMessage.contains("help") || lowerMessage.contains("stuck")) {
            return String.format("I see you need some help, %s! 🤔 While I'm experiencing a brief connection issue, " +
                    "why don't you try breaking down your problem into smaller parts? What's the first step you've tried?", name);
        }
        
        if (lowerMessage.contains("math") || lowerMessage.contains("calculate") || lowerMessage.contains("solve")) {
            return String.format("Great question about math, %s! 🔢 I'm having a brief connection issue, " +
                    "but here's a tip: always start by identifying what you know and what you need to find. " +
                    "Can you tell me what information you have?", name);
        }
        
        return String.format("Thank you for your question, %s! 💭 I'm experiencing a temporary connection issue. " +
                "Please try again in a moment, or feel free to share more details about what you're trying to learn!", name);
    }
    
    /**
     * Award XP for engaging with the AI tutor.
     */
    private void awardEngagementXP(StudentProfile profile) {
        // Award 5 XP for each interaction
        int currentXP = profile.getTotalXp() != null ? profile.getTotalXp() : 0;
        profile.setTotalXp(currentXP + 5);
        studentProfileRepository.save(profile);
    }
    
    /**
     * Get AI-generated study suggestions based on student profile.
     */
    public String getStudySuggestions(Long userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElse(null);
        
        if (profile == null) {
            return "Complete your profile to get personalized study suggestions!";
        }
        
        String promptText = String.format("""
            Based on a %s student (grade %s) who is interested in %s,
            provide 3 brief, specific study suggestions for today.
            Keep it encouraging and actionable. Format as a numbered list.
            """,
            profile.getAge() + " year old",
            profile.getGradeLevel().getDisplayName(),
            profile.getInterests() != null ? String.join(", ", profile.getInterests()) : "various subjects"
        );
        
        try {
            Prompt prompt = new Prompt(promptText);
            ChatResponse response = chatModel.call(prompt);
            return response.getResult().getOutput().getText();
        } catch (Exception e) {
            return "1. Review your notes from today\n2. Practice one topic for 15 minutes\n3. Teach something you learned to a friend or family member!";
        }
    }
    
    /**
     * Generate a quiz question for the student.
     */
    public Map<String, Object> generateQuizQuestion(Long userId, String subject) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId).orElse(null);
        String gradeLevel = profile != null ? profile.getGradeLevel().getDisplayName() : "middle school";
        
        String promptText = String.format("""
            Create a single quiz question for a %s student about %s.
            
            Return in this exact JSON format:
            {
                "question": "The question text",
                "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
                "correctAnswer": "A",
                "explanation": "Brief explanation of why this is correct"
            }
            
            Make it educational but fun!
            """, gradeLevel, subject);
        
        try {
            Prompt prompt = new Prompt(promptText);
            ChatResponse response = chatModel.call(prompt);
            String responseText = response.getResult().getOutput().getText();
            
            // Parse JSON response (simplified - in production use proper JSON parsing)
            Map<String, Object> quiz = new HashMap<>();
            quiz.put("question", extractJsonValue(responseText, "question"));
            quiz.put("options", extractJsonArray(responseText, "options"));
            quiz.put("correctAnswer", extractJsonValue(responseText, "correctAnswer"));
            quiz.put("explanation", extractJsonValue(responseText, "explanation"));
            
            return quiz;
        } catch (Exception e) {
            // Fallback quiz
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("question", "What is 2 + 2?");
            fallback.put("options", Arrays.asList("A) 3", "B) 4", "C) 5", "D) 6"));
            fallback.put("correctAnswer", "B");
            fallback.put("explanation", "2 plus 2 equals 4!");
            return fallback;
        }
    }
    
    // Helper methods for JSON parsing (simplified)
    private String extractJsonValue(String json, String key) {
        int keyIndex = json.indexOf("\"" + key + "\"");
        if (keyIndex == -1) return "";
        int colonIndex = json.indexOf(":", keyIndex);
        int startQuote = json.indexOf("\"", colonIndex);
        int endQuote = json.indexOf("\"", startQuote + 1);
        if (startQuote != -1 && endQuote != -1) {
            return json.substring(startQuote + 1, endQuote);
        }
        return "";
    }
    
    private List<String> extractJsonArray(String json, String key) {
        int keyIndex = json.indexOf("\"" + key + "\"");
        if (keyIndex == -1) return List.of();
        int startBracket = json.indexOf("[", keyIndex);
        int endBracket = json.indexOf("]", startBracket);
        if (startBracket != -1 && endBracket != -1) {
            String arrayContent = json.substring(startBracket + 1, endBracket);
            return Arrays.stream(arrayContent.split(","))
                    .map(s -> s.trim().replaceAll("^\"|\"$", ""))
                    .toList();
        }
        return List.of();
    }
}

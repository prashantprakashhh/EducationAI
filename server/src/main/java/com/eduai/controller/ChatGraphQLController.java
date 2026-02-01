package com.eduai.controller;

import com.eduai.model.Message;
import com.eduai.service.SocraticAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatGraphQLController {
    
    private final SocraticAiService socraticAiService;

    @QueryMapping
    public List<Message> chatHistory(@Argument Long userId) {
        return socraticAiService.getChatHistory(userId);
    }

    @MutationMapping
    public Message sendMessage(@Argument Long userId, 
                               @Argument String content, 
                               @Argument String persona) {
        return socraticAiService.processUserMessage(userId, content, persona);
    }
    
    @MutationMapping
    public Boolean clearChatHistory(@Argument Long userId) {
        return socraticAiService.clearChatHistory(userId);
    }
}

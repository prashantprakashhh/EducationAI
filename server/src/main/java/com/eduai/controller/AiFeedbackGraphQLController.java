package com.eduai.controller;

import com.eduai.model.AiFeedback;
import com.eduai.service.AiFeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
public class AiFeedbackGraphQLController {
    
    private final AiFeedbackService feedbackService;
    
    @Autowired
    public AiFeedbackGraphQLController(AiFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }
    
    // Queries
    
    @QueryMapping
    public AiFeedback feedbackForMessage(@Argument Long messageId) {
        return feedbackService.getFeedbackForMessage(messageId).orElse(null);
    }
    
    @QueryMapping
    public List<AiFeedback> myFeedback(@Argument Long userId) {
        return feedbackService.getFeedbackByStudent(userId);
    }
    
    @QueryMapping
    public Boolean hasFeedback(@Argument Long userId, @Argument Long messageId) {
        return feedbackService.hasFeedback(userId, messageId);
    }
    
    @QueryMapping
    public Map<String, Object> feedbackAnalytics() {
        return feedbackService.getAnalytics();
    }
    
    @QueryMapping
    public Double personaRating(@Argument String persona) {
        return feedbackService.getAverageRatingForPersona(persona);
    }
    
    // Mutations
    
    @MutationMapping
    public AiFeedback submitFeedback(
            @Argument Long userId,
            @Argument Long messageId,
            @Argument Integer rating,
            @Argument String category,
            @Argument String comment,
            @Argument Boolean wasHelpful) {
        
        AiFeedback.FeedbackCategory feedbackCategory = category != null 
                ? AiFeedback.FeedbackCategory.valueOf(category) 
                : null;
        
        return feedbackService.submitFeedback(userId, messageId, rating, feedbackCategory, comment, wasHelpful);
    }
    
    @MutationMapping
    public AiFeedback quickFeedback(
            @Argument Long userId,
            @Argument Long messageId,
            @Argument Boolean wasHelpful) {
        
        return feedbackService.submitQuickFeedback(userId, messageId, wasHelpful);
    }
    
    @MutationMapping
    public Boolean deleteFeedback(@Argument Long feedbackId) {
        feedbackService.deleteFeedback(feedbackId);
        return true;
    }
}

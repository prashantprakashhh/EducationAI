package com.eduai.service;

import com.eduai.model.AiFeedback;
import com.eduai.model.Message;
import com.eduai.model.User;
import com.eduai.repository.AiFeedbackRepository;
import com.eduai.repository.MessageRepository;
import com.eduai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AiFeedbackService {
    
    private final AiFeedbackRepository feedbackRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public AiFeedbackService(AiFeedbackRepository feedbackRepository,
                             MessageRepository messageRepository,
                             UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Submit feedback for an AI response
     */
    @Transactional
    public AiFeedback submitFeedback(Long userId, Long messageId, Integer rating,
                                      AiFeedback.FeedbackCategory category,
                                      String comment, Boolean wasHelpful) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        // Check if feedback already exists for this message
        Optional<AiFeedback> existing = feedbackRepository.findByUserIdAndRelatedMessageId(userId, messageId);
        if (existing.isPresent()) {
            // Update existing feedback
            AiFeedback feedback = existing.get();
            feedback.setRating(rating);
            feedback.setCategory(category);
            feedback.setComment(comment);
            feedback.setWasHelpful(wasHelpful);
            return feedbackRepository.save(feedback);
        }
        
        // Create new feedback
        AiFeedback feedback = new AiFeedback();
        feedback.setUser(user);
        feedback.setRelatedMessage(message);
        feedback.setRating(rating);
        feedback.setCategory(category);
        feedback.setComment(comment);
        feedback.setWasHelpful(wasHelpful);
        feedback.setPersona(message.getPersona());
        
        return feedbackRepository.save(feedback);
    }
    
    /**
     * Quick thumbs up/down feedback
     */
    @Transactional
    public AiFeedback submitQuickFeedback(Long userId, Long messageId, Boolean wasHelpful) {
        return submitFeedback(userId, messageId, wasHelpful ? 5 : 1, null, null, wasHelpful);
    }
    
    /**
     * Get feedback for a specific message
     */
    public Optional<AiFeedback> getFeedbackForMessage(Long messageId) {
        return feedbackRepository.findByRelatedMessageId(messageId);
    }
    
    /**
     * Get all feedback by a student
     */
    public List<AiFeedback> getFeedbackByStudent(Long studentId) {
        return feedbackRepository.findByUserIdOrderByCreatedAtDesc(studentId);
    }
    
    /**
     * Get analytics summary
     */
    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        // Overall stats
        analytics.put("totalFeedback", feedbackRepository.count());
        analytics.put("helpfulCount", feedbackRepository.countHelpfulFeedback());
        
        // Average ratings by persona
        analytics.put("ratingsByPersona", feedbackRepository.getAverageRatingsAllPersonas());
        
        // Feedback by category
        analytics.put("feedbackByCategory", feedbackRepository.countByCategory());
        
        // Recent feedback
        analytics.put("recentFeedback", feedbackRepository.findRecentFeedback(LocalDateTime.now().minusDays(7)));
        
        return analytics;
    }
    
    /**
     * Get average rating for a persona
     */
    public Double getAverageRatingForPersona(String persona) {
        Double avgRating = feedbackRepository.getAverageRatingByPersona(persona);
        return avgRating != null ? avgRating : 0.0;
    }
    
    /**
     * Check if student has provided feedback for a message
     */
    public boolean hasFeedback(Long studentId, Long messageId) {
        return feedbackRepository.findByUserIdAndRelatedMessageId(studentId, messageId).isPresent();
    }
    
    /**
     * Delete feedback
     */
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        feedbackRepository.deleteById(feedbackId);
    }
}

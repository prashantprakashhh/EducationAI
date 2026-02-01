package com.eduai.controller;

import com.eduai.model.Badge;
import com.eduai.model.QuizSession;
import com.eduai.service.ProgressService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Controller
@RequiredArgsConstructor
public class ProgressGraphQLController {
    
    private final ProgressService progressService;
    
    @QueryMapping
    public Map<String, Object> progressStats(@Argument Long userId) {
        ProgressService.ProgressStats stats = progressService.getProgressStats(userId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalLearningMinutes", stats.getTotalLearningMinutes());
        result.put("totalLearningHours", stats.getTotalLearningHours());
        result.put("totalLearningDays", stats.getTotalLearningDays());
        result.put("totalQuizzes", stats.getTotalQuizzes());
        result.put("averageQuizAccuracy", stats.getAverageQuizAccuracy());
        result.put("perfectScores", stats.getPerfectScores());
        result.put("totalXp", stats.getTotalXp());
        result.put("currentStreak", stats.getCurrentStreak());
        result.put("totalChatMessages", stats.getTotalChatMessages());
        result.put("totalBadges", stats.getTotalBadges());
        
        return result;
    }
    
    @QueryMapping
    public List<Map<String, Object>> userBadges(@Argument Long userId) {
        List<Badge> badges = progressService.getUserBadges(userId);
        
        return badges.stream().map(badge -> {
            Map<String, Object> badgeMap = new HashMap<>();
            badgeMap.put("id", badge.getId());
            badgeMap.put("badgeType", badge.getBadgeType().name());
            badgeMap.put("level", badge.getLevel().name());
            badgeMap.put("description", badge.getDescription());
            badgeMap.put("earnedAt", badge.getEarnedAt().toString());
            badgeMap.put("icon", getBadgeIcon(badge.getBadgeType()));
            badgeMap.put("name", formatBadgeName(badge.getBadgeType()));
            return badgeMap;
        }).toList();
    }
    
    @QueryMapping
    public List<Map<String, Object>> recentQuizzes(@Argument Long userId, @Argument Integer limit) {
        int queryLimit = (limit != null) ? limit : 10;
        List<QuizSession> quizzes = progressService.getRecentQuizzes(userId, queryLimit);
        
        return quizzes.stream().map(quiz -> {
            Map<String, Object> quizMap = new HashMap<>();
            quizMap.put("id", quiz.getId());
            quizMap.put("subject", quiz.getSubject());
            quizMap.put("topic", quiz.getTopic());
            quizMap.put("quizType", quiz.getQuizType().name());
            quizMap.put("totalQuestions", quiz.getTotalQuestions());
            quizMap.put("correctAnswers", quiz.getCorrectAnswers());
            quizMap.put("wrongAnswers", quiz.getWrongAnswers());
            quizMap.put("accuracy", quiz.getAccuracy());
            quizMap.put("xpEarned", quiz.getXpEarned());
            quizMap.put("completedAt", quiz.getCompletedAt() != null ? quiz.getCompletedAt().toString() : null);
            quizMap.put("durationSeconds", quiz.getDurationSeconds());
            return quizMap;
        }).toList();
    }
    
    @MutationMapping
    public Map<String, Object> startQuizSession(
            @Argument Long userId,
            @Argument String subject,
            @Argument String topic,
            @Argument String quizType,
            @Argument Integer totalQuestions) {
        
        QuizSession.QuizType type = QuizSession.QuizType.valueOf(quizType);
        QuizSession session = progressService.startQuizSession(userId, subject, topic, type, totalQuestions);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", session.getId());
        result.put("subject", session.getSubject());
        result.put("topic", session.getTopic());
        result.put("quizType", session.getQuizType().name());
        result.put("totalQuestions", session.getTotalQuestions());
        result.put("status", session.getStatus().name());
        
        return result;
    }
    
    @MutationMapping
    public Map<String, Object> completeQuizSession(
            @Argument Long sessionId,
            @Argument Integer correctAnswers,
            @Argument Integer wrongAnswers) {
        
        QuizSession session = progressService.completeQuizSession(sessionId, correctAnswers, wrongAnswers);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", session.getId());
        result.put("subject", session.getSubject());
        result.put("accuracy", session.getAccuracy());
        result.put("xpEarned", session.getXpEarned());
        result.put("status", session.getStatus().name());
        result.put("durationSeconds", session.getDurationSeconds());
        
        return result;
    }
    
    private String getBadgeIcon(Badge.BadgeType type) {
        return switch (type) {
            case ACCURACY_BEGINNER, ACCURACY_INTERMEDIATE, ACCURACY_EXPERT -> "🎯";
            case PERFECT_SCORE -> "💯";
            case STREAK_STARTER, STREAK_WARRIOR, STREAK_CHAMPION -> "🔥";
            case QUIZ_ROOKIE, QUIZ_VETERAN, QUIZ_MASTER -> "📝";
            case MATH_WHIZ -> "🧮";
            case SCIENCE_STAR -> "🔬";
            case LANGUAGE_LOVER -> "📚";
            case FIRST_CHAT -> "💬";
            case CURIOUS_MIND -> "🤔";
            case KNOWLEDGE_SEEKER -> "🔍";
            case EARLY_BIRD -> "🌅";
            case NIGHT_OWL -> "🦉";
            case FAST_LEARNER -> "⚡";
            case XP_MILESTONE_100, XP_MILESTONE_500, XP_MILESTONE_1000, XP_MILESTONE_5000 -> "⭐";
        };
    }
    
    private String formatBadgeName(Badge.BadgeType type) {
        return switch (type) {
            case ACCURACY_BEGINNER -> "Accuracy Beginner";
            case ACCURACY_INTERMEDIATE -> "Accuracy Pro";
            case ACCURACY_EXPERT -> "Accuracy Expert";
            case PERFECT_SCORE -> "Perfect Score";
            case STREAK_STARTER -> "Streak Starter";
            case STREAK_WARRIOR -> "Streak Warrior";
            case STREAK_CHAMPION -> "Streak Champion";
            case QUIZ_ROOKIE -> "Quiz Rookie";
            case QUIZ_VETERAN -> "Quiz Veteran";
            case QUIZ_MASTER -> "Quiz Master";
            case MATH_WHIZ -> "Math Whiz";
            case SCIENCE_STAR -> "Science Star";
            case LANGUAGE_LOVER -> "Language Lover";
            case FIRST_CHAT -> "First Chat";
            case CURIOUS_MIND -> "Curious Mind";
            case KNOWLEDGE_SEEKER -> "Knowledge Seeker";
            case EARLY_BIRD -> "Early Bird";
            case NIGHT_OWL -> "Night Owl";
            case FAST_LEARNER -> "Fast Learner";
            case XP_MILESTONE_100 -> "100 XP Club";
            case XP_MILESTONE_500 -> "500 XP Club";
            case XP_MILESTONE_1000 -> "1000 XP Club";
            case XP_MILESTONE_5000 -> "5000 XP Club";
        };
    }
}

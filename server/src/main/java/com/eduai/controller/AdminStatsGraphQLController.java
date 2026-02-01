package com.eduai.controller;

import com.eduai.service.AdminStatsService;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;

import java.util.Map;
import java.util.HashMap;

@Controller
@RequiredArgsConstructor
public class AdminStatsGraphQLController {
    
    private final AdminStatsService adminStatsService;
    
    @QueryMapping
    public Map<String, Object> adminStats() {
        AdminStatsService.AdminStats stats = adminStatsService.getAdminStats();
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalUsers", stats.getTotalUsers());
        result.put("totalStudents", stats.getTotalStudents());
        result.put("totalTeachers", stats.getTotalTeachers());
        result.put("activeUsersToday", stats.getActiveUsersToday());
        result.put("totalQuizzesToday", stats.getTotalQuizzesToday());
        result.put("totalMessagesToday", stats.getTotalMessagesToday());
        result.put("averageAccuracy", stats.getAverageAccuracy());
        result.put("totalBadgesAwarded", stats.getTotalBadgesAwarded());
        
        return result;
    }
}

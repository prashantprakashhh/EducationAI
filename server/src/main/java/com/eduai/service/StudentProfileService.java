package com.eduai.service;

import com.eduai.model.StudentProfile;
import com.eduai.model.User;
import com.eduai.repository.StudentProfileRepository;
import com.eduai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class StudentProfileService {
    
    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public StudentProfileService(StudentProfileRepository profileRepository,
                                  UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Get profile by user ID
     */
    public Optional<StudentProfile> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId);
    }
    
    /**
     * Get profile by ID
     */
    public Optional<StudentProfile> getProfileById(Long id) {
        return profileRepository.findById(id);
    }
    
    /**
     * Create a new student profile
     */
    @Transactional
    public StudentProfile createProfile(Long userId, String displayName, LocalDate dateOfBirth,
                                         StudentProfile.GradeLevel gradeLevel, String school,
                                         String course, List<String> interests) {
        // Check if profile already exists
        if (profileRepository.existsByUserId(userId)) {
            throw new RuntimeException("Profile already exists for this user");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setDisplayName(displayName);
        profile.setDateOfBirth(dateOfBirth);
        profile.setGradeLevel(gradeLevel);
        profile.setSchool(school);
        profile.setCourse(course);
        profile.setInterests(interests);
        profile.setTotalXp(0);
        profile.setCurrentStreak(0);
        profile.setLastActiveDate(LocalDate.now());
        profile.setProfileCompleted(true);
        
        return profileRepository.save(profile);
    }
    
    /**
     * Update an existing profile
     */
    @Transactional
    public StudentProfile updateProfile(Long userId, String displayName, LocalDate dateOfBirth,
                                         StudentProfile.GradeLevel gradeLevel, String school,
                                         String course, List<String> interests,
                                         StudentProfile.LearningStyle learningStyle,
                                         String learningGoals, String avatarUrl) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        
        if (displayName != null) profile.setDisplayName(displayName);
        if (dateOfBirth != null) profile.setDateOfBirth(dateOfBirth);
        if (gradeLevel != null) profile.setGradeLevel(gradeLevel);
        if (school != null) profile.setSchool(school);
        if (course != null) profile.setCourse(course);
        if (interests != null) profile.setInterests(interests);
        if (learningStyle != null) profile.setPreferredLearningStyle(learningStyle);
        if (learningGoals != null) profile.setLearningGoals(learningGoals);
        if (avatarUrl != null) profile.setAvatarUrl(avatarUrl);
        
        return profileRepository.save(profile);
    }
    
    /**
     * Update streak on login/activity
     */
    @Transactional
    public void updateStreak(Long userId) {
        StudentProfile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) return;
        
        LocalDate today = LocalDate.now();
        LocalDate lastActive = profile.getLastActiveDate();
        
        if (lastActive == null || lastActive.isBefore(today.minusDays(1))) {
            // Streak broken - reset to 1
            profile.setCurrentStreak(1);
        } else if (lastActive.isBefore(today)) {
            // Continue streak
            profile.setCurrentStreak(profile.getCurrentStreak() + 1);
        }
        // If lastActive is today, don't change streak
        
        profile.setLastActiveDate(today);
        profileRepository.save(profile);
    }
    
    /**
     * Award XP to a student
     */
    @Transactional
    public void awardXp(Long userId, int xpAmount) {
        StudentProfile profile = profileRepository.findByUserId(userId).orElse(null);
        if (profile == null) return;
        
        int newXp = (profile.getTotalXp() != null ? profile.getTotalXp() : 0) + xpAmount;
        profile.setTotalXp(newXp);
        profileRepository.save(profile);
    }
    
    /**
     * Get current level based on XP (every 100 XP = 1 level)
     */
    public int getLevel(StudentProfile profile) {
        if (profile == null || profile.getTotalXp() == null) return 1;
        return (profile.getTotalXp() / 100) + 1;
    }
    
    /**
     * Get XP needed for next level
     */
    public int getXpToNextLevel(StudentProfile profile) {
        if (profile == null || profile.getTotalXp() == null) return 100;
        return 100 - (profile.getTotalXp() % 100);
    }
    
    /**
     * Check if profile is complete
     */
    public boolean isProfileComplete(Long userId) {
        return profileRepository.findByUserId(userId)
                .map(StudentProfile::getProfileCompleted)
                .orElse(false);
    }
    
    /**
     * Get all profiles (for admin)
     */
    public List<StudentProfile> getAllProfiles() {
        return profileRepository.findAll();
    }
    
    /**
     * Delete profile
     */
    @Transactional
    public void deleteProfile(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profileRepository::delete);
    }
}

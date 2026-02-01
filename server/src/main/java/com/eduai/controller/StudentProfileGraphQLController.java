package com.eduai.controller;

import com.eduai.model.StudentProfile;
import com.eduai.service.StudentProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.util.List;

@Controller
public class StudentProfileGraphQLController {
    
    private final StudentProfileService profileService;
    
    @Autowired
    public StudentProfileGraphQLController(StudentProfileService profileService) {
        this.profileService = profileService;
    }
    
    // Queries
    
    @QueryMapping
    public StudentProfile studentProfile(@Argument Long userId) {
        return profileService.getProfileByUserId(userId).orElse(null);
    }
    
    @QueryMapping
    public Boolean isProfileComplete(@Argument Long userId) {
        return profileService.isProfileComplete(userId);
    }
    
    @QueryMapping
    public List<StudentProfile> allStudentProfiles() {
        return profileService.getAllProfiles();
    }
    
    // Mutations
    
    @MutationMapping
    public StudentProfile createStudentProfile(
            @Argument Long userId,
            @Argument String displayName,
            @Argument String dateOfBirth,
            @Argument String gradeLevel,
            @Argument String school,
            @Argument String course,
            @Argument List<String> interests) {
        
        LocalDate dob = LocalDate.parse(dateOfBirth);
        StudentProfile.GradeLevel grade = StudentProfile.GradeLevel.valueOf(gradeLevel);
        
        return profileService.createProfile(userId, displayName, dob, grade, school, course, interests);
    }
    
    @MutationMapping
    public StudentProfile updateStudentProfile(
            @Argument Long userId,
            @Argument String displayName,
            @Argument String dateOfBirth,
            @Argument String gradeLevel,
            @Argument String school,
            @Argument String course,
            @Argument List<String> interests,
            @Argument String learningStyle,
            @Argument String learningGoals,
            @Argument String avatarUrl) {
        
        LocalDate dob = dateOfBirth != null ? LocalDate.parse(dateOfBirth) : null;
        StudentProfile.GradeLevel grade = gradeLevel != null ? StudentProfile.GradeLevel.valueOf(gradeLevel) : null;
        StudentProfile.LearningStyle style = learningStyle != null ? StudentProfile.LearningStyle.valueOf(learningStyle) : null;
        
        return profileService.updateProfile(userId, displayName, dob, grade, school, course, interests, style, learningGoals, avatarUrl);
    }
    
    @MutationMapping
    public Boolean deleteStudentProfile(@Argument Long userId) {
        profileService.deleteProfile(userId);
        return true;
    }
    
    // Schema mappings for computed fields
    
    @SchemaMapping(typeName = "StudentProfile", field = "age")
    public Integer age(StudentProfile profile) {
        return profile.getAge();
    }
    
    @SchemaMapping(typeName = "StudentProfile", field = "level")
    public Integer level(StudentProfile profile) {
        return profileService.getLevel(profile);
    }
    
    @SchemaMapping(typeName = "StudentProfile", field = "xpToNextLevel")
    public Integer xpToNextLevel(StudentProfile profile) {
        return profileService.getXpToNextLevel(profile);
    }
}

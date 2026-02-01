package com.eduai.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Entity
@Table(name = "student_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(nullable = false)
    private LocalDate dateOfBirth;
    
    @Column(nullable = false)
    private String displayName; // How student wants to be called
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GradeLevel gradeLevel; // Class 1-12
    
    @Column(length = 100)
    private String school;
    
    @Column(length = 100)
    private String course; // Current course/stream (Science, Commerce, Arts for higher classes)
    
    @ElementCollection
    @CollectionTable(name = "student_interests", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "interest")
    private List<String> interests; // List of subjects/topics they're interested in
    
    @Enumerated(EnumType.STRING)
    private LearningStyle preferredLearningStyle;
    
    @Column(length = 500)
    private String learningGoals; // What they want to achieve
    
    @Column(nullable = false)
    private Integer totalXp = 0; // Experience points for gamification
    
    @Column(nullable = false)
    private Integer currentStreak = 0; // Daily login streak
    
    @Column
    private LocalDate lastActiveDate;
    
    @Column(length = 255)
    private String avatarUrl;
    
    @Column(nullable = false)
    private Boolean profileCompleted = false;
    
    // Calculated field - not stored in DB
    @Transient
    public Integer getAge() {
        if (dateOfBirth == null) return null;
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
    
    // Grade levels from 1 to 12
    public enum GradeLevel {
        GRADE_1("1st Grade", 1),
        GRADE_2("2nd Grade", 2),
        GRADE_3("3rd Grade", 3),
        GRADE_4("4th Grade", 4),
        GRADE_5("5th Grade", 5),
        GRADE_6("6th Grade", 6),
        GRADE_7("7th Grade", 7),
        GRADE_8("8th Grade", 8),
        GRADE_9("9th Grade", 9),
        GRADE_10("10th Grade", 10),
        GRADE_11("11th Grade", 11),
        GRADE_12("12th Grade", 12);
        
        private final String displayName;
        private final int numericValue;
        
        GradeLevel(String displayName, int numericValue) {
            this.displayName = displayName;
            this.numericValue = numericValue;
        }
        
        public String getDisplayName() { return displayName; }
        public int getNumericValue() { return numericValue; }
    }
    
    public enum LearningStyle {
        VISUAL,      // Learns best with images, diagrams, videos
        AUDITORY,    // Learns best by listening
        READING,     // Learns best by reading/writing
        KINESTHETIC  // Learns best by doing/practicing
    }
}

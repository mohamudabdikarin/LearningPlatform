package com.mycourse.elearningplatform.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;

@Entity
@Table(name = "courses")
@Getter @Setter
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String videoUrl;
    private BigDecimal discountPrice;
    private boolean discountActive = false;
    private Integer duration; // Duration in hours
    
    // Additional fields for course details
    private String level; // Beginner, Intermediate, Advanced
    
    @Column(columnDefinition = "TEXT")
    private String learningObjectives;
    
    @Column(columnDefinition = "TEXT")
    private String requirements;
    
    @Column(columnDefinition = "TEXT")
    private String targetAudience;

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    @JsonIgnoreProperties({"courses", "enrollments", "password", "email", "enabled", "accountNonExpired", "accountNonLocked", "credentialsNonExpired"})
    private User instructor;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("course")
    private java.util.List<Enrollment> enrollments = new java.util.ArrayList<>();
}
package com.mycourse.elearningplatform.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments")
@Getter
@Setter
@NoArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    private LocalDateTime enrolledAt = LocalDateTime.now();
    
    private Integer progress = 0;
    
    private LocalDateTime lastActivityDate = LocalDateTime.now();
    
    // Average quiz score for this enrollment
    private Integer averageQuizScore;

    // Payment status
    private boolean paid = false;

    public Enrollment(User user, Course course) {
        this.user = user;
        this.course = course;
    }
    
    public void updateLastActivityDate() {
        this.lastActivityDate = LocalDateTime.now();
    }
}

package com.mycourse.elearningplatform.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_ratings")
@Getter @Setter
public class CourseRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    private int rating; // 1-5
    private String comment;
    private LocalDateTime createdAt = LocalDateTime.now();
} 
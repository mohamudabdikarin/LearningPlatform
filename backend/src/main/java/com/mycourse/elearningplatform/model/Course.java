package com.mycourse.elearningplatform.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

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

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    private User instructor;
}
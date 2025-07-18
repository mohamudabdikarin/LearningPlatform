package com.mycourse.elearningplatform.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    private Integer totalPoints;

    public Quiz(String title, String description, Course course, Integer totalPoints) {
        this.title = title;
        this.description = description;
        this.course = course;
        this.totalPoints = totalPoints;
    }
}

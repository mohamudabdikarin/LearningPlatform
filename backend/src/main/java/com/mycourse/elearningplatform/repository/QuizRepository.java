package com.mycourse.elearningplatform.repository;

import com.mycourse.elearningplatform.model.Quiz;
import com.mycourse.elearningplatform.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCourse(Course course);
} 
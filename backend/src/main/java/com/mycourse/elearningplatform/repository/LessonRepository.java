package com.mycourse.elearningplatform.repository;

import com.mycourse.elearningplatform.model.Lesson;
import com.mycourse.elearningplatform.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByCourse(Course course);
} 
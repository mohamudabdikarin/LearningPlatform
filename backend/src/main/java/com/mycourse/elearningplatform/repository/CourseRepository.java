package com.mycourse.elearningplatform.repository;

import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByInstructor(User instructor);
}
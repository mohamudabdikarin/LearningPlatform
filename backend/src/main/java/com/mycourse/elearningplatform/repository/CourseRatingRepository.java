package com.mycourse.elearningplatform.repository;

import com.mycourse.elearningplatform.model.CourseRating;
import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CourseRatingRepository extends JpaRepository<CourseRating, Long> {
    List<CourseRating> findByCourse(Course course);
    Optional<CourseRating> findByCourseAndUser(Course course, User user);
    long countByCourse(Course course);
} 
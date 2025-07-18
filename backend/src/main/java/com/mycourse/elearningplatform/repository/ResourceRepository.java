package com.mycourse.elearningplatform.repository;

import com.mycourse.elearningplatform.model.Resource;
import com.mycourse.elearningplatform.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByCourse(Course course);
} 
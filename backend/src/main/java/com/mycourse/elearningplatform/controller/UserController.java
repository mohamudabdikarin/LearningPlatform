package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.CourseRepository;
import com.mycourse.elearningplatform.repository.LessonRepository;
import com.mycourse.elearningplatform.repository.RoleRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private com.mycourse.elearningplatform.repository.EnrollmentRepository enrollmentRepository;
    @Autowired
    private com.mycourse.elearningplatform.repository.ResourceRepository resourceRepository;
    @Autowired
    private com.mycourse.elearningplatform.repository.QuizRepository quizRepository;


    // Get current user's profile
    @GetMapping("/me")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        return userRepository.findByEmail(principal.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update current user's profile
    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal, @RequestBody User updated) {
        return userRepository.findByEmail(principal.getUsername()).map(user -> {
            user.setFirstName(updated.getFirstName());
            user.setLastName(updated.getLastName());
            // Email and password update logic can be added with validation
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Removed teacher CRUD endpoints as per new requirements: only self-management is allowed.

    // Public: Platform statistics
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("courses", courseRepository.count());
        stats.put("students", userRepository.countByRoles_Name("STUDENT"));
        stats.put("teachers", userRepository.countByRoles_Name("TEACHER"));
        stats.put("lessons", lessonRepository.count());
        return stats;
    }

    // Teacher dashboard stats for a given teacher
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/teacher-dashboard/{id}")
    public ResponseEntity<Map<String, Object>> getTeacherDashboard(
        @PathVariable Long id,
        @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        // ✅ Simplified, more secure, and more efficient check!
        if (principal == null || !principal.getId().equals(id)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only view your own dashboard"));
        }

        // Find teacher using the now-trusted principal ID
        User teacher = userRepository.findById(principal.getId()).orElse(null);
        if (teacher == null) {
            return ResponseEntity.notFound().build();
        }
        // Security check: Only allow teachers to access their own dashboard
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (authenticatedUser == null || !authenticatedUser.getId().equals(id)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only view your own dashboard"));
        }
        
        // Get courses taught by this teacher
        List<com.mycourse.elearningplatform.model.Course> courses = courseRepository.findByInstructor(teacher);
        int numCourses = courses.size();
        // Get all lessons for these courses
        int numLessons = 0;
        int numResources = 0;
        int numStudents = 0;
        java.util.Set<Long> studentIds = new java.util.HashSet<>();
        for (com.mycourse.elearningplatform.model.Course course : courses) {
            numLessons += lessonRepository.findByCourse(course).size();
            numResources += resourceRepository.findByCourse(course).size();
            // Count unique students enrolled in this course
            java.util.List<com.mycourse.elearningplatform.model.Enrollment> enrollments = enrollmentRepository.findByCourse(course);
            for (com.mycourse.elearningplatform.model.Enrollment enrollment : enrollments) {
                studentIds.add(enrollment.getUser().getId());
            }
        }
        numStudents = studentIds.size();
        Map<String, Object> stats = new HashMap<>();
        stats.put("courses", numCourses);
        stats.put("students", numStudents);
        stats.put("lessons", numLessons);
        stats.put("resources", numResources);
        return ResponseEntity.ok(stats);
    }
} 
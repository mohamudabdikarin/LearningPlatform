package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.model.Enrollment;
import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.EnrollmentRepository;
import com.mycourse.elearningplatform.repository.CourseRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private UserRepository userRepository;

    // Student: Enroll in a course
    @PreAuthorize("hasAuthority('STUDENT')")
    @PostMapping("/course/{courseId}")
    public ResponseEntity<?> enroll(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User student = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        if (enrollmentRepository.existsByUserAndCourse(student, course)) {
            return ResponseEntity.badRequest().body("Already enrolled");
        }
        Enrollment enrollment = new Enrollment(student, course);
        enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(enrollment);
    }

    // Student: Unenroll from a course
    @PreAuthorize("hasAuthority('STUDENT')")
    @DeleteMapping("/course/{courseId}")
    public ResponseEntity<?> unenroll(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User student = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        Enrollment enrollment = enrollmentRepository.findByUserAndCourse(student, course).orElse(null);
        if (enrollment == null) {
            return ResponseEntity.notFound().build();
        }
        enrollmentRepository.delete(enrollment);
        return ResponseEntity.ok().build();
    }

    // List enrollments for current user
    @GetMapping("/me")
    public List<Enrollment> myEnrollments(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return enrollmentRepository.findByUser(user);
    }
    
    // List courses for current user
    @GetMapping("/my-courses")
    public List<Enrollment> myCourses(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return enrollmentRepository.findByUser(user);
    }
    
    // Check if user is enrolled in a course
    @GetMapping("/check/{courseId}")
    public ResponseEntity<?> checkEnrollment(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        boolean enrolled = enrollmentRepository.existsByUserAndCourse(user, course);
        return ResponseEntity.ok(java.util.Map.of("enrolled", enrolled));
    }

    // Teacher: List enrollments for a course
    @PreAuthorize("hasAuthority('TEACHER')")
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Enrollment>> enrollmentsByCourse(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (authenticatedUser == null || !course.getInstructor().getId().equals(authenticatedUser.getId())) {
            return ResponseEntity.status(403).body(null);
        }
        return ResponseEntity.ok(enrollmentRepository.findByCourse(course));
    }

    // Teacher: List enrollments for a user (only their own)
    @PreAuthorize("hasAuthority('TEACHER')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Enrollment>> enrollmentsByUser(@PathVariable Long userId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (authenticatedUser == null || !authenticatedUser.getId().equals(userId)) {
            return ResponseEntity.status(403).body(null);
        }
        return ResponseEntity.ok(enrollmentRepository.findByUser(authenticatedUser));
    }
} 
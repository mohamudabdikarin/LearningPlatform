package com.mycourse.elearningplatform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.mycourse.elearningplatform.dto.EnrollmentDTO;
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
import java.util.Map;
import java.util.stream.Collectors;

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
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/course/{courseId}")
    public ResponseEntity<?> enroll(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User student = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        if (enrollmentRepository.existsByUserAndCourse(student, course)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Already enrolled"));
        }
        Enrollment enrollment = new Enrollment(student, course);
        enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(Map.of("success", true, "message", "Enrolled successfully"));
    }

    // Student: Unenroll from a course
    @PreAuthorize("hasRole('STUDENT')")
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
    public List<EnrollmentDTO> myEnrollments(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        return enrollments.stream()
                .map(EnrollmentDTO::new)
                .collect(Collectors.toList());
    }
    
    // List courses for current user
    @GetMapping("/my-courses")
    public List<EnrollmentDTO> myCourses(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        return enrollments.stream()
                .map(EnrollmentDTO::new)
                .collect(Collectors.toList());
    }
    
    // Student: Get detailed enrollments with progress
    @GetMapping("/student")
    public List<EnrollmentDTO> getStudentEnrollments(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        return enrollments.stream()
                .map(EnrollmentDTO::new)
                .collect(Collectors.toList());
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
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<EnrollmentDTO>> enrollmentsByCourse(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (authenticatedUser == null || !course.getInstructor().getId().equals(authenticatedUser.getId())) {
            return ResponseEntity.status(403).body(null);
        }
        List<Enrollment> enrollments = enrollmentRepository.findByCourse(course);
        List<EnrollmentDTO> enrollmentDTOs = enrollments.stream()
                .map(EnrollmentDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(enrollmentDTOs);
    }

    // Teacher: List all enrolled students for teacher's courses
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/teacher/enrolled-students")
    public ResponseEntity<List<EnrollmentDTO>> getEnrolledStudentsForTeacher(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User teacher = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<Course> teacherCourses = courseRepository.findByInstructor(teacher);
        List<Enrollment> allEnrollments = new java.util.ArrayList<>();
        
        for (Course course : teacherCourses) {
            List<Enrollment> courseEnrollments = enrollmentRepository.findByCourse(course);
            allEnrollments.addAll(courseEnrollments);
        }
        
        List<EnrollmentDTO> enrollmentDTOs = allEnrollments.stream()
                .map(EnrollmentDTO::new)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(enrollmentDTOs);
    }

    // Teacher: Get enrolled students for a specific course with detailed info
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/teacher/course/{courseId}/enrolled-students")
    public ResponseEntity<List<EnrollmentDTO>> getEnrolledStudentsForCourse(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        User teacher = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        
        if (!course.getInstructor().getId().equals(teacher.getId())) {
            return ResponseEntity.status(403).body(null);
        }
        
        List<Enrollment> enrollments = enrollmentRepository.findByCourse(course);
        List<EnrollmentDTO> enrollmentDTOs = enrollments.stream()
                .map(EnrollmentDTO::new)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(enrollmentDTOs);
    }

    // Teacher: List enrollments for a user (only their own)
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<EnrollmentDTO>> enrollmentsByUser(@PathVariable Long userId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (authenticatedUser == null || !authenticatedUser.getId().equals(userId)) {
            return ResponseEntity.status(403).body(null);
        }
        List<Enrollment> enrollments = enrollmentRepository.findByUser(authenticatedUser);
        List<EnrollmentDTO> enrollmentDTOs = enrollments.stream()
                .map(EnrollmentDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(enrollmentDTOs);
    }

    // Mark enrollment as paid (after payment)
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/course/{courseId}/pay")
    public ResponseEntity<?> markAsPaid(@PathVariable Long courseId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User student = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        Enrollment enrollment = enrollmentRepository.findByUserAndCourse(student, course).orElse(null);
        if (enrollment == null) {
            return ResponseEntity.notFound().build();
        }
        enrollment.setPaid(true);
        enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(Map.of("success", true, "message", "Payment successful"));
    }

    // Save lecture progress (per user, per course)
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/course/{courseId}/progress")
    public ResponseEntity<?> saveProgress(@PathVariable Long courseId, @RequestBody Map<String, Object> body, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User student = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Course course = courseRepository.findById(courseId).orElseThrow();
        Enrollment enrollment = enrollmentRepository.findByUserAndCourse(student, course).orElse(null);
        if (enrollment == null) {
            return ResponseEntity.notFound().build();
        }
        Integer progress = (Integer) body.getOrDefault("progress", 0);
        enrollment.setProgress(progress);
        enrollment.updateLastActivityDate();
        enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(enrollment);
    }
} 
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
import java.util.ArrayList;

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

    // Enhanced profile endpoint
    @GetMapping("/profile")
    public ResponseEntity<User> getDetailedProfile(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
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

    // Enhanced profile update endpoint
    @PutMapping("/profile")
    public ResponseEntity<User> updateDetailedProfile(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal, @RequestBody User updated) {
        return userRepository.findByEmail(principal.getUsername()).map(user -> {
            user.setFirstName(updated.getFirstName());
            user.setLastName(updated.getLastName());
            user.setPhone(updated.getPhone());
            user.setAddress(updated.getAddress());
            user.setBio(updated.getBio());
            user.setBirthDate(updated.getBirthDate());
            user.setInterests(updated.getInterests());
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Get user achievements
    @GetMapping("/achievements")
    public ResponseEntity<List<Map<String, Object>>> getAchievements(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        return userRepository.findByEmail(principal.getUsername()).map(user -> {
            List<Map<String, Object>> achievements = new ArrayList<>();
            
            // Get user enrollments
            List<com.mycourse.elearningplatform.model.Enrollment> enrollments = enrollmentRepository.findByUser(user);
            
            // Course completion achievements
            long completedCourses = enrollments.stream()
                .filter(e -> e.getProgress() != null && e.getProgress() == 100)
                .count();
            
            if (completedCourses >= 1) {
                Map<String, Object> firstCourse = new HashMap<>();
                firstCourse.put("id", "first-course");
                firstCourse.put("title", "First Course Completed");
                firstCourse.put("description", "Completed your first course");
                firstCourse.put("icon", "🎓");
                achievements.add(firstCourse);
            }
            
            if (completedCourses >= 5) {
                Map<String, Object> fiveCourses = new HashMap<>();
                fiveCourses.put("id", "five-courses");
                fiveCourses.put("title", "Course Master");
                fiveCourses.put("description", "Completed 5 courses");
                fiveCourses.put("icon", "🏆");
                achievements.add(fiveCourses);
            }
            
            // Learning hours achievement
            long totalHours = enrollments.stream()
                .mapToLong(e -> e.getCourse() != null ? (e.getCourse().getDuration() != null ? e.getCourse().getDuration() : 0) : 0)
                .sum();
            
            if (totalHours >= 10) {
                Map<String, Object> tenHours = new HashMap<>();
                tenHours.put("id", "ten-hours");
                tenHours.put("title", "Dedicated Learner");
                tenHours.put("description", "Spent 10+ hours learning");
                tenHours.put("icon", "⏰");
                achievements.add(tenHours);
            }
            
            // Quiz performance achievements
            long highScores = enrollments.stream()
                .filter(e -> e.getAverageQuizScore() != null && e.getAverageQuizScore() >= 90)
                .count();
            
            if (highScores >= 1) {
                Map<String, Object> quizMaster = new HashMap<>();
                quizMaster.put("id", "quiz-master");
                quizMaster.put("title", "Quiz Master");
                quizMaster.put("description", "Achieved 90%+ on a quiz");
                quizMaster.put("icon", "🧠");
                achievements.add(quizMaster);
            }
            
            return ResponseEntity.ok(achievements);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Get user certificates
    @GetMapping("/certificates")
    public ResponseEntity<List<Map<String, Object>>> getCertificates(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        return userRepository.findByEmail(principal.getUsername()).map(user -> {
            List<Map<String, Object>> certificates = new ArrayList<>();
            
            // Get completed courses
            List<com.mycourse.elearningplatform.model.Enrollment> enrollments = enrollmentRepository.findByUser(user);
            
            enrollments.stream()
                .filter(e -> e.getProgress() != null && e.getProgress() == 100)
                .forEach(enrollment -> {
                    Map<String, Object> certificate = new HashMap<>();
                    certificate.put("id", "cert-" + enrollment.getCourse().getId());
                    certificate.put("title", enrollment.getCourse().getTitle() + " Certificate");
                    certificate.put("courseId", enrollment.getCourse().getId());
                    certificate.put("issueDate", enrollment.getEnrolledAt()); // Using enrollment date as certificate date
                    certificate.put("url", "/certificates/" + enrollment.getCourse().getId()); // Placeholder URL
                    certificates.add(certificate);
                });
            
            return ResponseEntity.ok(certificates);
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

    // Simplified teacher dashboard endpoint (no ID parameter needed)
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/teacher-dashboard")
    public ResponseEntity<Map<String, Object>> getTeacherDashboardSimple(
        @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        try {
            System.out.println("[DEBUG] Teacher dashboard called");
            System.out.println("[DEBUG] Principal: " + (principal != null ? principal.getUsername() : "null"));
            
            if (principal == null) {
                System.out.println("[DEBUG] Principal is null");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            // Find teacher using the principal
            User teacher = userRepository.findByEmail(principal.getUsername()).orElse(null);
            System.out.println("[DEBUG] Teacher found: " + (teacher != null ? teacher.getEmail() : "null"));
            
            if (teacher == null) {
                System.out.println("[DEBUG] Teacher not found in database");
                return ResponseEntity.status(404).body(Map.of("error", "Teacher not found"));
            }
            
            // Check if user has TEACHER role
            boolean hasTeacherRole = teacher.getRoles().stream()
                .anyMatch(role -> "TEACHER".equals(role.getName()));
            System.out.println("[DEBUG] Has TEACHER role: " + hasTeacherRole);
            
            if (!hasTeacherRole) {
                System.out.println("[DEBUG] User does not have TEACHER role");
                return ResponseEntity.status(403).body(Map.of("error", "Access denied: TEACHER role required"));
            }
            
            // Get courses taught by this teacher
            List<com.mycourse.elearningplatform.model.Course> courses = courseRepository.findByInstructor(teacher);
            int numCourses = courses.size();
            System.out.println("[DEBUG] Number of courses: " + numCourses);
            
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
            
            System.out.println("[DEBUG] Stats - Courses: " + numCourses + ", Students: " + numStudents + ", Lessons: " + numLessons + ", Resources: " + numResources);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("courses", numCourses);
            stats.put("students", numStudents);
            stats.put("lessons", numLessons);
            stats.put("resources", numResources);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.out.println("[ERROR] Teacher dashboard error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    // Debug endpoint to check user roles
    @GetMapping("/debug/roles")
    public ResponseEntity<Map<String, Object>> debugUserRoles(
        @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }

            User user = userRepository.findByEmail(principal.getUsername()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("userId", user.getId());
            debugInfo.put("email", user.getEmail());
            debugInfo.put("firstName", user.getFirstName());
            debugInfo.put("lastName", user.getLastName());
            
            // Get roles from database
            List<String> dbRoles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(java.util.stream.Collectors.toList());
            debugInfo.put("databaseRoles", dbRoles);
            
            // Get roles from JWT authorities
            List<String> jwtRoles = principal.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(java.util.stream.Collectors.toList());
            debugInfo.put("jwtAuthorities", jwtRoles);
            
            // Check if user has TEACHER role
            boolean hasTeacherRole = dbRoles.contains("TEACHER");
            debugInfo.put("hasTeacherRole", hasTeacherRole);
            
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Debug error: " + e.getMessage()));
        }
    }
} 
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
import com.mycourse.elearningplatform.repository.*;


import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    // Injecting required repositories
    @Autowired private UserRepository userRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private LessonRepository lessonRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private QuizRepository quizRepository;

    // ✅ Get current authenticated user's profile
    @GetMapping("/me")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        return userRepository.findByEmail(principal.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Enhanced profile fetch (includes more details)
    @GetMapping("/profile")
    public ResponseEntity<User> getDetailedProfile(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        return userRepository.findByEmail(principal.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Basic profile update (name only)
    @PutMapping("/me")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal, @RequestBody User updated) {
        return userRepository.findByEmail(principal.getUsername()).map(user -> {
            user.setFirstName(updated.getFirstName());
            user.setLastName(updated.getLastName());
            userRepository.save(user);
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ✅ Full profile update with more fields
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

    // 🎯 Get user achievements based on progress
    @GetMapping("/achievements")
    public ResponseEntity<List<Map<String, Object>>> getAchievements(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        return userRepository.findByEmail(principal.getUsername()).map(user -> {
            List<Map<String, Object>> achievements = new ArrayList<>();
            List<com.mycourse.elearningplatform.model.Enrollment> enrollments = enrollmentRepository.findByUser(user);

            // Count completed courses
            long completedCourses = enrollments.stream()
                    .filter(e -> e.getProgress() != null && e.getProgress() == 100)
                    .count();

            if (completedCourses >= 1) {
                achievements.add(Map.of("id", "first-course", "title", "First Course Completed", "description", "Completed your first course", "icon", "🎓"));
            }
            if (completedCourses >= 5) {
                achievements.add(Map.of("id", "five-courses", "title", "Course Master", "description", "Completed 5 courses", "icon", "🏆"));
            }

            // Total hours of learning from course durations
            long totalHours = enrollments.stream()
                    .mapToLong(e -> Optional.ofNullable(e.getCourse()).map(c -> Optional.ofNullable(c.getDuration()).orElse(0)).orElse(0))
                    .sum();

            if (totalHours >= 10) {
                achievements.add(Map.of("id", "ten-hours", "title", "Dedicated Learner", "description", "Spent 10+ hours learning", "icon", "⏰"));
            }

            // High quiz performance
            long highScores = enrollments.stream()
                    .filter(e -> e.getAverageQuizScore() != null && e.getAverageQuizScore() >= 90)
                    .count();

            if (highScores >= 1) {
                achievements.add(Map.of("id", "quiz-master", "title", "Quiz Master", "description", "Achieved 90%+ on a quiz", "icon", "🧠"));
            }

            return ResponseEntity.ok(achievements);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 🎓 Return certificates for completed courses
    @GetMapping("/certificates")
    public ResponseEntity<List<Map<String, Object>>> getCertificates(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        return userRepository.findByEmail(principal.getUsername()).map(user -> {
            List<Map<String, Object>> certificates = new ArrayList<>();
            List<com.mycourse.elearningplatform.model.Enrollment> enrollments = enrollmentRepository.findByUser(user);

            enrollments.stream()
                    .filter(e -> e.getProgress() != null && e.getProgress() == 100)
                    .forEach(enrollment -> {
                        Map<String, Object> cert = new HashMap<>();
                        cert.put("id", "cert-" + enrollment.getCourse().getId());
                        cert.put("title", enrollment.getCourse().getTitle() + " Certificate");
                        cert.put("courseId", enrollment.getCourse().getId());
                        cert.put("issueDate", enrollment.getEnrolledAt());
                        cert.put("url", "/certificates/" + enrollment.getCourse().getId());
                        certificates.add(cert);
                    });

            return ResponseEntity.ok(certificates);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 📊 Public statistics for all users
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return Map.of(
                "courses", courseRepository.count(),
                "students", userRepository.countByRoles_Name("STUDENT"),
                "teachers", userRepository.countByRoles_Name("TEACHER"),
                "lessons", lessonRepository.count()
        );
    }

    // 📈 Teacher dashboard: requires TEACHER role and correct ID
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/teacher-dashboard/{id}")
    public ResponseEntity<Map<String, Object>> getTeacherDashboard(@PathVariable Long id, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        if (principal == null || !principal.getId().equals(id)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only view your own dashboard"));
        }

        User teacher = userRepository.findById(principal.getId()).orElse(null);
        if (teacher == null) return ResponseEntity.notFound().build();

        List<com.mycourse.elearningplatform.model.Course> courses = courseRepository.findByInstructor(teacher);
        Set<Long> studentIds = new HashSet<>();
        int numLessons = 0, numResources = 0;

        for (var course : courses) {
            numLessons += lessonRepository.findByCourse(course).size();
            numResources += resourceRepository.findByCourse(course).size();
            enrollmentRepository.findByCourse(course).forEach(e -> studentIds.add(e.getUser().getId()));
        }

        return ResponseEntity.ok(Map.of(
                "courses", courses.size(),
                "students", studentIds.size(),
                "lessons", numLessons,
                "resources", numResources
        ));
    }

    // 🧪 Simple endpoint to debug current user's roles
    @GetMapping("/debug/roles")
    public ResponseEntity<Map<String, Object>> debugUserRoles(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));

        User user = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        List<String> dbRoles = user.getRoles().stream().map(r -> r.getName()).toList();
        List<String> jwtRoles = principal.getAuthorities().stream().map(a -> a.getAuthority()).toList();

        return ResponseEntity.ok(Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "databaseRoles", dbRoles,
                "jwtAuthorities", jwtRoles,
                "hasTeacherRole", dbRoles.contains("TEACHER")
        ));
    }
}

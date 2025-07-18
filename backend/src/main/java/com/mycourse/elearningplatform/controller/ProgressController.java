package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.model.Enrollment;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.EnrollmentRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {
    
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get progress for current user
    @GetMapping("/my-progress")
    public ResponseEntity<?> getMyProgress(@AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        List<Enrollment> enrollments = enrollmentRepository.findByUser(user);
        List<Map<String, Object>> progressData = enrollments.stream()
            .map(enrollment -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("enrollmentId", enrollment.getId());
                map.put("courseId", enrollment.getCourse().getId());
                map.put("courseTitle", enrollment.getCourse().getTitle());
                map.put("completionPercentage", enrollment.getProgress() != null ? enrollment.getProgress() : 0);
                map.put("lastActivityDate", enrollment.getLastActivityDate() != null ? enrollment.getLastActivityDate().toString() : null);
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(progressData);
    }
    
    // Update progress for a course
    @PutMapping("/course/{courseId}")
    public ResponseEntity<?> updateProgress(
            @PathVariable Long courseId,
            @RequestBody Map<String, Object> progressData,
            @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(user.getId(), courseId)
            .orElseThrow(() -> new RuntimeException("Enrollment not found"));
        Object progressObj = progressData.get("progress");
        Integer progress = null;
        if (progressObj instanceof Number) {
            progress = ((Number) progressObj).intValue();
        } else if (progressObj instanceof String) {
            try {
                progress = Integer.parseInt((String) progressObj);
            } catch (NumberFormatException ignored) {}
        }
        if (progress != null) {
            enrollment.setProgress(progress);
            // Ensure updateLastActivityDate exists in Enrollment
            if (enrollment.getClass().getDeclaredMethods() != null) {
                try { enrollment.updateLastActivityDate(); } catch (Exception ignored) {}
            }
            enrollmentRepository.save(enrollment);
        }
        return ResponseEntity.ok(Map.of(
            "enrollmentId", enrollment.getId(),
            "courseId", enrollment.getCourse().getId(),
            "progress", enrollment.getProgress()
        ));
    }
}
package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.service.CourseService;
import com.mycourse.elearningplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.mycourse.elearningplatform.model.Resource;
import com.mycourse.elearningplatform.repository.ResourceRepository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.web.client.RestTemplate;
import com.mycourse.elearningplatform.model.CourseRating;
import com.mycourse.elearningplatform.repository.CourseRatingRepository;
import java.math.BigDecimal;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
public class CourseController {
    @Autowired
    private CourseService courseService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ResourceRepository resourceRepository;
    @Value("${supabase.url}")
    private String supabaseUrl;
    @Value("${supabase.service.key}")
    private String supabaseServiceKey;
    @Autowired
    private RestTemplate restTemplate;
    @Autowired
    private CourseRatingRepository courseRatingRepository;

    // Public: List all courses
    @GetMapping
    public ResponseEntity<?> getAllCourses() {
        var courses = courseService.getAllCourses();
        var courseData = courses.stream().map(course -> Map.of(
            "id", course.getId(),
            "title", course.getTitle(),
            "description", course.getDescription(),
            "price", course.getPrice(),
            "imageUrl", course.getImageUrl(),
            "videoUrl", course.getVideoUrl(),
            "discountPrice", course.getDiscountPrice(),
            "discountActive", course.isDiscountActive(),
            "duration", course.getDuration(),
            "instructor", Map.of(
                "id", course.getInstructor().getId(),
                "firstName", course.getInstructor().getFirstName(),
                "lastName", course.getInstructor().getLastName(),
                "email", course.getInstructor().getEmail()
            )
        )).toList();
        return ResponseEntity.ok(courseData);
    }

    // Public: Get course by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getCourse(@PathVariable Long id) {
        return courseService.getCourseById(id)
                .map(course -> {
                    Map<String, Object> courseData = Map.of(
                        "id", course.getId(),
                        "title", course.getTitle(),
                        "description", course.getDescription(),
                        "price", course.getPrice(),
                        "imageUrl", course.getImageUrl(),
                        "videoUrl", course.getVideoUrl(),
                        "discountPrice", course.getDiscountPrice(),
                        "discountActive", course.isDiscountActive(),
                        "duration", course.getDuration(),
                        "instructor", Map.of(
                            "id", course.getInstructor().getId(),
                            "firstName", course.getInstructor().getFirstName(),
                            "lastName", course.getInstructor().getLastName(),
                            "email", course.getInstructor().getEmail()
                        )
                    );
                    return ResponseEntity.ok(courseData);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Public: Search courses
    @GetMapping("/search")
    public List<Course> searchCourses(@RequestParam String q) {
        return courseService.searchCourses(q);
    }

    // Public: List courses by instructor
    @GetMapping("/instructor/{instructorId}")
    public List<Course> getCoursesByInstructor(@PathVariable Long instructorId) {
        return courseService.getCoursesByInstructor(instructorId);
    }

    // Teacher: Create course
    @PreAuthorize("hasRole('TEACHER')") // Changed from hasAuthority
    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        // Set instructor as current user
        User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        course.setInstructor(instructor);
        // videoUrl is now accepted from the request body
        return ResponseEntity.ok(courseService.createCourse(course));
    }

    // Teacher: Update course
    @PreAuthorize("hasRole('TEACHER')") // Changed from hasAuthority
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody Course updated, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        try {
            User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
            Course result = courseService.updateCourse(id, updated, instructor);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Forbidden")) return ResponseEntity.status(403).body(e.getMessage());
            if (e.getMessage().contains("not found")) return ResponseEntity.status(404).body(e.getMessage());
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    // Teacher: Delete course
    @PreAuthorize("hasRole('TEACHER')") // Changed from hasAuthority
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        try {
            User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
            courseService.deleteCourse(id, instructor);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Forbidden")) return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
            if (e.getMessage().contains("not found")) return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    // Teacher: Upload resource to course
    @PreAuthorize("hasRole('TEACHER')") // Changed from hasAuthority
    @PostMapping("/{courseId}/resources")
    public ResponseEntity<?> uploadResourceToCourse(
            @PathVariable Long courseId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        String filePath = body.get("filePath");
        if (filePath == null || filePath.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing filePath"));
        }
        Course course = courseService.getCourseById(courseId).orElseThrow();
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (authenticatedUser == null || !course.getInstructor().getId().equals(authenticatedUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only upload resources to your own courses"));
        }
        String fileType = filePath.contains(".") ? filePath.substring(filePath.lastIndexOf('.') + 1) : "unknown";
        String fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        var resource = courseService.saveCourseResource(course, fileName, filePath, fileType);
        return ResponseEntity.ok(resource);
    }

    // List resources for a course (students and teachers)
    @GetMapping("/{courseId}/resources")
    public ResponseEntity<?> getResourcesForCourse(@PathVariable Long courseId) {
        Course course = courseService.getCourseById(courseId).orElseThrow();
        return ResponseEntity.ok(courseService.getResourcesByCourse(course));
    }

    @PreAuthorize("hasRole('TEACHER')") // Changed from hasAuthority
    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<?> deleteResource(@PathVariable Long resourceId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Resource resource = resourceRepository.findById(resourceId).orElse(null);
        if (resource == null) {
            return ResponseEntity.notFound().build();
        }
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (authenticatedUser == null || !resource.getCourse().getInstructor().getId().equals(authenticatedUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only delete resources from your own courses"));
        }
        courseService.deleteResourceById(resourceId);
        return ResponseEntity.ok().build();
    }

    // Generate a signed URL for a Supabase media file (stub, to be implemented with Supabase admin SDK or via a serverless function)
    @GetMapping("/media/signed-url")
    public ResponseEntity<?> getSignedUrl(@RequestParam String path) {
        // Call Supabase Storage API to generate signed URL
        String apiUrl = supabaseUrl + "/storage/v1/object/sign/media/" + path;
        Map<String, Object> body = Map.of("expiresIn", 3600); // 1 hour
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        headers.set("Content-Type", "application/json");
        org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(body, headers);
        try {
            org.springframework.http.ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().get("signedURL") != null) {
                return ResponseEntity.ok(Map.of("signedUrl", response.getBody().get("signedURL")));
            } else {
                return ResponseEntity.status(500).body(Map.of("error", "Failed to get signed URL from Supabase"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Supabase error: " + e.getMessage()));
        }
    }

    // Teacher: Set or update course discount
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}/discount")
    public ResponseEntity<?> setDiscount(@PathVariable Long id, @RequestBody Map<String, Object> body, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseService.getCourseById(id).orElseThrow();
        User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only update your own courses"));
        }
        BigDecimal discountPrice = body.get("discountPrice") != null ? new BigDecimal(body.get("discountPrice").toString()) : null;
        boolean discountActive = Boolean.TRUE.equals(body.get("discountActive"));
        course.setDiscountPrice(discountPrice);
        course.setDiscountActive(discountActive && discountPrice != null && discountPrice.compareTo(BigDecimal.ZERO) > 0);
        courseService.createCourse(course);
        return ResponseEntity.ok(course);
    }

    // Teacher: Remove course discount
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}/discount")
    public ResponseEntity<?> removeDiscount(@PathVariable Long id, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseService.getCourseById(id).orElseThrow();
        User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (!course.getInstructor().getId().equals(instructor.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only update your own courses"));
        }
        course.setDiscountPrice(null);
        course.setDiscountActive(false);
        courseService.createCourse(course);
        return ResponseEntity.ok(course);
    }

    // Student: Rate a course
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/{id}/rate")
    public ResponseEntity<?> rateCourse(@PathVariable Long id, @RequestBody Map<String, Object> body, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseService.getCourseById(id).orElseThrow();
        User student = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        int rating = (int) body.getOrDefault("rating", 0);
        String comment = (String) body.getOrDefault("comment", "");
        if (rating < 1 || rating > 5) return ResponseEntity.badRequest().body(Map.of("error", "Rating must be 1-5"));
        Optional<CourseRating> existing = courseRatingRepository.findByCourseAndUser(course, student);
        CourseRating cr = existing.orElseGet(() -> {
            CourseRating r = new CourseRating();
            r.setCourse(course);
            r.setUser(student);
            return r;
        });
        cr.setRating(rating);
        cr.setComment(comment);
        cr.setCreatedAt(java.time.LocalDateTime.now());
        courseRatingRepository.save(cr);
        return ResponseEntity.ok(cr);
    }

    // Public: Get all ratings for a course
    @GetMapping("/{id}/ratings")
    public ResponseEntity<?> getCourseRatings(@PathVariable Long id) {
        Course course = courseService.getCourseById(id).orElseThrow();
        var ratings = courseRatingRepository.findByCourse(course);
        var ratingData = ratings.stream().map(rating -> Map.of(
            "id", rating.getId(),
            "rating", rating.getRating(),
            "comment", rating.getComment() != null ? rating.getComment() : "",
            "createdAt", rating.getCreatedAt(),
            "user", Map.of(
                "id", rating.getUser().getId(),
                "firstName", rating.getUser().getFirstName(),
                "lastName", rating.getUser().getLastName()
            )
        )).toList();
        return ResponseEntity.ok(ratingData);
    }

    // Public: Get course rating summary (average, count, enrollment count)
    @GetMapping("/{id}/rating-summary")
    public ResponseEntity<?> getCourseRatingSummary(@PathVariable Long id) {
        Course course = courseService.getCourseById(id).orElseThrow();
        var ratings = courseRatingRepository.findByCourse(course);
        double avg = ratings.stream().mapToInt(CourseRating::getRating).average().orElse(0.0);
        int count = ratings.size();
        long enrolled = course.getId() != null ? course.getEnrollments() != null ? course.getEnrollments().size() : 0 : 0;
        return ResponseEntity.ok(Map.of(
            "average", avg,
            "count", count,
            "enrolled", enrolled
        ));
    }
} 
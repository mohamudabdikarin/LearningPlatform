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
import java.util.HashMap;
import com.mycourse.elearningplatform.model.CourseRating;
import com.mycourse.elearningplatform.repository.CourseRatingRepository;
import java.math.BigDecimal;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    // Dependency injection for services and repositories
    @Autowired private CourseService courseService;
    @Autowired private UserRepository userRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private com.mycourse.elearningplatform.service.NhostStorageService nhostStorageService;
    @Autowired private CourseRatingRepository courseRatingRepository;

    // --- GET ALL COURSES ---
    @GetMapping
    public ResponseEntity<?> getAllCourses() {
        var courses = courseService.getAllCourses();

        // Map each course to a simplified structure for the response
        var courseData = courses.stream().map(course -> {
            Map<String, Object> courseMap = new HashMap<>();
            courseMap.put("id", course.getId());
            courseMap.put("title", course.getTitle() != null ? course.getTitle() : "");
            courseMap.put("description", course.getDescription() != null ? course.getDescription() : "");
            courseMap.put("price", course.getPrice() != null ? course.getPrice() : 0);
            courseMap.put("imageFileId", extractFileIdFromNhostUrl(course.getImageUrl()));
            courseMap.put("videoFileId", extractFileIdFromNhostUrl(course.getVideoUrl()));
            courseMap.put("discountPrice", course.getDiscountPrice());
            courseMap.put("discountActive", course.isDiscountActive());
            courseMap.put("duration", course.getDuration() != null ? course.getDuration() : "");

            // Handle instructor safely
            if (course.getInstructor() != null) {
                Map<String, Object> instructorMap = new HashMap<>();
                instructorMap.put("id", course.getInstructor().getId());
                instructorMap.put("firstName", course.getInstructor().getFirstName());
                instructorMap.put("lastName", course.getInstructor().getLastName());
                instructorMap.put("email", course.getInstructor().getEmail());
                courseMap.put("instructor", instructorMap);
            } else {
                courseMap.put("instructor", null);
            }

            return courseMap;
        }).toList();

        return ResponseEntity.ok(courseData);
    }

    // --- GET COURSE BY ID ---
    @GetMapping("/{id}")
    public ResponseEntity<?> getCourse(@PathVariable Long id) {
        return courseService.getCourseById(id)
                .map(course -> {
                    Map<String, Object> courseData = new HashMap<>();
                    courseData.put("id", course.getId());
                    courseData.put("title", course.getTitle());
                    courseData.put("description", course.getDescription());
                    courseData.put("price", course.getPrice());
                    courseData.put("imageFileId", extractFileIdFromNhostUrl(course.getImageUrl()));
                    courseData.put("videoFileId", extractFileIdFromNhostUrl(course.getVideoUrl()));
                    courseData.put("discountPrice", course.getDiscountPrice());
                    courseData.put("discountActive", course.isDiscountActive());
                    courseData.put("duration", course.getDuration());

                    if (course.getInstructor() != null) {
                        Map<String, Object> instructorData = new HashMap<>();
                        instructorData.put("id", course.getInstructor().getId());
                        instructorData.put("firstName", course.getInstructor().getFirstName());
                        instructorData.put("lastName", course.getInstructor().getLastName());
                        instructorData.put("email", course.getInstructor().getEmail());
                        courseData.put("instructor", instructorData);
                    } else {
                        courseData.put("instructor", null);
                    }
                    return ResponseEntity.ok(courseData);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- SEARCH COURSES ---
    @GetMapping("/search")
    public List<Course> searchCourses(@RequestParam String q) {
        return courseService.searchCourses(q);
    }

    // --- GET COURSES BY INSTRUCTOR ---
    @GetMapping("/instructor/{instructorId}")
    public List<Course> getCoursesByInstructor(@PathVariable Long instructorId) {
        return courseService.getCoursesByInstructor(instructorId);
    }

    // --- CREATE COURSE ---
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        course.setInstructor(instructor); // set the logged-in user as instructor
        return ResponseEntity.ok(courseService.createCourse(course));
    }

    // --- UPDATE COURSE ---
    @PreAuthorize("hasRole('TEACHER')")
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

    // --- DELETE COURSE ---
    @PreAuthorize("hasRole('TEACHER')")
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

    // --- Upload resource to course ---
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/{courseId}/resources")
    public ResponseEntity<?> uploadResourceToCourse(@PathVariable Long courseId, @RequestBody Map<String, String> body, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        String filePath = body.get("filePath");
        if (filePath == null || filePath.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Missing filePath"));

        Course course = courseService.getCourseById(courseId).orElseThrow();
        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);

        if (!course.getInstructor().getId().equals(authenticatedUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: Not your course"));
        }

        String fileType = filePath.contains(".") ? filePath.substring(filePath.lastIndexOf('.') + 1) : "unknown";
        String fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

        var resource = courseService.saveCourseResource(course, fileName, filePath, fileType);
        return ResponseEntity.ok(resource);
    }

    // --- List all resources for a course ---
    @GetMapping("/{courseId}/resources")
    public ResponseEntity<?> getResourcesForCourse(@PathVariable Long courseId) {
        Course course = courseService.getCourseById(courseId).orElseThrow();
        return ResponseEntity.ok(courseService.getResourcesByCourse(course));
    }

    // --- Delete a resource ---
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/resources/{resourceId}")
    public ResponseEntity<?> deleteResource(@PathVariable Long resourceId, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Resource resource = resourceRepository.findById(resourceId).orElse(null);
        if (resource == null) return ResponseEntity.notFound().build();

        User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (!resource.getCourse().getInstructor().getId().equals(authenticatedUser.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied: Not your resource"));
        }

        courseService.deleteResourceById(resourceId);
        return ResponseEntity.ok().build();
    }

    // --- Get signed media URL from Nhost ---
    @GetMapping("/media/signed-url")
    public ResponseEntity<?> getSignedUrl(@RequestParam String fileId, @RequestParam(defaultValue = "3600") int expiresIn) {
        try {
            Map<String, String> result = nhostStorageService.getSignedUrl(fileId, expiresIn);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get signed URL: " + e.getMessage()));
        }
    }

    // --- Set discount for course ---
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}/discount")
    public ResponseEntity<?> setDiscount(@PathVariable Long id, @RequestBody Map<String, Object> body, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseService.getCourseById(id).orElseThrow();
        User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (!course.getInstructor().getId().equals(instructor.getId())) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

        BigDecimal discountPrice = body.get("discountPrice") != null ? new BigDecimal(body.get("discountPrice").toString()) : null;
        boolean discountActive = Boolean.TRUE.equals(body.get("discountActive"));

        course.setDiscountPrice(discountPrice);
        course.setDiscountActive(discountActive && discountPrice != null && discountPrice.compareTo(BigDecimal.ZERO) > 0);

        courseService.createCourse(course);
        return ResponseEntity.ok(course);
    }

    // --- Remove discount ---
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}/discount")
    public ResponseEntity<?> removeDiscount(@PathVariable Long id, @AuthenticationPrincipal com.mycourse.elearningplatform.security.UserDetailsImpl principal) {
        Course course = courseService.getCourseById(id).orElseThrow();
        User instructor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (!course.getInstructor().getId().equals(instructor.getId())) return ResponseEntity.status(403).body(Map.of("error", "Access denied"));

        course.setDiscountPrice(null);
        course.setDiscountActive(false);
        courseService.createCourse(course);
        return ResponseEntity.ok(course);
    }

    // --- Rate course ---
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

    // --- Get course ratings ---
    @GetMapping("/{id}/ratings")
    public ResponseEntity<?> getCourseRatings(@PathVariable Long id) {
        Course course = courseService.getCourseById(id).orElseThrow();
        var ratings = courseRatingRepository.findByCourse(course);

        var ratingData = ratings.stream().map(rating -> Map.of(
                "id", rating.getId(),
                "rating", rating.getRating(),
                "comment", rating.getComment(),
                "createdAt", rating.getCreatedAt(),
                "user", Map.of(
                        "id", rating.getUser().getId(),
                        "firstName", rating.getUser().getFirstName(),
                        "lastName", rating.getUser().getLastName()
                )
        )).toList();

        return ResponseEntity.ok(ratingData);
    }

    // --- Rating summary ---
    @GetMapping("/{id}/rating-summary")
    public ResponseEntity<?> getCourseRatingSummary(@PathVariable Long id) {
        Course course = courseService.getCourseById(id).orElseThrow();
        var ratings = courseRatingRepository.findByCourse(course);
        double avg = ratings.stream().mapToInt(CourseRating::getRating).average().orElse(0.0);
        int count = ratings.size();
        long enrolled = course.getEnrollments() != null ? course.getEnrollments().size() : 0;
        return ResponseEntity.ok(Map.of("average", avg, "count", count, "enrolled", enrolled));
    }

    // --- Helper: Get working image URL ---
    private String getWorkingImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) return "";
        if (imageUrl.startsWith("/uploads/")) return "http://localhost:8080" + imageUrl;
        if (imageUrl.contains(".nhost.run") && imageUrl.contains("/v1/files/")) {
            String[] parts = imageUrl.split("/v1/files/");
            if (parts.length > 1) {
                String fileId = parts[1].split("\\?")[0];
                return "http://localhost:8080/api/proxy/image/" + fileId;
            }
        }
        return imageUrl;
    }

    // --- Helper: Extract fileId from Nhost file URL ---
    private String extractFileIdFromNhostUrl(String url) {
        if (url == null || url.isEmpty()) return null;
        int idx = url.indexOf("/v1/files/");
        if (idx == -1) return null;
        return url.substring(idx + 10).split("[/?]")[0];
    }
}

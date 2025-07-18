package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.Resource;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.CourseRepository;
import com.mycourse.elearningplatform.repository.ResourceRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import com.mycourse.elearningplatform.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {
    
    @Autowired
    private ResourceRepository resourceRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CourseService courseService;

    // Get all resources for a specific course (accessible by enrolled students and course instructor)
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getResourcesByCourse(@PathVariable Long courseId) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Course course = courseOpt.get();
        List<Resource> resources = resourceRepository.findByCourse(course);
        return ResponseEntity.ok(resources);
    }

    // Get a specific resource by ID
    @GetMapping("/{resourceId}")
    public ResponseEntity<?> getResource(@PathVariable Long resourceId) {
        Optional<Resource> resourceOpt = resourceRepository.findById(resourceId);
        if (resourceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(resourceOpt.get());
    }

    // Create a new resource for a course (teachers only)
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/course/{courseId}")
    public ResponseEntity<?> createResource(
            @PathVariable Long courseId,
            @RequestBody Map<String, Object> resourceData,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        
        try {
            Optional<Course> courseOpt = courseRepository.findById(courseId);
            if (courseOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Course course = courseOpt.get();
            User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
            
            // Check if the authenticated user is the instructor of this course
            if (authenticatedUser == null || !course.getInstructor().getId().equals(authenticatedUser.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only add resources to your own courses"));
            }
            
            String fileName = (String) resourceData.get("fileName");
            String fileUrl = (String) resourceData.get("fileUrl");
            String fileType = (String) resourceData.get("fileType");
            
            if (fileName == null || fileUrl == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "fileName and fileUrl are required"));
            }
            
            Resource resource = new Resource();
            resource.setCourse(course);
            resource.setFileName(fileName);
            resource.setFileUrl(fileUrl);
            resource.setFileType(fileType != null ? fileType : "unknown");
            resource.setFileSize(0L); // Default file size
            
            Resource savedResource = resourceRepository.save(resource);
            return ResponseEntity.ok(savedResource);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create resource: " + e.getMessage()));
        }
    }

    // Update a resource (teachers only, own courses)
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{resourceId}")
    public ResponseEntity<?> updateResource(
            @PathVariable Long resourceId,
            @RequestBody Map<String, Object> resourceData,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        
        try {
            Optional<Resource> resourceOpt = resourceRepository.findById(resourceId);
            if (resourceOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = resourceOpt.get();
            User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
            
            // Check if the authenticated user is the instructor of this course
            if (authenticatedUser == null || !resource.getCourse().getInstructor().getId().equals(authenticatedUser.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only update resources from your own courses"));
            }
            
            // Update fields if provided
            if (resourceData.containsKey("fileName")) {
                resource.setFileName((String) resourceData.get("fileName"));
            }
            if (resourceData.containsKey("fileUrl")) {
                resource.setFileUrl((String) resourceData.get("fileUrl"));
            }
            if (resourceData.containsKey("fileType")) {
                resource.setFileType((String) resourceData.get("fileType"));
            }
            
            Resource updatedResource = resourceRepository.save(resource);
            return ResponseEntity.ok(updatedResource);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update resource: " + e.getMessage()));
        }
    }

    // Delete a resource (teachers only, own courses)
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{resourceId}")
    public ResponseEntity<?> deleteResource(
            @PathVariable Long resourceId,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        
        try {
            Optional<Resource> resourceOpt = resourceRepository.findById(resourceId);
            if (resourceOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = resourceOpt.get();
            User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
            
            // Check if the authenticated user is the instructor of this course
            if (authenticatedUser == null || !resource.getCourse().getInstructor().getId().equals(authenticatedUser.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied: You can only delete resources from your own courses"));
            }
            
            resourceRepository.deleteById(resourceId);
            return ResponseEntity.ok(Map.of("message", "Resource deleted successfully"));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete resource: " + e.getMessage()));
        }
    }

    // Get all resources by instructor (for teacher dashboard)
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/instructor/my-resources")
    public ResponseEntity<?> getMyResources(@AuthenticationPrincipal org.springframework.security.core.userdetails.User principal) {
        try {
            User authenticatedUser = userRepository.findByEmail(principal.getUsername()).orElse(null);
            if (authenticatedUser == null) {
                return ResponseEntity.status(403).body(Map.of("error", "User not found"));
            }
            
            List<Course> myCourses = courseRepository.findByInstructor(authenticatedUser);
            List<Resource> allMyResources = myCourses.stream()
                    .flatMap(course -> resourceRepository.findByCourse(course).stream())
                    .toList();
            
            return ResponseEntity.ok(allMyResources);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch resources: " + e.getMessage()));
        }
    }
}
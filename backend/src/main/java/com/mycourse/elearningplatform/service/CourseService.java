package com.mycourse.elearningplatform.service;

import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.Resource;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.CourseRepository;
import com.mycourse.elearningplatform.repository.ResourceRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CourseService {
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ResourceRepository resourceRepository;
    @Autowired
    private NhostStorageService nhostStorageService;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public List<Course> getCoursesByInstructor(Long instructorId) {
        Optional<User> instructor = userRepository.findById(instructorId);
        return instructor.map(courseRepository::findByInstructor).orElse(List.of());
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, Course updated, User instructor) {
        return courseRepository.findById(id).map(course -> {
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                throw new RuntimeException("Forbidden: You are not the instructor of this course");
            }
            
            // Handle image URL update - delete old image if it's being replaced
            if (updated.getImageUrl() != null && !updated.getImageUrl().equals(course.getImageUrl())) {
                // Delete old image if it exists and is different from new one
                if (course.getImageUrl() != null && !course.getImageUrl().isEmpty()) {
                    String oldFileId = extractFileIdFromNhostUrl(course.getImageUrl());
                    if (oldFileId != null) {
                        try {
                            nhostStorageService.deleteFile(oldFileId);
                            System.out.println("Deleted old course image from Nhost: " + oldFileId);
                        } catch (Exception e) {
                            System.err.println("Failed to delete old course image from Nhost: " + e.getMessage());
                        }
                    }
                }
                course.setImageUrl(updated.getImageUrl());
            }
            
            // Handle video URL update - delete old video if it's being replaced
            if (updated.getVideoUrl() != null && !updated.getVideoUrl().equals(course.getVideoUrl())) {
                // Delete old video if it exists and is different from new one
                if (course.getVideoUrl() != null && !course.getVideoUrl().isEmpty()) {
                    String oldFileId = extractFileIdFromNhostUrl(course.getVideoUrl());
                    if (oldFileId != null) {
                        try {
                            nhostStorageService.deleteFile(oldFileId);
                            System.out.println("Deleted old course video from Nhost: " + oldFileId);
                        } catch (Exception e) {
                            System.err.println("Failed to delete old course video from Nhost: " + e.getMessage());
                        }
                    }
                }
                course.setVideoUrl(updated.getVideoUrl());
            }
            
            // Update other fields
            course.setTitle(updated.getTitle());
            course.setDescription(updated.getDescription());
            course.setPrice(updated.getPrice());
            
            return courseRepository.save(course);
        }).orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public void deleteCourse(Long id, User instructor) {
        courseRepository.findById(id).ifPresentOrElse(course -> {
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                throw new RuntimeException("Forbidden: You are not the instructor of this course");
            }
            
            // Collect file IDs to delete
            List<String> fileIdsToDelete = new ArrayList<>();
            
            // Add course image file ID
            if (course.getImageUrl() != null && !course.getImageUrl().isEmpty()) {
                String fileId = extractFileIdFromNhostUrl(course.getImageUrl());
                if (fileId != null) {
                    fileIdsToDelete.add(fileId);
                }
            }
            
            // Add course video file ID
            if (course.getVideoUrl() != null && !course.getVideoUrl().isEmpty()) {
                String fileId = extractFileIdFromNhostUrl(course.getVideoUrl());
                if (fileId != null) {
                    fileIdsToDelete.add(fileId);
                }
            }
            
            // Add course resource file IDs
            List<Resource> resources = resourceRepository.findByCourse(course);
            for (Resource resource : resources) {
                if (resource.getFileUrl() != null && !resource.getFileUrl().isEmpty()) {
                    String fileId = extractFileIdFromNhostUrl(resource.getFileUrl());
                    if (fileId != null) {
                        fileIdsToDelete.add(fileId);
                    }
                }
            }
            
            // Delete the course from database first (fast operation)
            courseRepository.deleteById(id);
            
            // Delete files from Nhost storage asynchronously (don't block the response)
            if (!fileIdsToDelete.isEmpty()) {
                deleteFilesAsync(fileIdsToDelete);
            }
            
        }, () -> {
            throw new RuntimeException("Course not found");
        });
    }
    
    private void deleteFilesAsync(List<String> fileIds) {
        // Run file deletions in a separate thread to avoid blocking the response
        new Thread(() -> {
            for (String fileId : fileIds) {
                try {
                    nhostStorageService.deleteFile(fileId);
                    System.out.println("Deleted file from Nhost: " + fileId);
                } catch (Exception e) {
                    System.err.println("Failed to delete file from Nhost: " + fileId + " - " + e.getMessage());
                    // Continue with other files even if one fails
                }
            }
        }).start();
    }

    public List<Course> searchCourses(String keyword) {
        return courseRepository.findAll().stream()
                .filter(c -> c.getTitle().toLowerCase().contains(keyword.toLowerCase()) ||
                        c.getDescription().toLowerCase().contains(keyword.toLowerCase()))
                .toList();
    }

    public Resource saveCourseResource(Course course, String fileName, String fileUrl, String fileType) {
        Resource resource = new Resource();
        resource.setCourse(course);
        resource.setFileName(fileName);
        resource.setFileUrl(fileUrl);
        resource.setFileType(fileType);
        // Set default file size if not provided
        resource.setFileSize(0L);
        return resourceRepository.save(resource);
    }

    public List<Resource> getResourcesByCourse(Course course) {
        return resourceRepository.findByCourse(course);
    }

    public void deleteResourceById(Long resourceId) {
        resourceRepository.findById(resourceId).ifPresent(resource -> {
            // Delete the resource from database first (fast operation)
            resourceRepository.deleteById(resourceId);
            
            // Delete file from Nhost storage asynchronously
            if (resource.getFileUrl() != null && !resource.getFileUrl().isEmpty()) {
                String fileId = extractFileIdFromNhostUrl(resource.getFileUrl());
                if (fileId != null) {
                    deleteFilesAsync(List.of(fileId));
                }
            }
        });
    }

    /**
     * Extract file ID from Nhost storage URL
     * Example: https://rzkysfcwirbfuctnzvzf.storage.ap-south-1.nhost.run/v1/files/abc123 -> abc123
     */
    private String extractFileIdFromNhostUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        
        try {
            // Check if it's an Nhost storage URL
            if (url.contains(".storage.") && url.contains(".nhost.run/v1/files/")) {
                String[] parts = url.split("/v1/files/");
                if (parts.length > 1) {
                    // Get the file ID (everything after /v1/files/)
                    String fileId = parts[1];
                    // Remove any query parameters
                    if (fileId.contains("?")) {
                        fileId = fileId.split("\\?")[0];
                    }
                    return fileId;
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting file ID from URL: " + url + " - " + e.getMessage());
        }
        
        return null;
    }
} 
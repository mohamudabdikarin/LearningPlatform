package com.mycourse.elearningplatform.service;

import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.Resource;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.CourseRepository;
import com.mycourse.elearningplatform.repository.ResourceRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.util.List;
import java.util.Optional;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;

@Service
public class CourseService {
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ResourceRepository resourceRepository;

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
            course.setTitle(updated.getTitle());
            course.setDescription(updated.getDescription());
            course.setPrice(updated.getPrice());
            course.setImageUrl(updated.getImageUrl());
            course.setVideoUrl(updated.getVideoUrl());
            return courseRepository.save(course);
        }).orElseThrow(() -> new RuntimeException("Course not found"));
    }

    public void deleteCourse(Long id, User instructor) {
        courseRepository.findById(id).ifPresentOrElse(course -> {
            if (!course.getInstructor().getId().equals(instructor.getId())) {
                throw new RuntimeException("Forbidden: You are not the instructor of this course");
            }
            courseRepository.deleteById(id);
        }, () -> {
            throw new RuntimeException("Course not found");
        });
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
            if (resource.getFileUrl() != null && resource.getFileUrl().startsWith("/uploads/")) {
                String filename = resource.getFileUrl().substring("/uploads/".length());
                Path filePath = Paths.get("uploads").resolve(filename);
                try { Files.deleteIfExists(filePath); } catch (Exception e) { }
            }
            resourceRepository.deleteById(resourceId);
        });
    }
} 
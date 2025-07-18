package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.dto.LessonDto;
import com.mycourse.elearningplatform.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/courses/{courseId}/lessons")
public class LessonController {
    @Autowired
    private LessonService lessonService;

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<LessonDto> addLesson(@PathVariable Long courseId, @RequestBody LessonDto lessonDto) {
        LessonDto created = lessonService.addLesson(courseId, lessonDto);
        return ResponseEntity.ok(created);
    }

    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER')")
    @GetMapping
    public ResponseEntity<List<LessonDto>> getLessons(@PathVariable Long courseId) {
        List<LessonDto> lessons = lessonService.getLessonsByCourse(courseId);
        return ResponseEntity.ok(lessons);
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{lessonId}")
    public ResponseEntity<?> deleteLesson(@PathVariable Long courseId, @PathVariable Long lessonId) {
        // Find lesson (assume lessonService has a method to get by id)
        var lessonOpt = lessonService.getLessonById(lessonId);
        if (lessonOpt.isEmpty()) return ResponseEntity.notFound().build();
        var lesson = lessonOpt.get();
        // Delete associated file if present
        if (lesson.getContentUrl() != null && lesson.getContentUrl().startsWith("/uploads/")) {
            String filename = lesson.getContentUrl().substring("/uploads/".length());
            Path filePath = Paths.get("uploads").resolve(filename);
            try { Files.deleteIfExists(filePath); } catch (Exception e) { }
        }
        lessonService.deleteLessonById(lessonId);
        return ResponseEntity.ok().build();
    }
} 
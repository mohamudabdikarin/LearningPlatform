package com.mycourse.elearningplatform.service;

import com.mycourse.elearningplatform.dto.LessonDto;
import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.Lesson;
import com.mycourse.elearningplatform.repository.CourseRepository;
import com.mycourse.elearningplatform.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LessonService {
    @Autowired
    private LessonRepository lessonRepository;
    @Autowired
    private CourseRepository courseRepository;

    public LessonDto addLesson(Long courseId, LessonDto lessonDto) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) throw new RuntimeException("Course not found");
        Course course = courseOpt.get();
        Lesson lesson = new Lesson();
        lesson.setTitle(lessonDto.getTitle());
        lesson.setDescription(lessonDto.getDescription());
        lesson.setContentUrl(lessonDto.getContentUrl());
        lesson.setCourse(course);
        lessonRepository.save(lesson);
        return toDto(lesson);
    }

    public List<LessonDto> getLessonsByCourse(Long courseId) {
        Optional<Course> courseOpt = courseRepository.findById(courseId);
        if (courseOpt.isEmpty()) throw new RuntimeException("Course not found");
        Course course = courseOpt.get();
        List<Lesson> lessons = lessonRepository.findByCourse(course);
        return lessons.stream().map(this::toDto).collect(Collectors.toList());
    }

    public Optional<Lesson> getLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId);
    }
    public void deleteLessonById(Long lessonId) {
        lessonRepository.deleteById(lessonId);
    }

    private LessonDto toDto(Lesson lesson) {
        return new LessonDto(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getContentUrl(),
                lesson.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
    }
} 
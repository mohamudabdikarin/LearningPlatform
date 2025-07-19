package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.model.Quiz;
import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.repository.QuizRepository;
import com.mycourse.elearningplatform.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {
    @Autowired
    private QuizRepository quizRepository;
    @Autowired
    private CourseRepository courseRepository;

    // Public: List all quizzes
    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    // Public: Get quiz by ID
    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuiz(@PathVariable Long id) {
        return quizRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Teacher: Create quiz and assign to course
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@RequestBody Quiz quiz, @RequestParam Long courseId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        quiz.setCourse(course);
        return ResponseEntity.ok(quizRepository.save(quiz));
    }

    // Teacher: Update quiz
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Long id, @RequestBody Quiz updated) {
        return quizRepository.findById(id).map(quiz -> {
            quiz.setTitle(updated.getTitle());
            quiz.setDescription(updated.getDescription());
            quiz.setTotalPoints(updated.getTotalPoints());
            return ResponseEntity.ok(quizRepository.save(quiz));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Teacher: Delete quiz
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long id) {
        quizRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // Public: List quizzes by course
    @GetMapping("/course/{courseId}")
    public List<Quiz> getQuizzesByCourse(@PathVariable Long courseId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        return quizRepository.findByCourse(course);
    }
} 
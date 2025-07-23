package com.mycourse.elearningplatform.dto;

import com.mycourse.elearningplatform.model.Course;
import com.mycourse.elearningplatform.model.Enrollment;
import com.mycourse.elearningplatform.model.User;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for Enrollment to avoid circular references in JSON serialization
 */
public class EnrollmentDTO {
    private Long id;
    private UserDTO user;
    private CourseDTO course;
    private LocalDateTime enrolledAt;
    private Integer progress;
    private LocalDateTime lastActivityDate;
    private Integer averageQuizScore;
    private boolean paid;

    public EnrollmentDTO() {
    }

    public EnrollmentDTO(Enrollment enrollment) {
        this.id = enrollment.getId();
        this.user = new UserDTO(enrollment.getUser());
        this.course = new CourseDTO(enrollment.getCourse());
        this.enrolledAt = enrollment.getEnrolledAt();
        this.progress = enrollment.getProgress();
        this.lastActivityDate = enrollment.getLastActivityDate();
        this.averageQuizScore = enrollment.getAverageQuizScore();
        this.paid = enrollment.isPaid();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
    }

    public CourseDTO getCourse() {
        return course;
    }

    public void setCourse(CourseDTO course) {
        this.course = course;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public Integer getProgress() {
        return progress;
    }

    public void setProgress(Integer progress) {
        this.progress = progress;
    }

    public LocalDateTime getLastActivityDate() {
        return lastActivityDate;
    }

    public void setLastActivityDate(LocalDateTime lastActivityDate) {
        this.lastActivityDate = lastActivityDate;
    }

    public Integer getAverageQuizScore() {
        return averageQuizScore;
    }

    public void setAverageQuizScore(Integer averageQuizScore) {
        this.averageQuizScore = averageQuizScore;
    }

    public boolean isPaid() {
        return paid;
    }

    public void setPaid(boolean paid) {
        this.paid = paid;
    }

    /**
     * Simplified User DTO to avoid circular references
     */
    public static class UserDTO {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;

        public UserDTO() {
        }

        public UserDTO(User user) {
            this.id = user.getId();
            this.firstName = user.getFirstName();
            this.lastName = user.getLastName();
            this.email = user.getEmail();
        }

        // Getters and setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getFirstName() {
            return firstName;
        }

        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }

        public String getLastName() {
            return lastName;
        }

        public void setLastName(String lastName) {
            this.lastName = lastName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    /**
     * Simplified Course DTO to avoid circular references
     */
    public static class CourseDTO {
        private Long id;
        private String title;
        private String description;
        private String imageUrl;
        private String videoUrl;
        private Integer duration;
        private String level;
        private UserDTO instructor;

        public CourseDTO() {
        }

        public CourseDTO(Course course) {
            this.id = course.getId();
            this.title = course.getTitle();
            this.description = course.getDescription();
            this.imageUrl = course.getImageUrl();
            this.videoUrl = course.getVideoUrl();
            this.duration = course.getDuration();
            this.level = course.getLevel();
            if (course.getInstructor() != null) {
                this.instructor = new UserDTO(course.getInstructor());
            }
        }

        // Getters and setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }

        public String getVideoUrl() {
            return videoUrl;
        }

        public void setVideoUrl(String videoUrl) {
            this.videoUrl = videoUrl;
        }

        public Integer getDuration() {
            return duration;
        }

        public void setDuration(Integer duration) {
            this.duration = duration;
        }

        public String getLevel() {
            return level;
        }

        public void setLevel(String level) {
            this.level = level;
        }

        public UserDTO getInstructor() {
            return instructor;
        }

        public void setInstructor(UserDTO instructor) {
            this.instructor = instructor;
        }
    }
}
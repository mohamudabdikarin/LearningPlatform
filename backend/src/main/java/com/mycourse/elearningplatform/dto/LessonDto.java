package com.mycourse.elearningplatform.dto;

public class LessonDto {
    private Long id;
    private String title;
    private String description;
    private String contentUrl;
    private String createdAt;
    private String fileId;

    public LessonDto() {}

    public LessonDto(Long id, String title, String description, String contentUrl, String createdAt, String fileId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.contentUrl = contentUrl;
        this.createdAt = createdAt;
        this.fileId = fileId;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getContentUrl() { return contentUrl; }
    public void setContentUrl(String contentUrl) { this.contentUrl = contentUrl; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getFileId() { return fileId; }
    public void setFileId(String fileId) { this.fileId = fileId; }
} 
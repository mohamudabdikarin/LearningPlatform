package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.service.NhostStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    // Injecting NhostStorageService for file operations
    @Autowired
    private NhostStorageService nhostStorageService;

    // Upload endpoint - Only accessible by users with 'TEACHER' role
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "existingFileId", required = false) String existingFileId) {

        System.out.println("[DEBUG] UploadController - Uploading file: " + file.getOriginalFilename());
        if (existingFileId != null && !existingFileId.isEmpty()) {
            System.out.println("[DEBUG] Replacing existing file: " + existingFileId);
        }

        try {
            // Validate file is not empty
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
            }

            // Clean and extract file extension
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // Generate a new unique filename
            String filename = UUID.randomUUID().toString() + fileExtension;

            // Upload to Nhost (default bucket). Pass existingFileId for replacement.
            Map<String, Object> uploadResult = nhostStorageService.uploadFile(file, "default", filename, existingFileId);

            System.out.println("Upload result: " + uploadResult);

            // Check if upload was successful and ID is returned
            if (uploadResult != null && uploadResult.containsKey("id")) {
                String fileId = (String) uploadResult.get("id");
                String fileUrl = (String) uploadResult.get("url");
                if (fileUrl == null) {
                    fileUrl = nhostStorageService.getFileUrl(fileId);
                }

                System.out.println("File uploaded successfully - ID: " + fileId + ", URL: " + fileUrl);

                return ResponseEntity.ok(Map.of(
                        "url", fileUrl,
                        "fileId", fileId,
                        "filename", filename,
                        "storage", uploadResult.containsKey("storage") ? uploadResult.get("storage") : "nhost"
                ));
            } else {
                System.err.println("Upload failed - response: " + uploadResult);
                throw new RuntimeException("Upload failed - no file ID returned");
            }

        } catch (Exception e) {
            // Catch any upload error
            e.printStackTrace();
            System.out.println("[ERROR] Exception during upload: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    // Delete endpoint - Only accessible by TEACHER role
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> deleteFile(@PathVariable String fileId) {
        try {
            // Call service to delete file
            boolean deleted = nhostStorageService.deleteFile(fileId);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to delete file"));
            }

        } catch (Exception e) {
            // Handle any deletion error
            System.out.println("[ERROR] Failed to delete from Nhost: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }

    // Get signed URL for private file download (optional expiry param)
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/signed-url/{fileId}")
    public ResponseEntity<?> getSignedUrl(@PathVariable String fileId, @RequestParam(defaultValue = "3600") int expiresIn) {
        try {
            // Ask service to generate a temporary access URL
            Map<String, String> result = nhostStorageService.getSignedUrl(fileId, expiresIn);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.out.println("[ERROR] Failed to get signed URL from Nhost: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get signed URL: " + e.getMessage()));
        }
    }
}

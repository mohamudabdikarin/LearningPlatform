package com.mycourse.elearningplatform.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {
    
    @Value("${supabase.url}")
    private String supabaseUrl;
    
    @Value("${supabase.service.key}")
    private String supabaseServiceKey;
    
    private final RestTemplate restTemplate = new RestTemplate();

    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        System.out.println("[DEBUG] UploadController - Uploading file: " + file.getOriginalFilename());
        System.out.println("[DEBUG] Supabase URL: " + supabaseUrl);
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
            }

            // Generate unique filename
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + fileExtension;
            
            return uploadToSupabase(file, filename);
            
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("[ERROR] Exception during upload: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
    
    private ResponseEntity<?> uploadToSupabase(MultipartFile file, String filename) throws Exception {
        String bucket = "media";
        String storageUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + filename;
        
        System.out.println("[DEBUG] Uploading to: " + storageUrl);
        
        HttpHeaders headers = new HttpHeaders();
        // Set the correct content type
        String contentType = file.getContentType();
        if (contentType != null) {
            headers.setContentType(MediaType.parseMediaType(contentType));
        } else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        
        HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
        
        ResponseEntity<String> response = restTemplate.exchange(
            storageUrl,
            org.springframework.http.HttpMethod.POST,
            entity,
            String.class
        );
        
        System.out.println("[DEBUG] Supabase upload response: " + response.getStatusCode() + " - " + response.getBody());
        
        if (response.getStatusCode().is2xxSuccessful()) {
            String fileUrl = supabaseUrl + "/storage/v1/object/public/media/" + filename;
            System.out.println("[DEBUG] Returning Supabase fileUrl: " + fileUrl);
            return ResponseEntity.ok(Map.of("url", fileUrl));
        } else {
            throw new RuntimeException("Supabase upload failed: " + response.getBody());
        }
    }

    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/{filename}")
    public ResponseEntity<?> deleteFile(@PathVariable String filename) {
        try {
            deleteFromSupabase(filename);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
            
        } catch (Exception e) {
            System.out.println("[ERROR] Failed to delete from Supabase: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }
    
    private void deleteFromSupabase(String filename) throws Exception {
        String storageUrl = supabaseUrl + "/storage/v1/object/media/" + filename;
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseServiceKey);
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        
        HttpEntity<String> entity = new HttpEntity<>(headers);
        restTemplate.exchange(storageUrl, org.springframework.http.HttpMethod.DELETE, entity, String.class);
    }
} 
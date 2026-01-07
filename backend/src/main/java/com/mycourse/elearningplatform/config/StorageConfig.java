package com.mycourse.elearningplatform.config;

import com.mycourse.elearningplatform.service.NhostStorageService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Storage configuration for demo mode
 * Provides a mock storage service when demo mode is enabled
 */
@Configuration
public class StorageConfig {

    /**
     * Mock storage service for demo mode
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "demo.mode", havingValue = "true", matchIfMissing = true)
    public MockStorageService mockStorageService() {
        return new MockStorageService();
    }

    /**
     * Mock storage service implementation
     */
    public static class MockStorageService extends NhostStorageService {

        public MockStorageService() {
            super(new RestTemplate());
        }

        @Override
        public Map<String, Object> uploadFile(MultipartFile file, String bucketId, String fileName, String existingFileId) {
            System.out.println("📁 DEMO MODE: Mock file upload - " + fileName + " (" + file.getSize() + " bytes)");
            
            String fileId = UUID.randomUUID().toString();
            String mockUrl = "https://picsum.photos/400/300?random=" + Math.abs(fileId.hashCode() % 1000);
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", fileId);
            result.put("name", fileName);
            result.put("size", file.getSize());
            result.put("mimeType", file.getContentType());
            result.put("url", mockUrl);
            result.put("bucketId", bucketId != null ? bucketId : "default");
            
            System.out.println("📁 Mock upload result: " + result);
            return result;
        }

        @Override
        public Map<String, Object> uploadFile(MultipartFile file, String bucketId, String fileName) {
            return uploadFile(file, bucketId, fileName, null);
        }

        @Override
        public String getFileUrl(String fileId) {
            String mockUrl = "https://picsum.photos/400/300?random=" + Math.abs(fileId.hashCode() % 1000);
            System.out.println("📁 DEMO MODE: Mock file URL for " + fileId + " -> " + mockUrl);
            return mockUrl;
        }

        @Override
        public Map<String, String> getSignedUrl(String fileId, int expiresInSeconds) {
            String mockUrl = getFileUrl(fileId);
            Map<String, String> result = new HashMap<>();
            result.put("signedUrl", mockUrl);
            result.put("url", mockUrl);
            
            System.out.println("📁 DEMO MODE: Mock signed URL for " + fileId + " -> " + mockUrl);
            return result;
        }

        @Override
        public boolean deleteFile(String fileId) {
            System.out.println("📁 DEMO MODE: Mock file deletion - " + fileId);
            return true; // Always return success in demo mode
        }
    }
}
package com.mycourse.elearningplatform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;

import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@Service
public class NhostStorageService {

    @Value("${nhost.subdomain}")
    private String nhostSubdomain;

    @Value("${nhost.region}")
    private String nhostRegion;

    @Value("${nhost.admin.secret}")
    private String nhostAdminSecret;

    private final RestTemplate restTemplate;

    public NhostStorageService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Upload a file to Nhost storage
     * @param file The file to upload
     * @param bucketId The bucket ID (optional)
     * @param fileName The file name
     * @param existingFileId Optional existing file ID to replace/update
     * @return Map containing file metadata including URL
     */
    public Map<String, Object> uploadFile(MultipartFile file, String bucketId, String fileName, String existingFileId) {
        System.out.println("=== NHOST UPLOAD DEBUG ===");
        System.out.println("Subdomain: " + nhostSubdomain);
        System.out.println("Region: " + nhostRegion);
        System.out.println("Admin secret length: " + nhostAdminSecret.length());
        System.out.println("File: " + fileName + " (" + file.getSize() + " bytes)");
        
        // If there's an existing file ID, delete it first to prevent duplication
        if (existingFileId != null && !existingFileId.isEmpty()) {
            try {
                System.out.println("Deleting existing file before update: " + existingFileId);
                deleteFile(existingFileId);
            } catch (Exception e) {
                System.err.println("Failed to delete existing file: " + e.getMessage());
                // Continue with upload even if delete fails
            }
        }
        
        // Upload to Nhost - no local fallback
        try {
            Map<String, Object> result = uploadViaCorrectAPI(file, bucketId, fileName);
            
            // Add URL to the result if not present
            if (!result.containsKey("url")) {
                String fileId = (String) result.get("id");
                if (fileId != null) {
                    String fileUrl = String.format("https://%s.storage.%s.nhost.run/v1/files/%s", 
                        nhostSubdomain, nhostRegion, fileId);
                    result.put("url", fileUrl);
                }
            }
            
            return result;
        } catch (Exception e) {
            System.err.println("Nhost upload failed: " + e.getMessage());
            throw new RuntimeException("Failed to upload file to Nhost: " + e.getMessage(), e);
        }
    }
    
    /**
     * Upload a file to Nhost storage (overloaded method for backward compatibility)
     */
    public Map<String, Object> uploadFile(MultipartFile file, String bucketId, String fileName) {
        return uploadFile(file, bucketId, fileName, null);
    }
    
    private Map<String, Object> uploadViaCorrectAPI(MultipartFile file, String bucketId, String fileName) throws Exception {
        // Try both authentication methods since Nhost API might have changed
        try {
            return uploadWithBearerAuth(file, bucketId, fileName);
        } catch (Exception e) {
            System.err.println("Bearer token auth failed: " + e.getMessage());
            System.out.println("Trying with x-hasura-admin-secret instead...");
            return uploadWithHasuraAdminSecret(file, bucketId, fileName);
        }
    }
    
    private Map<String, Object> uploadWithBearerAuth(MultipartFile file, String bucketId, String fileName) throws Exception {
        String endpoint = String.format("https://%s.storage.%s.nhost.run/v1/files", nhostSubdomain, nhostRegion);
        
        System.out.println("Uploading to Nhost Storage API with Bearer auth: " + endpoint);
        
        // Don't set content type - let RestTemplate handle it with the boundary
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + nhostAdminSecret);
        
        // Create multipart request
        org.springframework.util.LinkedMultiValueMap<String, Object> body = 
            new org.springframework.util.LinkedMultiValueMap<>();
        
        // Create a HttpEntity for the file part with its own headers
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        
        // Create ByteArrayResource with proper filename
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
        
        // Create a HttpEntity for the file with its headers
        HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(fileResource, fileHeaders);
        
        // Add file to multipart request
        body.add("file", filePart);
        
        // Add bucket ID if specified
        if (bucketId != null && !bucketId.isEmpty() && !bucketId.equals("default")) {
            body.add("bucketId", bucketId);
        }
        
        // Make file public by default
        body.add("isPublic", "true");
        
        // Create the final request entity
        HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> requestEntity = 
            new HttpEntity<>(body, headers);
        
        // Send request to Nhost
        ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, requestEntity, Map.class);
        
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            System.out.println("Nhost upload successful with Bearer auth: " + response.getBody());
            return response.getBody();
        } else {
            throw new RuntimeException("Failed to upload file to Nhost with Bearer auth: " + response.getStatusCode());
        }
    }
    
    private Map<String, Object> uploadWithHasuraAdminSecret(MultipartFile file, String bucketId, String fileName) throws Exception {
        String endpoint = String.format("https://%s.storage.%s.nhost.run/v1/files", nhostSubdomain, nhostRegion);
        
        System.out.println("Uploading to Nhost Storage API with x-hasura-admin-secret: " + endpoint);
        
        // Don't set content type - let RestTemplate handle it with the boundary
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-hasura-admin-secret", nhostAdminSecret);
        
        // Create multipart request
        org.springframework.util.LinkedMultiValueMap<String, Object> body = 
            new org.springframework.util.LinkedMultiValueMap<>();
        
        // Create a HttpEntity for the file part with its own headers
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        
        // Create ByteArrayResource with proper filename
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
        
        // Create a HttpEntity for the file with its headers
        HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(fileResource, fileHeaders);
        
        // Add file to multipart request
        body.add("file", filePart);
        
        // Add bucket ID if specified
        if (bucketId != null && !bucketId.isEmpty() && !bucketId.equals("default")) {
            body.add("bucketId", bucketId);
        }
        
        // Make file public by default
        body.add("isPublic", "true");
        
        // Create the final request entity
        HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> requestEntity = 
            new HttpEntity<>(body, headers);
        
        // Try with different admin secret formats
        try {
            // Try with the original admin secret
            ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, requestEntity, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                System.out.println("Nhost upload successful with x-hasura-admin-secret: " + response.getBody());
                return response.getBody();
            } else {
                throw new RuntimeException("Failed with original admin secret");
            }
        } catch (Exception e) {
            // Try with a JWT token format if the admin secret might be a JWT
            if (nhostAdminSecret.contains(".")) {
                System.out.println("Admin secret appears to be a JWT, trying without Bearer prefix");
                headers.set("Authorization", nhostAdminSecret);
                headers.remove("x-hasura-admin-secret");
                
                HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> jwtRequestEntity = 
                    new HttpEntity<>(body, headers);
                
                ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, jwtRequestEntity, Map.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    System.out.println("Nhost upload successful with JWT token: " + response.getBody());
                    return response.getBody();
                }
            }
            
            // If all attempts fail, throw the original exception
            throw e;
        }
    }
    
    private Map<String, Object> uploadViaRestAPI(String endpoint, MultipartFile file, String bucketId, String fileName) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + nhostAdminSecret);
        
        org.springframework.util.LinkedMultiValueMap<String, Object> body = 
            new org.springframework.util.LinkedMultiValueMap<>();
        
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
        
        body.add("file", fileResource);
        if (bucketId != null && !bucketId.isEmpty()) {
            body.add("bucketId", bucketId);
        }
        // Make file public
        body.add("isPublic", "true");
        
        HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> requestEntity = 
            new HttpEntity<>(body, headers);
        
        ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, requestEntity, Map.class);
        
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            System.out.println("REST API Success: " + response.getBody());
            return response.getBody();
        }
        
        throw new RuntimeException("REST API failed: " + response.getStatusCode());
    }
    
    private Map<String, Object> uploadViaHasuraGraphQL(String endpoint, MultipartFile file, String bucketId, String fileName) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + nhostAdminSecret);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Use Hasura's file upload mutation
        String mutation = """
            mutation($objects: [files_insert_input!]!) {
              insert_files(objects: $objects) {
                returning {
                  id
                  name
                  size
                  mimeType
                  bucketId
                  createdAt
                }
              }
            }
            """;
        
        String fileId = UUID.randomUUID().toString();
        Map<String, Object> fileObject = new HashMap<>();
        fileObject.put("id", fileId);
        fileObject.put("name", fileName);
        fileObject.put("size", file.getSize());
        fileObject.put("mimeType", file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        fileObject.put("bucketId", bucketId != null ? bucketId : "default");
        
        Map<String, Object> variables = Map.of("objects", new Object[]{fileObject});
        Map<String, Object> requestBody = Map.of("query", mutation, "variables", variables);
        
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(endpoint, requestEntity, Map.class);
        
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Map<String, Object> responseBody = response.getBody();
            System.out.println("GraphQL Response: " + responseBody);
            
            if (responseBody.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                if (data.containsKey("insert_files")) {
                    Map<String, Object> insertResult = (Map<String, Object>) data.get("insert_files");
                    if (insertResult.containsKey("returning")) {
                        Object[] returning = (Object[]) insertResult.get("returning");
                        if (returning.length > 0) {
                            return (Map<String, Object>) returning[0];
                        }
                    }
                }
            }
        }
        
        throw new RuntimeException("GraphQL upload failed: " + response.getBody());
    }
    
    // Local storage methods have been removed as all files are now stored in Nhost

    public String getFileUrl(String fileId) {
        // Return the direct Nhost storage URL
        return String.format("https://%s.storage.%s.nhost.run/v1/files/%s", 
            nhostSubdomain, nhostRegion, fileId);
    }

    public Map<String, String> getSignedUrl(String fileId, int expiresInSeconds) {
        try {
            // Try with Bearer token first
            try {
                return getSignedUrlWithBearerAuth(fileId, expiresInSeconds);
            } catch (Exception e) {
                System.err.println("Failed to get signed URL with Bearer auth: " + e.getMessage());
                // Fall back to x-hasura-admin-secret
                return getSignedUrlWithHasuraAdminSecret(fileId, expiresInSeconds);
            }
        } catch (Exception e) {
            System.err.println("Error getting signed URL from Nhost: " + e.getMessage());
            
            // If all methods fail, return a direct URL as fallback
            // This won't be secure but at least images will load
            Map<String, String> fallbackResult = new HashMap<>();
            String directUrl = getFileUrl(fileId);
            fallbackResult.put("signedUrl", directUrl);
            fallbackResult.put("url", directUrl);
            System.out.println("Using fallback direct URL: " + directUrl);
            return fallbackResult;
        }
    }
    
    private Map<String, String> getSignedUrlWithBearerAuth(String fileId, int expiresInSeconds) {
        String signUrl = String.format("https://%s.storage.%s.nhost.run/v1/files/%s/presignedurl",
            nhostSubdomain, nhostRegion, fileId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + nhostAdminSecret);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("expiresIn", expiresInSeconds);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        System.out.println("Getting signed URL with Bearer auth for file: " + fileId);
        ResponseEntity<Map> response = restTemplate.postForEntity(signUrl, requestEntity, Map.class);
        
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            System.out.println("Signed URL response: " + response.getBody());
            Map<String, String> result = new HashMap<>();
            result.put("signedUrl", (String) response.getBody().get("url"));
            result.put("url", (String) response.getBody().get("url"));
            return result;
        } else {
            throw new RuntimeException("Failed to get signed URL with Bearer auth");
        }
    }
    
    private Map<String, String> getSignedUrlWithHasuraAdminSecret(String fileId, int expiresInSeconds) {
        String signUrl = String.format("https://%s.storage.%s.nhost.run/v1/files/%s/presignedurl",
            nhostSubdomain, nhostRegion, fileId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-hasura-admin-secret", nhostAdminSecret);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("expiresIn", expiresInSeconds);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        System.out.println("Getting signed URL with x-hasura-admin-secret for file: " + fileId);
        ResponseEntity<Map> response = restTemplate.postForEntity(signUrl, requestEntity, Map.class);
        
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            System.out.println("Signed URL response: " + response.getBody());
            Map<String, String> result = new HashMap<>();
            result.put("signedUrl", (String) response.getBody().get("url"));
            result.put("url", (String) response.getBody().get("url"));
            return result;
        } else {
            throw new RuntimeException("Failed to get signed URL with x-hasura-admin-secret");
        }
    }

    public boolean deleteFile(String fileId) {
        try {
            String deleteUrl = String.format("https://%s.storage.%s.nhost.run/v1/files/%s", 
                nhostSubdomain, nhostRegion, fileId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + nhostAdminSecret);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<Void> response = restTemplate.exchange(deleteUrl, HttpMethod.DELETE, requestEntity, Void.class);
            
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            System.err.println("Error deleting file from Nhost: " + e.getMessage());
            throw new RuntimeException("Error deleting file from Nhost: " + e.getMessage(), e);
        }
    }
}
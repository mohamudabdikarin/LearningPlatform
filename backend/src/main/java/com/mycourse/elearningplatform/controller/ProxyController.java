package com.mycourse.elearningplatform.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

/**
 * Proxy controller to serve Nhost images through our backend to avoid CORS issues
 */
@RestController
@RequestMapping("/api/proxy")
public class ProxyController {

    @Value("${nhost.subdomain}")
    private String nhostSubdomain;

    @Value("${nhost.region}")
    private String nhostRegion;

    @Value("${nhost.adminsecret.}")
    private String nhostAdminSecret;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Proxy endpoint for Nhost images
     * @param fileId The Nhost file ID
     * @return The image content
     */
    /**
     * Proxy endpoint for Nhost files (images, videos, etc.)
     * @param fileId The Nhost file ID
     * @return The file content
     */
    @GetMapping("/image/{fileId}")
    public ResponseEntity<byte[]> proxyImage(@PathVariable String fileId) {
        try {
            // Construct the Nhost URL
            String nhostUrl = String.format("https://%s.storage.%s.nhost.run/v1/files/%s", 
                nhostSubdomain, nhostRegion, fileId);
            
            System.out.println("Proxying Nhost file: " + nhostUrl);
            
            // Create headers with authentication
            HttpHeaders requestHeaders = new HttpHeaders();
            requestHeaders.set("x-hasura-admin-secret", nhostAdminSecret);
            
            // Create request entity with headers
            org.springframework.http.HttpEntity<String> requestEntity = 
                new org.springframework.http.HttpEntity<>(requestHeaders);
            
            // Get the file from Nhost with authentication
            ResponseEntity<byte[]> response = restTemplate.exchange(
                nhostUrl, 
                org.springframework.http.HttpMethod.GET, 
                requestEntity, 
                byte[].class
            );
            
            // Get the content type from the response
            HttpHeaders responseHeaders = response.getHeaders();
            MediaType contentType = responseHeaders.getContentType();
            
            // Create headers with appropriate content type
            HttpHeaders headers = new HttpHeaders();
            if (contentType != null) {
                headers.setContentType(contentType);
            } else {
                // Try to guess content type from file extension
                if (fileId.toLowerCase().endsWith(".jpg") || fileId.toLowerCase().endsWith(".jpeg")) {
                    headers.setContentType(MediaType.IMAGE_JPEG);
                } else if (fileId.toLowerCase().endsWith(".png")) {
                    headers.setContentType(MediaType.IMAGE_PNG);
                } else if (fileId.toLowerCase().endsWith(".gif")) {
                    headers.setContentType(MediaType.IMAGE_GIF);
                } else if (fileId.toLowerCase().endsWith(".pdf")) {
                    headers.setContentType(MediaType.APPLICATION_PDF);
                } else {
                    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                }
            }
            
            // Add cache control headers
            headers.setCacheControl("public, max-age=31536000"); // Cache for 1 year
            
            // Return the file with our headers
            return new ResponseEntity<>(response.getBody(), headers, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error proxying Nhost file " + fileId + ": " + e.getMessage());
            
            // Try without authentication as fallback for public files
            try {
                String nhostUrl = String.format("https://%s.storage.%s.nhost.run/v1/files/%s", 
                    nhostSubdomain, nhostRegion, fileId);
                
                ResponseEntity<byte[]> response = restTemplate.getForEntity(nhostUrl, byte[].class);
                
                HttpHeaders headers = new HttpHeaders();
                MediaType contentType = response.getHeaders().getContentType();
                if (contentType != null) {
                    headers.setContentType(contentType);
                } else {
                    headers.setContentType(MediaType.IMAGE_PNG); // Default for images
                }
                headers.setCacheControl("public, max-age=31536000");
                
                return new ResponseEntity<>(response.getBody(), headers, HttpStatus.OK);
            } catch (Exception fallbackError) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        }
    }
    
    /**
     * Generic proxy endpoint for any Nhost file
     */
    @GetMapping("/file/{fileId}")
    public ResponseEntity<byte[]> proxyFile(@PathVariable String fileId) {
        return proxyImage(fileId); // Reuse the same implementation
    }
}
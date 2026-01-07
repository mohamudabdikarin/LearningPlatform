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

import java.io.IOException;
import java.net.URL;

/**
 * Proxy controller to serve images through our backend to avoid CORS issues
 * In demo mode, serves placeholder images from Picsum
 */
@RestController
@RequestMapping("/api/proxy")
public class ProxyController {

    @Value("${nhost.subdomain:demo}")
    private String nhostSubdomain;

    @Value("${nhost.region:demo}")
    private String nhostRegion;

    @Value("${nhost.admin.secret:demo}")
    private String nhostAdminSecret;

    @Value("${demo.mode:true}")
    private boolean demoMode;

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Proxy endpoint for images
     * @param fileId The file ID
     * @return The image content
     */
    @GetMapping("/image/{fileId}")
    public ResponseEntity<byte[]> proxyImage(@PathVariable String fileId) {
        if (demoMode) {
            return proxyDemoImage(fileId);
        }
        
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
     * Demo mode image proxy - serves placeholder images from Picsum
     */
    private ResponseEntity<byte[]> proxyDemoImage(String fileId) {
        try {
            // Generate consistent placeholder image based on fileId
            int imageId = Math.abs(fileId.hashCode() % 1000);
            String picsumUrl = "https://picsum.photos/400/300?random=" + imageId;
            
            System.out.println("📸 DEMO MODE: Proxying placeholder image: " + picsumUrl);
            
            // Get the image from Picsum
            ResponseEntity<byte[]> response = restTemplate.getForEntity(picsumUrl, byte[].class);
            
            // Create headers with appropriate content type
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG); // Picsum returns JPEG
            headers.setCacheControl("public, max-age=3600"); // Cache for 1 hour
            
            return new ResponseEntity<>(response.getBody(), headers, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error proxying demo image " + fileId + ": " + e.getMessage());
            
            // Return a simple 1x1 pixel image as ultimate fallback
            byte[] fallbackImage = createFallbackImage();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setCacheControl("public, max-age=3600");
            
            return new ResponseEntity<>(fallbackImage, headers, HttpStatus.OK);
        }
    }
    
    /**
     * Creates a simple 1x1 pixel PNG image as fallback
     */
    private byte[] createFallbackImage() {
        // Simple 1x1 transparent PNG (89 bytes)
        return new byte[] {
            (byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte)0xC4,
            (byte)0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
            0x78, (byte)0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05,
            0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte)0xB4, 0x00, 0x00,
            0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte)0xAE, 0x42,
            0x60, (byte)0x82
        };
    }
    
    /**
     * Generic proxy endpoint for any file
     */
    @GetMapping("/file/{fileId}")
    public ResponseEntity<byte[]> proxyFile(@PathVariable String fileId) {
        return proxyImage(fileId); // Reuse the same implementation
    }
}
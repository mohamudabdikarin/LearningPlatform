package com.mycourse.elearningplatform.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.cors.CorsUtils;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        System.out.println("[ERROR] Access denied for " + method + " " + requestURI + ": " + ex.getMessage());
        
        // Check if this is a CORS preflight request
        if (CorsUtils.isPreFlightRequest(request)) {
            return ResponseEntity.ok().build();
        }
        
        // Check if this should be a public endpoint
        if (isPublicEndpoint(requestURI, method)) {
            System.out.println("[WARNING] Public endpoint " + requestURI + " is being blocked - check security configuration");
        }
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of(
                "error", "Access denied",
                "message", "You don't have permission to access this resource",
                "path", requestURI,
                "method", method
            ));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        System.out.println("[ERROR] Authentication failed for " + method + " " + requestURI + ": " + ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of(
                "error", "Authentication required",
                "message", "Please provide valid authentication credentials",
                "path", requestURI,
                "method", method
            ));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of(
                "error", "Invalid credentials",
                "message", "The provided credentials are invalid"
            ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGeneral(Exception ex, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        System.out.println("[ERROR] Unexpected error for " + method + " " + requestURI + ": " + ex.getMessage());
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of(
                "error", "Internal server error",
                "message", "An unexpected error occurred",
                "path", requestURI,
                "method", method
            ));
    }

    private boolean isPublicEndpoint(String requestURI, String method) {
        // Define public endpoints that should never return 403
        return requestURI.equals("/") ||
               requestURI.startsWith("/api/auth/") ||
               (requestURI.startsWith("/api/courses") && "GET".equals(method)) ||
               requestURI.startsWith("/api/users/stats") ||
               requestURI.startsWith("/uploads/") ||
               requestURI.equals("/error");
    }
}
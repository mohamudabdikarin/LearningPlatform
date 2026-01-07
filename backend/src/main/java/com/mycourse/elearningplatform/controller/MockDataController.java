package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.service.MockDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for managing mock data for portfolio demo
 */
@RestController
@RequestMapping("/api/demo")
public class MockDataController {

    @Autowired
    private MockDataService mockDataService;

    /**
     * Initialize mock data for demo purposes
     */
    @PostMapping("/init")
    public ResponseEntity<?> initializeMockData() {
        try {
            mockDataService.initializeMockData();
            return ResponseEntity.ok(Map.of(
                "message", "Mock data initialized successfully",
                "demoAccounts", Map.of(
                    "admin", Map.of(
                        "email", MockDataService.DEMO_ADMIN_EMAIL,
                        "password", MockDataService.DEMO_PASSWORD,
                        "role", "TEACHER"
                    ),
                    "student", Map.of(
                        "email", MockDataService.DEMO_STUDENT_EMAIL,
                        "password", MockDataService.DEMO_PASSWORD,
                        "role", "STUDENT"
                    )
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to initialize mock data: " + e.getMessage()
            ));
        }
    }

    /**
     * Get platform statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getPlatformStats() {
        try {
            Map<String, Object> stats = mockDataService.getPlatformStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to get platform stats: " + e.getMessage()
            ));
        }
    }

    /**
     * Get demo account credentials
     */
    @GetMapping("/accounts")
    public ResponseEntity<?> getDemoAccounts() {
        return ResponseEntity.ok(Map.of(
            "admin", Map.of(
                "email", MockDataService.DEMO_ADMIN_EMAIL,
                "password", MockDataService.DEMO_PASSWORD,
                "role", "TEACHER",
                "description", "Demo admin account with teacher privileges"
            ),
            "student", Map.of(
                "email", MockDataService.DEMO_STUDENT_EMAIL,
                "password", MockDataService.DEMO_PASSWORD,
                "role", "STUDENT",
                "description", "Demo student account with course enrollments"
            )
        ));
    }
}
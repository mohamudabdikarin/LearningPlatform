package com.mycourse.elearningplatform.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "message", "Backend is running",
            "timestamp", System.currentTimeMillis()
        ));
    }

    @PostMapping("/cors")
    public ResponseEntity<?> testCors(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of(
            "status", "CORS working",
            "received", body != null ? body : "no body",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
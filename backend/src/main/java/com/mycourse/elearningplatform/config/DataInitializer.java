package com.mycourse.elearningplatform.config;

import com.mycourse.elearningplatform.service.MockDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Initializes mock data on application startup for demo purposes
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private MockDataService mockDataService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 Initializing demo data for portfolio showcase...");
        mockDataService.initializeMockData();
        System.out.println("✅ Demo data initialized successfully!");
        System.out.println("📧 Demo Admin: " + MockDataService.DEMO_ADMIN_EMAIL + " / " + MockDataService.DEMO_PASSWORD);
        System.out.println("🎓 Demo Student: " + MockDataService.DEMO_STUDENT_EMAIL + " / " + MockDataService.DEMO_PASSWORD);
    }
}
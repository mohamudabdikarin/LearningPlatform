package com.mycourse.elearningplatform.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Email configuration for demo mode
 * Provides a mock JavaMailSender when email is disabled
 */
@Configuration
public class EmailConfig {

    /**
     * Mock JavaMailSender for demo mode when email is disabled
     */
    @Bean
    @ConditionalOnProperty(name = "demo.email.enabled", havingValue = "false", matchIfMissing = true)
    public JavaMailSender mockJavaMailSender() {
        // Return a basic JavaMailSender implementation that won't actually send emails
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost("localhost");
        mailSender.setPort(25);
        return mailSender;
    }
}
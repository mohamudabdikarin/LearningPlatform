package com.mycourse.elearningplatform.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:demo@example.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5174}")
    private String frontendUrl;

    @Value("${demo.email.enabled:false}")
    private boolean emailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken, String firstName) {
        if (!emailEnabled) {
            System.out.println("📧 DEMO MODE: Password reset email would be sent to: " + toEmail);
            System.out.println("🔗 Reset link: " + frontendUrl + "/reset-password?token=" + resetToken);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Password Reset Request - E-Learning Platform");
        
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        
        String emailContent = String.format(
            "Hello %s,\n\n" +
            "You have requested to reset your password for your E-Learning Platform account.\n\n" +
            "Please click the link below to reset your password:\n" +
            "%s\n\n" +
            "This link will expire in 1 hour for security reasons.\n\n" +
            "If you did not request this password reset, please ignore this email.\n\n" +
            "Best regards,\n" +
            "E-Learning Platform Team",
            firstName, resetLink
        );
        
        message.setText(emailContent);
        mailSender.send(message);
    }

    public void sendEmailVerification(String toEmail, String verificationToken, String firstName) {
        if (!emailEnabled) {
            System.out.println("📧 DEMO MODE: Email verification would be sent to: " + toEmail);
            System.out.println("🔗 Verification link: " + frontendUrl + "/verify-email?token=" + verificationToken);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Verify Your Email - E-Learning Platform");
        
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        
        String emailContent = String.format(
            "Hello %s,\n\n" +
            "Welcome to the E-Learning Platform! Please verify your email address to complete your registration.\n\n" +
            "Click the link below to verify your email:\n" +
            "%s\n\n" +
            "This link will expire in 24 hours.\n\n" +
            "If you did not create an account, please ignore this email.\n\n" +
            "Best regards,\n" +
            "E-Learning Platform Team",
            firstName, verificationLink
        );
        
        message.setText(emailContent);
        mailSender.send(message);
    }

    public void sendResendVerificationEmail(String toEmail, String verificationToken, String firstName) {
        if (!emailEnabled) {
            System.out.println("📧 DEMO MODE: Resend verification email would be sent to: " + toEmail);
            System.out.println("🔗 Verification link: " + frontendUrl + "/verify-email?token=" + verificationToken);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Email Verification - E-Learning Platform");
        
        String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
        
        String emailContent = String.format(
            "Hello %s,\n\n" +
            "You requested a new email verification link for your E-Learning Platform account.\n\n" +
            "Click the link below to verify your email:\n" +
            "%s\n\n" +
            "This link will expire in 24 hours.\n\n" +
            "If you did not request this verification, please ignore this email.\n\n" +
            "Best regards,\n" +
            "E-Learning Platform Team",
            firstName, verificationLink
        );
        
        message.setText(emailContent);
        mailSender.send(message);
    }

    public void sendVerificationCode(String toEmail, String code, String firstName) {
        if (!emailEnabled) {
            System.out.println("📧 DEMO MODE: Verification code would be sent to: " + toEmail);
            System.out.println("🔢 Verification code: " + code);
            return;
        }

        try {
            System.out.println("Attempting to send verification code to: " + toEmail);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Your Verification Code - E-Learning Platform");
            String emailContent = String.format(
                "Hello %s,\n\n" +
                "Your verification code for E-Learning Platform is: %s\n\n" +
                "This code will expire in 10 minutes.\n\n" +
                "If you did not create an account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "E-Learning Platform Team",
                firstName, code
            );
            message.setText(emailContent);
            
            mailSender.send(message);
            System.out.println("Verification code sent successfully to: " + toEmail);
            
        } catch (Exception e) {
            System.err.println("Failed to send verification code to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send verification email: " + e.getMessage(), e);
        }
    }
}
package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.dto.*;
import com.mycourse.elearningplatform.model.Role;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.RoleRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import com.mycourse.elearningplatform.security.UserDetailsImpl;
import com.mycourse.elearningplatform.security.jwt.JwtUtil;
import com.mycourse.elearningplatform.service.EmailService;
import com.mycourse.elearningplatform.service.EmailValidationService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.security.SecureRandom;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // Dependencies needed for auth operations
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final EmailValidationService emailValidationService;

    // Constructor to inject dependencies
    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                          RoleRepository roleRepository, PasswordEncoder encoder, JwtUtil jwtUtil,
                          EmailService emailService, EmailValidationService emailValidationService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.emailValidationService = emailValidationService;
    }

    // ------------------------ LOGIN ------------------------
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Check if the email exists first
            if (!userRepository.existsByEmail(loginRequest.getEmail())) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password", "field", "email"));
            }

            // Authenticate using Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            // Ensure email is verified
            User user = userRepository.findByEmail(loginRequest.getEmail()).orElse(null);
            if (user != null && !user.isEmailVerified()) {
                return ResponseEntity.status(401).body(Map.of("error", "Please verify your email.", "field", "email", "requiresVerification", true));
            }

            // Generate JWT token
            String jwt = jwtUtil.generateToken(userDetails);
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority().replace("ROLE_", ""))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), userDetails.getFirstName(), roles));
        } catch (Exception e) {
            // Handle login failure
            if (e.getMessage().contains("Bad credentials")) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password", "field", "password"));
            }
            return ResponseEntity.status(401).body(Map.of("error", "Authentication failed.", "field", "general"));
        }
    }

    // ------------------------ REGISTER ------------------------
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // Validate the email
            var emailValidation = emailValidationService.validateEmail(registerRequest.getEmail());
            if (!emailValidation.isValid()) {
                return ResponseEntity.badRequest().body(Map.of("error", emailValidation.getMessage(), "field", "email"));
            }

            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use!", "field", "email"));
            }

            // Create new user
            User user = new User(registerRequest.getFirstName(), registerRequest.getLastName(),
                    registerRequest.getEmail(), encoder.encode(registerRequest.getPassword()));

            Set<Role> roles = new HashSet<>();
            String strRole = registerRequest.getRole();

            // Assign default role if not provided
            if (strRole == null || strRole.isBlank()) {
                Role userRole = roleRepository.findByName("STUDENT")
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                roles.add(userRole);
            } else {
                Role foundRole = roleRepository.findByName(strRole.trim().toUpperCase())
                        .orElseThrow(() -> new RuntimeException("Error: Role not found."));
                roles.add(foundRole);
            }

            // Set verification code
            String code = String.format("%06d", new SecureRandom().nextInt(1000000));
            user.setVerificationCode(code);
            user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
            user.setEmailVerified(false);
            user.setRoles(roles);

            userRepository.save(user);

            // Send verification code
            try {
                emailService.sendVerificationCode(user.getEmail(), code, user.getFirstName());
                return ResponseEntity.ok(Map.of("message", "Registration successful! Check your email.", "email", user.getEmail(), "requiresVerification", true));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Verification code sending failed.", "email", user.getEmail()));
            }

        } catch (Exception e) {
            return ResponseEntity.status(400).body("Registration failed: " + e.getMessage());
        }
    }

    // ------------------------ FORGOT PASSWORD ------------------------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail()).orElse(null);

            // Return success even if user doesn't exist to avoid revealing info
            if (user == null) {
                return ResponseEntity.ok(Map.of("message", "If an account exists, reset link sent."));
            }

            // Generate reset token
            String resetToken = UUID.randomUUID().toString();
            LocalDateTime expiry = LocalDateTime.now().plusHours(1);
            userRepository.updateResetToken(user.getId(), resetToken, expiry);

            try {
                emailService.sendPasswordResetEmail(user.getEmail(), resetToken, user.getFirstName());
                return ResponseEntity.ok(Map.of("message", "Password reset link sent."));
            } catch (Exception e) {
                userRepository.updateResetToken(user.getId(), null, null);
                return ResponseEntity.status(500).body(Map.of("error", "Failed to send reset email."));
            }

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error processing request."));
        }
    }

    // ------------------------ RESET PASSWORD ------------------------
    @PostMapping("/reset-password")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            User user = userRepository.findByResetToken(request.getToken()).orElse(null);

            if (user == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token."));
            }

            // Update password and clear token
            userRepository.updatePasswordAndResetToken(user.getId(), encoder.encode(request.getPassword()), null, null);

            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error resetting password."));
        }
    }

    // ------------------------ VERIFY EMAIL ------------------------
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        try {
            User user = userRepository.findByVerificationCode(request.getToken()).orElse(null);

            if (user == null || user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired token."));
            }

            userRepository.updateEmailVerification(user.getId(), true, null, null);

            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            String jwt = jwtUtil.generateToken(userDetails);
            List<String> roles = userDetails.getAuthorities().stream().map(r -> r.getAuthority().replace("ROLE_", "")).collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), userDetails.getFirstName(), roles));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Email verification failed."));
        }
    }

    // ------------------------ VERIFY CODE ------------------------
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || user.isEmailVerified() ||
                user.getVerificationCode() == null ||
                !user.getVerificationCode().equals(code) ||
                user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired code."));
        }

        userRepository.updateEmailVerification(user.getId(), true, null, null);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully."));
    }

    // ------------------------ RESEND CODE ------------------------
    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || user.isEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found or already verified."));
        }

        // Generate and send new code
        String code = String.format("%06d", new SecureRandom().nextInt(1000000));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendVerificationCode(user.getEmail(), code, user.getFirstName());

        return ResponseEntity.ok(Map.of("message", "Verification code resent."));
    }

    // ------------------------ RESEND VERIFICATION LINK ------------------------
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody EmailVerificationRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail()).orElse(null);

            if (user == null || user.isEmailVerified()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Already verified or not found."));
            }

            String token = UUID.randomUUID().toString();
            user.setVerificationCode(token);
            user.setVerificationCodeExpiry(LocalDateTime.now().plusHours(24));
            userRepository.save(user);

            emailService.sendResendVerificationEmail(user.getEmail(), token, user.getFirstName());
            return ResponseEntity.ok(Map.of("message", "Verification link resent."));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error resending verification email."));
        }
    }
}

package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.dto.JwtResponse;
import com.mycourse.elearningplatform.dto.LoginRequest;
import com.mycourse.elearningplatform.dto.RegisterRequest;
import com.mycourse.elearningplatform.dto.ForgotPasswordRequest;
import com.mycourse.elearningplatform.dto.ResetPasswordRequest;
import com.mycourse.elearningplatform.dto.EmailVerificationRequest;
import com.mycourse.elearningplatform.dto.VerifyEmailRequest;
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

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Collections;
import java.time.LocalDateTime;
import java.util.UUID;
import java.security.SecureRandom;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final EmailValidationService emailValidationService;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder encoder, JwtUtil jwtUtil, EmailService emailService, EmailValidationService emailValidationService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.emailValidationService = emailValidationService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Check if user exists first
            if (!userRepository.existsByEmail(loginRequest.getEmail())) {
                return ResponseEntity
                        .status(401)
                        .body(Map.of("error", "Invalid email or password", "field", "email"));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Check if email is verified
            User user = userRepository.findByEmail(loginRequest.getEmail()).orElse(null);
            if (user != null && !user.isEmailVerified()) {
                return ResponseEntity
                        .status(401)
                        .body(Map.of("error", "Please verify your email address before signing in.", "field", "email", "requiresVerification", true));
            }
            
            String jwt = jwtUtil.generateToken(userDetails);

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority().replace("ROLE_", ""))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getFirstName(),
                    roles));
        } catch (Exception e) {
            // Check if it's a bad credentials exception
            if (e.getMessage().contains("Bad credentials")) {
                return ResponseEntity
                        .status(401)
                        .body(Map.of("error", "Invalid email or password", "field", "password"));
            }
            // For other authentication exceptions
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", "Authentication failed. Please check your credentials.", "field", "general"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // Validate email format and check for disposable emails
            EmailValidationService.EmailValidationResult emailValidation = emailValidationService.validateEmail(registerRequest.getEmail());
            if (!emailValidation.isValid()) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", emailValidation.getMessage(), "field", "email"));
            }

            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "Email is already in use!", "field", "email"));
            }

            User user = new User(registerRequest.getFirstName(),
                    registerRequest.getLastName(),
                    registerRequest.getEmail(),
                    encoder.encode(registerRequest.getPassword()));

            Set<Role> roles = new HashSet<>();
            String strRole = registerRequest.getRole();

            System.out.println("Registration - Requested role: " + strRole);

            if (strRole == null || strRole.isBlank()) {
                Role userRole = roleRepository.findByName("STUDENT")
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                roles.add(userRole);
                System.out.println("Registration - Defaulting to STUDENT role");
            } else {
                String roleUpper = strRole.trim().toUpperCase();
                System.out.println("Registration - Looking for role: " + roleUpper);
                
                Role foundRole = roleRepository.findByName(roleUpper)
                        .orElseThrow(() -> new RuntimeException("Error: Role '" + roleUpper + "' is not found."));
                roles.add(foundRole);
                System.out.println("Registration - Found role: " + foundRole.getName() + " (ID: " + foundRole.getId() + ")");
            }

            // Generate 6-digit verification code
            String code = String.format("%06d", new SecureRandom().nextInt(1000000));
            user.setVerificationCode(code);
            user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
            user.setEmailVerified(false);
            user.setRoles(roles);
            
            System.out.println("Registration - Setting roles for user: " + user.getEmail() + ", Roles: " + 
                user.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.joining(", ")));
            
            userRepository.save(user);
            
            // Verify roles were saved correctly
            User savedUser = userRepository.findByEmail(user.getEmail()).orElse(null);
            if (savedUser != null) {
                System.out.println("Registration - After save - User: " + savedUser.getEmail() + ", Roles: " + 
                    savedUser.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.joining(", ")));
            }

            // Send code via email
            try {
                emailService.sendVerificationCode(user.getEmail(), code, user.getFirstName());
                return ResponseEntity.ok(Map.of(
                    "message", "Registration successful! Please check your email for the verification code.",
                    "email", user.getEmail(),
                    "requiresVerification", true
                ));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of(
                    "error", "Account created but verification code failed to send. Please contact support.",
                    "email", user.getEmail(),
                    "requiresVerification", true
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElse(null);

            if (user == null) {
                // Don't reveal if email exists or not for security
                return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a password reset link has been sent."));
            }

            // Generate reset token
            String resetToken = UUID.randomUUID().toString();
            LocalDateTime resetTokenExpiry = LocalDateTime.now().plusHours(1); // 1 hour expiry
            
            // Use custom query to update only reset token fields
            userRepository.updateResetToken(user.getId(), resetToken, resetTokenExpiry);

            // Send email
            try {
                emailService.sendPasswordResetEmail(user.getEmail(), resetToken, user.getFirstName());
                return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a password reset link has been sent."));
            } catch (Exception e) {
                // If email fails, clear the token
                userRepository.updateResetToken(user.getId(), null, null);
                return ResponseEntity.status(500).body(Map.of("error", "Failed to send password reset email. Please try again later."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "An error occurred while processing your request."));
        }
    }

    @PostMapping("/reset-password")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            User user = userRepository.findByResetToken(request.getToken())
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired reset token."));
            }

            if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                // Clear expired token
                user.setResetToken(null);
                user.setResetTokenExpiry(null);
                userRepository.save(user);
                return ResponseEntity.badRequest().body(Map.of("error", "Reset token has expired. Please request a new one."));
            }

            // Use custom query to update only password and reset token fields
            // This avoids any potential issues with JPA entity state management
            userRepository.updatePasswordAndResetToken(
                user.getId(),
                encoder.encode(request.getPassword()),
                null,  // resetToken
                null   // resetTokenExpiry
            );

            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "An error occurred while resetting your password."));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        try {
            User user = userRepository.findByVerificationCode(request.getToken())
                    .orElse(null);

            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification token."));
            }

            if (user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
                // Clear expired token
                user.setVerificationCode(null);
                user.setVerificationCodeExpiry(null);
                userRepository.save(user);
                return ResponseEntity.badRequest().body(Map.of("error", "Verification token has expired. Please request a new one."));
            }

            // Verify email and clear token
            userRepository.updateEmailVerification(user.getId(), true, null, null);

            // Generate JWT and return user info
            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            String jwt = jwtUtil.generateToken(userDetails);
            List<String> userRoles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority().replace("ROLE_", ""))
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getFirstName(),
                    userRoles));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "An error occurred while verifying your email."));
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found."));
        }
        if (user.isEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already verified."));
        }
        if (user.getVerificationCode() == null || user.getVerificationCodeExpiry() == null ||
            !user.getVerificationCode().equals(code) ||
            user.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired verification code."));
        }
        
        // Log roles before verification
        System.out.println("Email verification - Before verification - User: " + user.getEmail() + ", Roles: " + 
            user.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.joining(", ")));
        
        // Use custom query to update only email verification fields
        userRepository.updateEmailVerification(user.getId(), true, null, null);
        
        // Verify roles after verification
        User verifiedUser = userRepository.findByEmail(email).orElse(null);
        if (verifiedUser != null) {
            System.out.println("Email verification - After verification - User: " + verifiedUser.getEmail() + ", Roles: " + 
                verifiedUser.getRoles().stream().map(Role::getName).collect(java.util.stream.Collectors.joining(", ")));
        }
        
        return ResponseEntity.ok(Map.of("message", "Email verified successfully."));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found."));
        }
        if (user.isEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already verified."));
        }
        // Generate new code
        String code = String.format("%06d", new SecureRandom().nextInt(1000000));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendVerificationCode(user.getEmail(), code, user.getFirstName());
        return ResponseEntity.ok(Map.of("message", "Verification code resent."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@Valid @RequestBody EmailVerificationRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElse(null);

            if (user == null) {
                // Don't reveal if email exists or not for security
                return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a verification link has been sent."));
            }

            if (user.isEmailVerified()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is already verified."));
            }

            // Generate new verification token
            String verificationToken = UUID.randomUUID().toString();
            user.setVerificationCode(verificationToken);
            user.setVerificationCodeExpiry(LocalDateTime.now().plusHours(24));
            userRepository.save(user);

            // Send verification email
            try {
                emailService.sendResendVerificationEmail(user.getEmail(), verificationToken, user.getFirstName());
                return ResponseEntity.ok(Map.of("message", "If an account with that email exists, a verification link has been sent."));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Failed to send verification email. Please try again later."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "An error occurred while processing your request."));
        }
    }

}
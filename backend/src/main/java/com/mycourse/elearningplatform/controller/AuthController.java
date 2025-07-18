package com.mycourse.elearningplatform.controller;

import com.mycourse.elearningplatform.dto.JwtResponse;
import com.mycourse.elearningplatform.dto.LoginRequest;
import com.mycourse.elearningplatform.dto.RegisterRequest;
import com.mycourse.elearningplatform.model.Role;
import com.mycourse.elearningplatform.model.User;
import com.mycourse.elearningplatform.repository.RoleRepository;
import com.mycourse.elearningplatform.repository.UserRepository;
import com.mycourse.elearningplatform.security.UserDetailsImpl;
import com.mycourse.elearningplatform.security.jwt.JwtUtil;

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

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder encoder, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtil.generateToken(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getFirstName(),
                roles));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity
                        .badRequest()
                        .body("Error: Email is already in use!");
            }

            User user = new User(registerRequest.getFirstName(),
                    registerRequest.getLastName(),
                    registerRequest.getEmail(),
                    encoder.encode(registerRequest.getPassword()));

            Set<Role> roles = new HashSet<>();
            String strRole = registerRequest.getRole();

            if (strRole == null || strRole.isBlank()) {
                Role userRole = roleRepository.findByName("STUDENT")
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                roles.add(userRole);
            } else {
                String roleUpper = strRole.trim().toUpperCase();
                Role foundRole = roleRepository.findByName(roleUpper)
                        .orElseThrow(() -> new RuntimeException("Error: Role '" + roleUpper + "' is not found."));
                roles.add(foundRole);
            }

            user.setRoles(roles);
            userRepository.save(user);

            // Immediately authenticate and return JWT + user info
            UserDetailsImpl userDetails = UserDetailsImpl.build(user);
            String jwt = jwtUtil.generateToken(userDetails);
            List<String> userRoles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getFirstName(),
                    userRoles));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Registration failed: " + e.getMessage());
        }
    }

}
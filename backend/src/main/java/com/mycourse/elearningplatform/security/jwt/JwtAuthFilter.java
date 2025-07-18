package com.mycourse.elearningplatform.security.jwt;

import com.mycourse.elearningplatform.security.UserDetailsImpl;
import com.mycourse.elearningplatform.security.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");
            System.out.println("[DEBUG] JwtAuthFilter - Authorization header: " + authHeader);

            String jwt = null;
            String username = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
                try {
                    username = jwtUtil.extractUsername(jwt);
                } catch (Exception e) {
                    System.out.println("[DEBUG] JWT parsing error: " + e.getMessage());
                    // Continue without authentication
                }
            }

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    io.jsonwebtoken.Claims claims = jwtUtil.extractAllClaims(jwt);
                    List<String> roles = claims.get("roles", List.class);
                    List<GrantedAuthority> authorities = roles != null
                        ? roles.stream().map(role -> new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role)).collect(Collectors.toList())
                        : Collections.emptyList();

                    // ✅ Extract userId from the token
                    Long userId = claims.get("userId", Long.class);

// Build lightweight UserDetailsImpl from JWT claims
                    UserDetails userDetails = new com.mycourse.elearningplatform.security.UserDetailsImpl(
                            userId, // Pass the ID here
                            username,
                            null,
                            null,
                            authorities
                    );

                    // Validate token (skip DB userDetails)
                    if (username.equals(jwtUtil.extractUsername(jwt)) && !jwtUtil.extractExpiration(jwt).before(new java.util.Date())) {
                        UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                } catch (Exception e) {
                    System.out.println("[DEBUG] Authentication error: " + e.getMessage());
                    // Continue without authentication
                }
            }
        } catch (Exception e) {
            System.out.println("[DEBUG] Filter error: " + e.getMessage());
            // Continue without authentication
        }
        
        filterChain.doFilter(request, response);
    }
}

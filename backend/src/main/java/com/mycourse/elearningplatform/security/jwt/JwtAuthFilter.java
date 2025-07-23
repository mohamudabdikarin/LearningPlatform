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

    // Public endpoints are now defined and handled in SecurityConfig

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        // Skip JWT processing for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equals(method)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            String authHeader = request.getHeader("Authorization");
            String jwt = null;
            String username = null;

            // Extract JWT token if present
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                jwt = authHeader.substring(7);
                try {
                    username = jwtUtil.extractUsername(jwt);
                } catch (Exception e) {
                    // Invalid token - let Spring Security handle it
                    // No need to log every invalid token as it's normal for expired sessions
                }
            }

            // Process authentication if we have a valid username and no existing authentication
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    // Extract claims from JWT
                    io.jsonwebtoken.Claims claims = jwtUtil.extractAllClaims(jwt);
                    List<String> roles = claims.get("roles", List.class);
                    List<GrantedAuthority> authorities = roles != null
                        ? roles.stream()
                            .map(role -> new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role))
                            .collect(Collectors.toList())
                        : Collections.emptyList();

                    Long userId = claims.get("userId", Long.class);

                    // Create UserDetails from JWT claims
                    UserDetails userDetails = new UserDetailsImpl(
                            userId,
                            username,
                            null, // firstName not needed for authentication
                            null, // password not needed for JWT
                            authorities
                    );

                    // Validate token expiration
                    if (!jwtUtil.extractExpiration(jwt).before(new java.util.Date())) {
                        UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                } catch (Exception e) {
                    // Authentication failed - let Spring Security handle it
                    // Only log serious authentication errors, not routine token expirations
                    if (!e.getMessage().contains("expired")) {
                        System.out.println("[DEBUG] Authentication failed: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            // Filter error - log and continue
            // Only log unexpected errors that aren't related to normal token handling
            if (!e.getMessage().contains("expired") && !e.getMessage().contains("JWT")) {
                System.out.println("[DEBUG] JWT Filter error: " + e.getMessage());
            }
        }
        
        // Always continue the filter chain
        filterChain.doFilter(request, response);
    }
}

package com.rahul.insurance.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security Configuration.
 *
 * For the MVP / Hansa interview demo, all API endpoints are open (permitAll).
 * This lets us test the APIs with curl or Postman without setting up JWT tokens first.
 *
 * When adding authentication later:
 *  - Replace permitAll() with role-based access control (.hasRole("ADMIN"))
 *  - Add a JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter
 *  - Add a UserDetailsService backed by a 'users' table in MySQL
 *
 * CORS is configured to allow the React frontend (running on port 3000) to
 * make requests to this backend (port 8080).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF — not needed for stateless REST APIs
            .csrf(AbstractHttpConfigurer::disable)

            // Apply CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Stateless session — REST APIs do not use HTTP sessions
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── Authorization Rules ──────────────────────────────────────────
            // For the demo: permit all. Replace with role-based rules later.
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );

        return http.build();
    }

    /**
     * CORS configuration — allows the React frontend to call this backend.
     * In production, replace "*" with the actual deployed frontend URL.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}

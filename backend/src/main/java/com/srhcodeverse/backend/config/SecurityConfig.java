
package com.srhcodeverse.backend.config;

import com.srhcodeverse.backend.security.JwtAuthFilter;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;

        public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
                this.jwtAuthFilter = jwtAuthFilter;
        }

        // Password encoder
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        // Authentication manager
        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {

                return config.getAuthenticationManager();
        }

        // CORS configuration
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {

                CorsConfiguration configuration = new CorsConfiguration();

                configuration.setAllowedOrigins(List.of(
                                "https://srh-codeverse.vercel.app",
                                "https://srh-codeverse-5eo3ol4jh-sidus-projects-0ae5cf1a.vercel.app",
                                "http://localhost:5173",
                                "http://localhost:5174",
                                "https://frontend-git-main-siddus-projects-0ae5cf1a.vercel.app",
                                "https://frontend-ct11gap11-siddus-projects-0ae5cf1a.vercel.app",
                                "https://frontend-cpt6iyad4-siddus-projects-0ae5cf1a.vercel.app"));

                configuration.setAllowedMethods(List.of(
                                "GET",
                                "POST",
                                "PUT",
                                "PATCH",
                                "DELETE",
                                "OPTIONS"));

                configuration.setAllowedHeaders(List.of("*"));

                configuration.setAllowCredentials(true);

                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", configuration);

                return source;
        }

        // Security filter chain
        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http)
                        throws Exception {

                http
                                // CORS
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // Disable CSRF for stateless JWT authentication
                                .csrf(csrf -> csrf.disable())

                                // Stateless session management
                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                // Authorization rules
                                .authorizeHttpRequests(auth -> auth

                                                // Allow CORS preflight requests
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                // Public authentication endpoints
                                                .requestMatchers("/api/auth/**").permitAll()

                                                // Course progress requires authentication
                                                .requestMatchers("/api/courses/*/progress")
                                                .authenticated()

                                                // Public course browsing
                                                .requestMatchers("/api/courses/**").permitAll()

                                                // Imported problem data: authorized roles only
                                                .requestMatchers("/api/problems/*/imported-data")
                                                .hasAnyRole("STUDENT", "TRAINER", "ADMIN")

                                                // All other endpoints require authentication
                                                .anyRequest().authenticated())

                                // JWT authentication filter
                                .addFilterBefore(
                                                jwtAuthFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}

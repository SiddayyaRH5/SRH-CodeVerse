
package com.srhcodeverse.backend.config;

import com.srhcodeverse.backend.security.JwtAuthFilter;
import com.srhcodeverse.backend.service.CustomOAuth2UserService;
import com.srhcodeverse.backend.service.OAuth2LoginSuccessHandler;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

        public SecurityConfig(
                        JwtAuthFilter jwtAuthFilter,
                        CustomOAuth2UserService customOAuth2UserService,
                        OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
                this.jwtAuthFilter = jwtAuthFilter;
                this.customOAuth2UserService = customOAuth2UserService;
                this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public ClientRegistrationRepository clientRegistrationRepository(
                        @Value("${spring.security.oauth2.client.registration.google.client-id}") String googleClientId,
                        @Value("${spring.security.oauth2.client.registration.google.client-secret}") String googleClientSecret,
                        @Value("${spring.security.oauth2.client.registration.github.client-id}") String githubClientId,
                        @Value("${spring.security.oauth2.client.registration.github.client-secret}") String githubClientSecret,
                        @Value("${spring.security.oauth2.client.registration.google.redirect-uri}") String googleRedirectUri,
                        @Value("${spring.security.oauth2.client.registration.github.redirect-uri}") String githubRedirectUri) {
                requireOAuthCredentials("google", googleClientId, googleClientSecret);
                requireOAuthCredentials("github", githubClientId, githubClientSecret);

                ClientRegistration googleRegistration = ClientRegistration
                                .withRegistrationId("google")
                                .clientId(googleClientId)
                                .clientSecret(googleClientSecret)
                                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                                .redirectUri(googleRedirectUri)
                                .scope("openid", "profile", "email")
                                .authorizationUri("https://accounts.google.com/o/oauth2/auth")
                                .tokenUri("https://accounts.google.com/o/oauth2/token")
                                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                                .userNameAttributeName("sub")
                                .clientName("Google")
                                .build();

                ClientRegistration githubRegistration = ClientRegistration
                                .withRegistrationId("github")
                                .clientId(githubClientId)
                                .clientSecret(githubClientSecret)
                                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                                .redirectUri(githubRedirectUri)
                                .scope("user:email")
                                .authorizationUri("https://github.com/login/oauth/authorize")
                                .tokenUri("https://github.com/login/oauth/access_token")
                                .userInfoUri("https://api.github.com/user")
                                .userNameAttributeName("id")
                                .clientName("GitHub")
                                .build();

                return new InMemoryClientRegistrationRepository(googleRegistration, githubRegistration);
        }

        private static void requireOAuthCredentials(String provider, String clientId, String clientSecret) {
                if (clientId == null || clientId.isBlank()
                                || clientSecret == null || clientSecret.isBlank()) {
                        throw new IllegalStateException(
                                        "OAuth client ID and secret must be configured for provider " + provider);
                }
        }

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
                                "GET", "POST", "PUT", "PATCH",
                                "DELETE", "OPTIONS"));

                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

                source.registerCorsConfiguration("/**", configuration);

                return source;
        }

        @Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http)
                throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/api/health/live", "/api/health/ready").permitAll()
                        .requestMatchers("/api/courses/*/progress").authenticated()
                        .requestMatchers("/api/courses/**").permitAll()
                        .requestMatchers("/api/problems/*/imported-data")
                                .hasAnyRole("STUDENT", "TRAINER", "ADMIN")
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService))
                        .successHandler(oAuth2LoginSuccessHandler)
                        .authorizationEndpoint(authorization ->
                                authorization.baseUri("/api/auth/login/oauth2")))
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
}
}



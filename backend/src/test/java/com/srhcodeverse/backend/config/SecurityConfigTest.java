package com.srhcodeverse.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import com.srhcodeverse.backend.security.JwtAuthFilter;
import com.srhcodeverse.backend.service.CustomOAuth2UserService;
import com.srhcodeverse.backend.service.OAuth2LoginSuccessHandler;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

class SecurityConfigTest {

    private final SecurityConfig securityConfig = new SecurityConfig(
            mock(JwtAuthFilter.class),
            mock(CustomOAuth2UserService.class),
            mock(OAuth2LoginSuccessHandler.class));

    @Test
    void googleRegistrationUsesOpenIdConnectIdentityAndVerifiedEmailClaims() {
        ClientRegistrationRepository registrations = registrations();
        ClientRegistration google = registrations.findByRegistrationId("google");

        assertEquals(
                "https://openidconnect.googleapis.com/v1/userinfo",
                google.getProviderDetails().getUserInfoEndpoint().getUri());
        assertEquals(
                "sub",
                google.getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName());
        assertTrue(google.getScopes().contains("openid"));
        assertTrue(google.getScopes().contains("email"));
    }

    @Test
    void missingProviderCredentialsFailWithSafeConfigurationError() {
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> securityConfig.clientRegistrationRepository(
                        "",
                        "do-not-disclose-google-secret",
                        "github-client-id",
                        "github-client-secret",
                        "{baseUrl}/login/oauth2/code/google",
                        "{baseUrl}/login/oauth2/code/github"));

        assertEquals(
                "OAuth client ID and secret must be configured for provider google",
                exception.getMessage());
        assertFalse(exception.getMessage().contains("do-not-disclose-google-secret"));
    }

    @Test
    void missingGitHubCredentialsFailWithSafeConfigurationError() {
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> securityConfig.clientRegistrationRepository(
                        "google-client-id",
                        "google-client-secret",
                        "github-client-id",
                        "",
                        "{baseUrl}/login/oauth2/code/google",
                        "{baseUrl}/login/oauth2/code/github"));

        assertEquals(
                "OAuth client ID and secret must be configured for provider github",
                exception.getMessage());
    }

    private ClientRegistrationRepository registrations() {
        return securityConfig.clientRegistrationRepository(
                "google-client-id",
                "google-client-secret",
                "github-client-id",
                "github-client-secret",
                "{baseUrl}/login/oauth2/code/google",
                "{baseUrl}/login/oauth2/code/github");
    }
}

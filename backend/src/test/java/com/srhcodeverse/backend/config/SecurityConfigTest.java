package com.srhcodeverse.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.srhcodeverse.backend.security.JwtAuthFilter;
import com.srhcodeverse.backend.service.CustomOAuth2UserService;
import com.srhcodeverse.backend.service.OAuth2LoginSuccessHandler;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

class SecurityConfigTest {

    private final CustomOAuth2UserService customOAuth2UserService = mock(CustomOAuth2UserService.class);
    private final SecurityConfig securityConfig = new SecurityConfig(
            mock(JwtAuthFilter.class),
            customOAuth2UserService,
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
        assertEquals("https://accounts.google.com", google.getProviderDetails().getIssuerUri());
        assertEquals(
                "https://www.googleapis.com/oauth2/v3/certs",
                google.getProviderDetails().getJwkSetUri());
        assertTrue(google.getScopes().contains("openid"));
        assertTrue(google.getScopes().contains("email"));
    }

    @Test
    void oidcUserServiceUsesCustomVerifiedAccountMapping() {
        Instant issuedAt = Instant.now().minusSeconds(10);
        Instant expiresAt = Instant.now().plusSeconds(300);
        ClientRegistration google = registrations().findByRegistrationId("google");
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "test-access-token",
                issuedAt,
                expiresAt,
                Set.of("openid", "email", "profile"));
        OidcIdToken idToken = new OidcIdToken(
                "test-id-token",
                issuedAt,
                expiresAt,
                Map.of(
                        "iss", "https://accounts.google.com",
                        "sub", "google-subject",
                        "aud", List.of("google-client-id")));
        OAuth2User verifiedUser = new DefaultOAuth2User(
                Set.of(),
                Map.of(
                        "sub", "google-subject",
                        "email", "verified@example.test",
                        "email_verified", true,
                        "username", "verified"),
                "username");
        when(customOAuth2UserService.loadUser(any(OAuth2UserRequest.class)))
                .thenReturn(verifiedUser);

        OidcUser oidcUser = securityConfig.oidcUserService(customOAuth2UserService)
                .loadUser(new OidcUserRequest(google, accessToken, idToken));

        assertEquals("google-subject", oidcUser.getName());
        assertEquals("verified", oidcUser.getAttribute("username"));
        assertEquals("verified@example.test", oidcUser.getAttribute("email"));
        verify(customOAuth2UserService).loadUser(any(OAuth2UserRequest.class));
    }

    @Test
    void incompleteGoogleCredentialsDisableOnlyGoogle() {
        ClientRegistrationRepository registrations = securityConfig.clientRegistrationRepository(
                "",
                "do-not-disclose-google-secret",
                "github-client-id",
                "github-client-secret",
                "{baseUrl}/login/oauth2/code/google",
                "{baseUrl}/login/oauth2/code/github");

        assertNull(registrations.findByRegistrationId("google"));
        assertNotNull(registrations.findByRegistrationId("github"));
    }

    @Test
    void incompleteGitHubCredentialsDisableOnlyGitHub() {
        ClientRegistrationRepository registrations = securityConfig.clientRegistrationRepository(
                "google-client-id",
                "google-client-secret",
                "github-client-id",
                "",
                "{baseUrl}/login/oauth2/code/google",
                "{baseUrl}/login/oauth2/code/github");

        assertNotNull(registrations.findByRegistrationId("google"));
        assertNull(registrations.findByRegistrationId("github"));
    }

    @Test
    void noOAuthCredentialsDisableBothProviders() {
        ClientRegistrationRepository registrations = securityConfig.clientRegistrationRepository(
                "",
                "",
                "",
                "",
                "{baseUrl}/login/oauth2/code/google",
                "{baseUrl}/login/oauth2/code/github");

        assertNull(registrations.findByRegistrationId("google"));
        assertNull(registrations.findByRegistrationId("github"));
    }

    @Test
    void googleOnlyCredentialsEnableOnlyGoogle() {
        ClientRegistrationRepository registrations = securityConfig.clientRegistrationRepository(
                "google-client-id",
                "google-client-secret",
                "",
                "",
                "{baseUrl}/login/oauth2/code/google",
                "{baseUrl}/login/oauth2/code/github");

        assertNotNull(registrations.findByRegistrationId("google"));
        assertNull(registrations.findByRegistrationId("github"));
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

package com.srhcodeverse.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Verifies that the application starts when OAuth providers are not configured,
 * and that each provider is independently registered only when its credentials
 * are present.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:oauthstartup",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "jwt.secret=test-secret-key-do-not-use-in-production",
        "spring.security.oauth2.client.registration.google.client-id=",
        "spring.security.oauth2.client.registration.google.client-secret=",
        "spring.security.oauth2.client.registration.github.client-id=",
        "spring.security.oauth2.client.registration.github.client-secret=",
        "spring.security.oauth2.client.registration.google.redirect-uri={baseUrl}/login/oauth2/code/google",
        "spring.security.oauth2.client.registration.github.redirect-uri={baseUrl}/login/oauth2/code/github"
})
class OAuthProviderStartupIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientRegistrationRepository clientRegistrationRepository;

    @Test
    void applicationStartsWithoutOAuthProviders() {
        assertNull(clientRegistrationRepository.findByRegistrationId("google"));
        assertNull(clientRegistrationRepository.findByRegistrationId("github"));
    }

    @Test
    void oauthProvidersEndpointReportsDisabledProviders() throws Exception {
        mockMvc.perform(get("/api/auth/oauth/providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.google").value(false))
                .andExpect(jsonPath("$.github").value(false));
    }
}

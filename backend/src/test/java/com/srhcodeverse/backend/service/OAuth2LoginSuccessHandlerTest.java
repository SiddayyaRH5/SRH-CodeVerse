package com.srhcodeverse.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

class OAuth2LoginSuccessHandlerTest {

    @Test
    void redirectsToProductionFrontendCallbackWithOnlyTheTemporaryCode() throws Exception {
        String redirectUrl = runHandler(
                "https://srh-codeverse.vercel.app",
                "temporary-code");

        assertEquals(
                "https://srh-codeverse.vercel.app/oauth/callback?code=temporary-code",
                redirectUrl);
        assertFalse(redirectUrl.contains("token="));
    }

    @Test
    void supportsLocalFrontendCallbackConfiguration() throws Exception {
        String redirectUrl = runHandler("http://localhost:5173", "temporary-code");

        assertEquals("http://localhost:5173/oauth/callback?code=temporary-code", redirectUrl);
    }

    @Test
    void encodesTheTemporaryCodeAsAQueryParameter() throws Exception {
        String redirectUrl = runHandler("https://srh-codeverse.vercel.app", "code+/?");

        assertEquals(
                "https://srh-codeverse.vercel.app/oauth/callback?code=code%2B%2F%3F",
                redirectUrl);
    }

    @Test
    void rejectsNonLocalHttpFrontendOrigins() {
        UserRepository userRepository = mock(UserRepository.class);
        OAuthCodeService oAuthCodeService = mock(OAuthCodeService.class);

        assertThrows(
                IllegalStateException.class,
                () -> new OAuth2LoginSuccessHandler(
                        userRepository,
                        oAuthCodeService,
                        "http://untrusted.example"));
    }

    private String runHandler(String frontendBaseUrl, String code) throws Exception {
        UserRepository userRepository = mock(UserRepository.class);
        OAuthCodeService oAuthCodeService = mock(OAuthCodeService.class);
        User user = User.builder().username("oauth-user").build();
        when(userRepository.findByUsername("oauth-user")).thenReturn(Optional.of(user));
        when(oAuthCodeService.issueCode(user)).thenReturn(code);

        DefaultOAuth2User principal = new DefaultOAuth2User(
                List.of(),
                Map.of("username", "oauth-user"),
                "username");
        Authentication authentication = new TestingAuthenticationToken(principal, null);
        MockHttpServletResponse response = new MockHttpServletResponse();

        new OAuth2LoginSuccessHandler(userRepository, oAuthCodeService, frontendBaseUrl)
                .onAuthenticationSuccess(
                        new MockHttpServletRequest(),
                        response,
                        authentication);

        verify(oAuthCodeService).issueCode(user);
        return response.getRedirectedUrl();
    }
}

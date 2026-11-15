package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Custom success handler that generates a one-time code for frontend callback,
 * rather than returning JWT in the JSON response body.
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final OAuthCodeService oAuthCodeService;
    private final URI frontendBaseUri;

    public OAuth2LoginSuccessHandler(
            UserRepository userRepository,
            OAuthCodeService oAuthCodeService,
            @Value("${app.frontend.base-url:https://srh-codeverse.vercel.app}") String frontendBaseUrl) {
        this.userRepository = userRepository;
        this.oAuthCodeService = oAuthCodeService;
        this.frontendBaseUri = validateFrontendBaseUrl(frontendBaseUrl);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        String username = null;
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User oAuth2User) {
            username = oAuth2User.getAttribute("username");
            if (username == null || username.isBlank()) {
                username = oAuth2User.getName();
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            username = user.getUsername();
        }

        // Find the user
        String authenticatedUsername = username;
        User user = userRepository.findByUsername(authenticatedUsername)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found: " + authenticatedUsername));

        String code = oAuthCodeService.issueCode(user);

        // Redirect to frontend callback with the code (never JWT in URL)
        String origin = frontendBaseUri.getScheme() + "://" + frontendBaseUri.getRawAuthority();
        String callbackUrl = UriComponentsBuilder.fromUriString(origin)
                .path("/oauth/callback")
                .queryParam("code", "{code}")
                .encode()
                .buildAndExpand(code)
                .toUriString();
        getRedirectStrategy().sendRedirect(request, response, callbackUrl);
    }

    private URI validateFrontendBaseUrl(String frontendBaseUrl) {
        if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
            throw new IllegalStateException("Invalid OAuth frontend base URL configuration");
        }

        URI uri;
        try {
            uri = URI.create(frontendBaseUrl.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Invalid OAuth frontend base URL configuration");
        }

        String scheme = uri.getScheme();
        String host = uri.getHost();
        String path = uri.getPath();
        boolean localHost = "localhost".equalsIgnoreCase(host)
                || "127.0.0.1".equals(host)
                || "::1".equals(host)
                || "[::1]".equals(host);
        boolean validScheme = "https".equalsIgnoreCase(scheme)
                || ("http".equalsIgnoreCase(scheme) && localHost);
        boolean validPath = path == null || path.isEmpty() || "/".equals(path);

        if (!validScheme
                || host == null
                || uri.getRawUserInfo() != null
                || uri.getRawQuery() != null
                || uri.getRawFragment() != null
                || !validPath) {
            throw new IllegalStateException("Invalid OAuth frontend base URL configuration");
        }
        return uri;
    }
}
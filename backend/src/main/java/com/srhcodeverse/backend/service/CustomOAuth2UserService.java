package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.OAuthIdentity;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.OAuthIdentityRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.security.CustomUserDetails;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);
    private static final String GITHUB_EMAILS_URI = "https://api.github.com/user/emails";
    private static final String GITHUB_API_VERSION = "2022-11-28";
    private static final ParameterizedTypeReference<List<Map<String, Object>>> GITHUB_EMAILS_TYPE =
            new ParameterizedTypeReference<>() {};

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OAuthIdentityRepository oAuthIdentityRepository;
    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> providerUserService;
    private final RestClient restClient;

    @Autowired
    public CustomOAuth2UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            OAuthIdentityRepository oAuthIdentityRepository) {
        this(
                userRepository,
                roleRepository,
                oAuthIdentityRepository,
                new DefaultOAuth2UserService(),
                RestClient.builder().build());
    }

    CustomOAuth2UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            OAuthIdentityRepository oAuthIdentityRepository,
            OAuth2UserService<OAuth2UserRequest, OAuth2User> providerUserService) {
        this(
                userRepository,
                roleRepository,
                oAuthIdentityRepository,
                providerUserService,
                RestClient.builder().build());
    }

    CustomOAuth2UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            OAuthIdentityRepository oAuthIdentityRepository,
            OAuth2UserService<OAuth2UserRequest, OAuth2User> providerUserService,
            RestClient restClient) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.oAuthIdentityRepository = oAuthIdentityRepository;
        this.providerUserService = providerUserService;
        this.restClient = restClient;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {
        OAuth2User providerUser = providerUserService.loadUser(userRequest);
        String provider = userRequest.getClientRegistration().getRegistrationId();
        String providerUserId = providerUser.getName();
        Map<String, Object> attributes = providerUser.getAttributes();
        String githubEmail = "github".equals(provider) ? retrieveVerifiedGithubEmail(userRequest) : null;
        if ("github".equals(provider) && githubEmail == null) {
            throw authenticationError(
                    "invalid_user_info",
                    "OAuth sign-in could not be completed because a verified email could not be confirmed.");
        }

        String googleEmail = "google".equals(provider) ? extractGoogleEmail(attributes) : null;
        if ("google".equals(provider) && googleEmail == null) {
            throw authenticationError(
                    "invalid_user_info",
                    "OAuth sign-in could not be completed because a verified email could not be confirmed.");
        }

        Optional<OAuthIdentity> identity = oAuthIdentityRepository
                .findByProviderAndProviderUserId(provider, providerUserId);
        if (identity.isPresent()) {
            return toOAuth2User(identity.get().getUser(), attributes);
        }

        String email = "github".equals(provider) ? githubEmail : googleEmail;
        if (email == null) {
            throw authenticationError(
                    "invalid_user_info",
                    "OAuth sign-in could not be completed. The provider did not return the required account information.");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            logger.warn("OAuth account linking rejected for provider {}", provider);
            throw authenticationError(
                    "account_linking_required",
                    "OAuth sign-in could not be completed. Sign in to your existing account and explicitly link this provider first.");
        }

        Role studentRole = roleRepository.findByName("STUDENT").orElse(null);
        if (studentRole == null) {
            logger.error("OAuth account creation unavailable because the STUDENT role is missing");
            throw authenticationError("server_error", "Unable to complete sign-in. Please try again.");
        }

        User user = new User();
        user.setUsername(extractUsername(email));
        user.setEmail(email);
        user.setPasswordHash("");
        user.setRole(studentRole);

        OAuthIdentity newIdentity = new OAuthIdentity();
        newIdentity.setProvider(provider);
        newIdentity.setProviderUserId(providerUserId);

        try {
            user = userRepository.saveAndFlush(user);
            newIdentity.setUser(user);
            oAuthIdentityRepository.saveAndFlush(newIdentity);
        } catch (DataAccessException exception) {
            logger.warn(
                    "OAuth account persistence failed for provider {} ({})",
                    provider,
                    exception.getClass().getSimpleName());
            throw authenticationError("server_error", "Unable to complete sign-in. Please try again.");
        }

        return toOAuth2User(user, attributes);
    }

    private OAuth2User toOAuth2User(User user, Map<String, Object> attributes) {
        Map<String, Object> principalAttributes = new HashMap<>(attributes);
        principalAttributes.put("username", user.getUsername());
        return new DefaultOAuth2User(
                new CustomUserDetails(user).getAuthorities(),
                principalAttributes,
                "username");
    }

    private String extractGoogleEmail(Map<String, Object> attributes) {
        Object email = attributes.get("email");
        Object emailVerified = attributes.get("email_verified");
        if (email instanceof String verifiedEmail
                && !verifiedEmail.isBlank()
                && Boolean.TRUE.equals(emailVerified)) {
            return verifiedEmail;
        }
        return null;
    }

    private String retrieveVerifiedGithubEmail(OAuth2UserRequest userRequest) {
        List<Map<String, Object>> emails;
        try {
            emails = restClient.get()
                    .uri(GITHUB_EMAILS_URI)
                    .header(
                            HttpHeaders.AUTHORIZATION,
                            "Bearer " + userRequest.getAccessToken().getTokenValue())
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .header(HttpHeaders.USER_AGENT, "SRH-CodeVerse")
                    .header("X-GitHub-Api-Version", GITHUB_API_VERSION)
                    .retrieve()
                    .body(GITHUB_EMAILS_TYPE);
        } catch (RestClientException exception) {
            logger.warn(
                    "GitHub verified-email lookup failed ({})",
                    exception.getClass().getSimpleName());
            throw authenticationError(
                    "invalid_user_info",
                    "OAuth sign-in could not be completed because a verified email could not be confirmed.");
        }

        if (emails == null) {
            return null;
        }

        String verifiedEmail = null;
        for (Map<String, Object> entry : emails) {
            if (entry == null || !Boolean.TRUE.equals(entry.get("verified"))) {
                continue;
            }
            Object emailValue = entry.get("email");
            if (!(emailValue instanceof String email) || email.isBlank()) {
                continue;
            }
            if (Boolean.TRUE.equals(entry.get("primary"))) {
                return email;
            }
            if (verifiedEmail == null) {
                verifiedEmail = email;
            }
        }
        return verifiedEmail;
    }

    private String extractUsername(String email) {
        return email.substring(0, email.indexOf('@'));
    }

    private OAuth2AuthenticationException authenticationError(String code, String description) {
        return new OAuth2AuthenticationException(new OAuth2Error(code, description, null));
    }
}

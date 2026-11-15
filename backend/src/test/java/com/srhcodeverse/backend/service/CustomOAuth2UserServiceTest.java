package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.OAuthIdentity;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.OAuthIdentityRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CustomOAuth2UserServiceTest {

    @Test
    void loadsExistingGoogleIdentityByProviderAndId() {
        Fixture fixture = new Fixture();
        User localUser = user("google-local", "google-local@example.test", "TRAINER");
        fixture.addIdentity("google", "google-id", localUser);

        OAuth2User principal = fixture.service("google", attributes("google", "google-id", null))
                .loadUser(request("google"));

        assertEquals("google-local", principal.getName());
        assertTrue(principal.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_TRAINER")));
        assertTrue(fixture.savedUsers.isEmpty());
        assertTrue(fixture.savedIdentities.isEmpty());
    }

    @Test
    void loadsExistingGithubIdentityByProviderAndId() {
        Fixture fixture = new Fixture();
        User localUser = user("github-local", "github-local@example.test", "STUDENT");
        fixture.addIdentity("github", "github-id", localUser);
        RestClientSetup githubApi = githubApiResponse(
                "[{\"email\":\"github-verified@example.test\",\"primary\":true,\"verified\":true}]");

        OAuth2User principal = fixture.service(
                        "github",
                        attributes("github", "github-id", null),
                        githubApi.restClient)
                .loadUser(request("github"));

        assertEquals("github-local", principal.getName());
        assertTrue(principal.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_STUDENT")));
        assertTrue(fixture.savedUsers.isEmpty());
        assertTrue(fixture.savedIdentities.isEmpty());
        githubApi.server.verify();
    }

    @Test
    void createsNewGoogleAccountWithStudentRoleAndIdentity() {
        Fixture fixture = new Fixture();
        String email = "google-new@example.test";

        OAuth2User principal = fixture.service("google", attributes("google", "google-new-id", email))
                .loadUser(request("google"));

        assertEquals("google-new", principal.getName());
        assertEquals(Boolean.TRUE, principal.getAttribute("email_verified"));
        assertEquals(1, fixture.savedUsers.size());
        assertEquals("STUDENT", fixture.savedUsers.getFirst().getRole().getName());
        assertEquals("google", fixture.savedIdentities.getFirst().getProvider());
        assertEquals("google-new-id", fixture.savedIdentities.getFirst().getProviderUserId());
        assertEquals(fixture.savedUsers.getFirst(), fixture.savedIdentities.getFirst().getUser());
    }

    @Test
    void createsNewGithubAccountWithStudentRoleAndIdentity() {
        Fixture fixture = new Fixture();
        String email = "github-new@example.test";
        RestClientSetup githubApi = githubApiResponse(
                "[{\"email\":\"unverified@example.test\",\"primary\":true,\"verified\":false},"
                        + "{\"email\":\"github-secondary@example.test\",\"primary\":false,\"verified\":true},"
                        + "{\"email\":\"github-new@example.test\",\"primary\":true,\"verified\":true}]");

        OAuth2User principal = fixture.service(
                        "github",
                        attributes("github", "github-new-id", "untrusted-profile@example.test"),
                        githubApi.restClient)
                .loadUser(request("github"));

        assertEquals("github-new", principal.getName());
        assertEquals(1, fixture.savedUsers.size());
        assertEquals(email, fixture.savedUsers.getFirst().getEmail());
        assertEquals("STUDENT", fixture.savedUsers.getFirst().getRole().getName());
        assertEquals("github", fixture.savedIdentities.getFirst().getProvider());
        assertEquals("github-new-id", fixture.savedIdentities.getFirst().getProviderUserId());
        assertEquals(fixture.savedUsers.getFirst(), fixture.savedIdentities.getFirst().getUser());
        githubApi.server.verify();
    }

    @Test
    void selectsVerifiedNonPrimaryGithubEmailWhenNoVerifiedPrimaryExists() {
        Fixture fixture = new Fixture();
        String verifiedEmail = "verified-secondary@example.test";
        RestClientSetup githubApi = githubApiResponse(
                "[{\"email\":\"unverified-primary@example.test\",\"primary\":true,\"verified\":false},"
                        + "{\"email\":\"verified-secondary@example.test\",\"primary\":false,\"verified\":true}]");

        fixture.service(
                        "github",
                        attributes("github", "github-secondary-id", "profile@example.test"),
                        githubApi.restClient)
                .loadUser(request("github"));

        assertEquals(verifiedEmail, fixture.savedUsers.getFirst().getEmail());
        githubApi.server.verify();
    }

    @Test
    void rejectsGithubWhenEmailListContainsOnlyUnverifiedAddresses() {
        assertGithubEmailListRejected(
                "[{\"email\":\"unverified@example.test\",\"primary\":true,\"verified\":false}]");
    }

    @Test
    void rejectsGithubWhenEmailListIsMissing() {
        assertGithubEmailListRejected("[]");
    }

    @Test
    void handlesGithubApiFailureWithSafeAuthenticationError() {
        Fixture fixture = new Fixture();
        RestClientSetup githubApi = githubApiFailure();

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> fixture.service(
                                "github",
                                attributes("github", "github-api-failure", "profile@example.test"),
                                githubApi.restClient)
                        .loadUser(request("github")));

        assertEquals("invalid_user_info", exception.getError().getErrorCode());
        assertFalse(exception.getMessage().contains("provider-private-response"));
        assertFalse(exception.getMessage().contains("test-access-token"));
        assertTrue(fixture.savedUsers.isEmpty());
        assertTrue(fixture.savedIdentities.isEmpty());
        githubApi.server.verify();
    }

    @Test
    void rejectsUnverifiedGoogleEmail() {
        Fixture fixture = new Fixture();
        Map<String, Object> googleAttributes =
                attributes("google", "google-unverified-id", "unverified-google@example.test");
        googleAttributes.put("email_verified", Boolean.FALSE);

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> fixture.service("google", googleAttributes).loadUser(request("google")));

        assertEquals("invalid_user_info", exception.getError().getErrorCode());
        assertTrue(fixture.savedUsers.isEmpty());
        assertTrue(fixture.savedIdentities.isEmpty());
    }

    @Test
    void doesNotAutomaticallyLinkPasswordAccountByEmail() {
        Fixture fixture = new Fixture();
        String email = "existing-password@example.test";
        fixture.addUser(user("password-user", email, "STUDENT"));

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> fixture.service("google", attributes("google", "new-google-id", email))
                        .loadUser(request("google")));

        assertEquals("account_linking_required", exception.getError().getErrorCode());
        assertFalse(exception.getError().getDescription().contains(email));
        assertTrue(fixture.savedUsers.isEmpty());
        assertTrue(fixture.savedIdentities.isEmpty());
    }

    @Test
    void preservesExistingUserRoleWhenIdentityIsLinked() {
        Fixture fixture = new Fixture();
        User localUser = user("trainer-account", "trainer@example.test", "TRAINER");
        fixture.addIdentity("google", "trainer-google-id", localUser);

        OAuth2User principal = fixture.service(
                "google",
                attributes("google", "trainer-google-id", "different-provider-email@example.test"))
                .loadUser(request("google"));

        assertTrue(principal.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_TRAINER")));
        assertEquals("TRAINER", localUser.getRole().getName());
        assertTrue(fixture.savedUsers.isEmpty());
    }

    @Test
    void rejectsDuplicateIdentityPersistenceWithoutLeakingDatabaseDetails() {
        Fixture fixture = new Fixture();
        fixture.duplicateIdentityOnSave = true;
        String email = "duplicate@example.test";
        RestClientSetup githubApi = githubApiResponse(
                "[{\"email\":\"duplicate@example.test\",\"primary\":true,\"verified\":true}]");

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> fixture.service(
                                "github",
                                attributes("github", "duplicate-id", email),
                                githubApi.restClient)
                        .loadUser(request("github")));

        assertEquals("server_error", exception.getError().getErrorCode());
        assertFalse(exception.getMessage().contains(email));
        assertFalse(exception.getMessage().contains("database constraint"));
        assertTrue(fixture.savedIdentities.isEmpty());
        githubApi.server.verify();
    }

    private static User user(String username, String email, String roleName) {
        return User.builder()
                .id(1L)
                .username(username)
                .email(email)
                .passwordHash("existing-hash")
                .role(Role.builder().id(1L).name(roleName).build())
                .build();
    }

    private static Map<String, Object> attributes(String provider, String providerUserId, String email) {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put(provider.equals("google") ? "sub" : "id", providerUserId);
        if (email != null) {
            attributes.put("email", email);
        }
        if (provider.equals("google")) {
            attributes.put("email_verified", Boolean.TRUE);
        }
        return attributes;
    }

    private static OAuth2UserRequest request(String provider) {
        String nameAttribute = provider.equals("google") ? "sub" : "id";
        ClientRegistration registration = ClientRegistration
                .withRegistrationId(provider)
                .clientId("test-client")
                .clientSecret("test-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost/callback")
                .scope("email")
                .authorizationUri("https://provider.test/authorize")
                .tokenUri("https://provider.test/token")
                .userInfoUri("https://provider.test/user")
                .userNameAttributeName(nameAttribute)
                .clientName(provider)
                .build();
        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER,
                "test-access-token",
                Instant.now(),
                Instant.now().plusSeconds(300));
        return new OAuth2UserRequest(registration, accessToken);
    }

    private static void assertGithubEmailListRejected(String responseBody) {
        Fixture fixture = new Fixture();
        RestClientSetup githubApi = githubApiResponse(responseBody);

        OAuth2AuthenticationException exception = assertThrows(
                OAuth2AuthenticationException.class,
                () -> fixture.service(
                                "github",
                                attributes("github", "github-no-verified-email", "untrusted@example.test"),
                                githubApi.restClient)
                        .loadUser(request("github")));

        assertEquals("invalid_user_info", exception.getError().getErrorCode());
        assertFalse(exception.getMessage().contains("untrusted@example.test"));
        assertTrue(fixture.savedUsers.isEmpty());
        assertTrue(fixture.savedIdentities.isEmpty());
        githubApi.server.verify();
    }

    private static RestClientSetup githubApiResponse(String responseBody) {
        return githubApi(responseBody, HttpStatus.OK);
    }

    private static RestClientSetup githubApiFailure() {
        return githubApi("provider-private-response", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private static RestClientSetup githubApi(String responseBody, HttpStatus status) {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://api.github.com/user/emails"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-access-token"))
                .andExpect(header("X-GitHub-Api-Version", "2022-11-28"))
                .andRespond(status.is2xxSuccessful()
                        ? withSuccess(responseBody, MediaType.APPLICATION_JSON)
                        : withStatus(status).body(responseBody));
        return new RestClientSetup(builder.build(), server);
    }

    private static OAuth2User providerUser(OAuth2UserRequest request, Map<String, Object> attributes) {
        String nameAttribute = request.getClientRegistration().getProviderDetails()
                .getUserInfoEndpoint().getUserNameAttributeName();
        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_PROVIDER")),
                attributes,
                nameAttribute);
    }

    private record RestClientSetup(RestClient restClient, MockRestServiceServer server) {}

    private static final class Fixture {
        private final Role studentRole = Role.builder().id(2L).name("STUDENT").build();
        private final Map<String, User> usersByEmail = new HashMap<>();
        private final Map<String, OAuthIdentity> identities = new HashMap<>();
        private final List<User> savedUsers = new ArrayList<>();
        private final List<OAuthIdentity> savedIdentities = new ArrayList<>();
        private boolean duplicateIdentityOnSave;

        private final UserRepository userRepository = repository(UserRepository.class, (method, args) -> {
            if (method.getName().equals("findByEmail")) {
                return Optional.ofNullable(usersByEmail.get(args[0]));
            }
            if (method.getName().equals("saveAndFlush")) {
                User user = (User) args[0];
                user.setId((long) savedUsers.size() + 10);
                savedUsers.add(user);
                usersByEmail.put(user.getEmail(), user);
                return user;
            }
            throw new UnsupportedOperationException(method.getName());
        });

        private final RoleRepository roleRepository = repository(RoleRepository.class, (method, args) ->
                method.getName().equals("findByName")
                        ? "STUDENT".equals(args[0]) ? Optional.of(studentRole) : Optional.empty()
                        : throwUnsupported(method));

        private final OAuthIdentityRepository identityRepository =
                repository(OAuthIdentityRepository.class, (method, args) -> {
                    if (method.getName().equals("findByProviderAndProviderUserId")) {
                        return Optional.ofNullable(identities.get(key((String) args[0], (String) args[1])));
                    }
                    if (method.getName().equals("saveAndFlush")) {
                        if (duplicateIdentityOnSave) {
                            throw new DataIntegrityViolationException("database constraint detail");
                        }
                        OAuthIdentity identity = (OAuthIdentity) args[0];
                        savedIdentities.add(identity);
                        identities.put(key(identity.getProvider(), identity.getProviderUserId()), identity);
                        return identity;
                    }
                    throw new UnsupportedOperationException(method.getName());
                });

        private CustomOAuth2UserService service(String provider, Map<String, Object> attributes) {
            return service(provider, attributes, RestClient.builder().build());
        }

        private CustomOAuth2UserService service(
                String provider,
                Map<String, Object> attributes,
                RestClient restClient) {
            OAuth2UserService<OAuth2UserRequest, OAuth2User> providerService =
                    request -> providerUser(request, attributes);
            return new CustomOAuth2UserService(
                    userRepository,
                    roleRepository,
                    identityRepository,
                    providerService,
                    restClient);
        }

        private void addUser(User user) {
            usersByEmail.put(user.getEmail(), user);
        }

        private void addIdentity(String provider, String providerUserId, User user) {
            OAuthIdentity identity = OAuthIdentity.builder()
                    .provider(provider)
                    .providerUserId(providerUserId)
                    .user(user)
                    .build();
            identities.put(key(provider, providerUserId), identity);
        }
    }

    private static String key(String provider, String providerUserId) {
        return provider + ":" + providerUserId;
    }

    private static Object throwUnsupported(Method method) {
        throw new UnsupportedOperationException(method.getName());
    }

    private static <T> T repository(Class<T> type, RepositoryMethod handler) {
        return type.cast(Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class<?>[] { type },
                (proxy, method, args) -> {
                    if (method.getDeclaringClass() == Object.class) {
                        return switch (method.getName()) {
                            case "toString" -> type.getSimpleName() + " test proxy";
                            case "hashCode" -> System.identityHashCode(proxy);
                            case "equals" -> proxy == args[0];
                            default -> throw new UnsupportedOperationException(method.getName());
                        };
                    }
                    return handler.invoke(method, args);
                }));
    }

    @FunctionalInterface
    private interface RepositoryMethod {
        Object invoke(Method method, Object[] args) throws Throwable;
    }
}

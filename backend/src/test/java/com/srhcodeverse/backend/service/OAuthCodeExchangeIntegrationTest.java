package com.srhcodeverse.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.OAuthCode;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.OAuthCodeRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.security.JwtUtil;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Enumeration;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.util.UriComponentsBuilder;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class OAuthCodeExchangeIntegrationTest {

    @Autowired
    private OAuthCodeService oAuthCodeService;

    @Autowired
    private OAuthCodeRepository oAuthCodeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    @Value("${local.server.port}")
    private int port;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:oauthcodetest");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
        registry.add("jwt.secret", () -> UUID.randomUUID().toString());
        registry.add("jwt.expiration-ms", () -> "3600000");
        registry.add("spring.security.oauth2.client.registration.google.client-id", () -> "test-google-client-id");
        registry.add("spring.security.oauth2.client.registration.google.client-secret", () -> "test-google-client-secret");
        registry.add("spring.security.oauth2.client.registration.github.client-id", () -> "test-github-client-id");
        registry.add("spring.security.oauth2.client.registration.github.client-secret", () -> "test-github-client-secret");
    }

    @Test
    void validCodeReturnsNormalAuthResponseFromPublicExchangeEndpoint() throws Exception {
        User user = createUser();
        String rawCode = oAuthCodeService.issueCode(user);

        HttpResponse<String> response = postExchangeCode(rawCode);

        assertEquals(200, response.statusCode());
        var authResponse = objectMapper.readTree(response.body());
        assertEquals(user.getUsername(), authResponse.get("username").asText());
        assertEquals("STUDENT", authResponse.get("role").asText());
        assertEquals(user.getUsername(), jwtUtil.extractUsername(authResponse.get("token").asText()));
    }

    @Test
    void expiredCodeIsRejected() {
        User user = createUser();
        String rawCode = OAuthCode.generateCode();
        saveCode(rawCode, user, LocalDateTime.now().minusSeconds(1));

        assertTrue(oAuthCodeService.exchangeCode(rawCode).isEmpty());
    }

    @Test
    void invalidCodeIsRejected() throws Exception {
        String rawCode = OAuthCode.generateCode();

        assertTrue(oAuthCodeService.exchangeCode(rawCode).isEmpty());
        HttpResponse<String> response = postExchangeCode(rawCode);
        assertEquals(401, response.statusCode());
        assertTrue(response.body().contains("Invalid or expired OAuth code"));
    }

    @Test
    void missingCodeIsRejectedAsBadRequest() throws Exception {
        HttpResponse<String> response = postExchangeBody("{}");

        assertEquals(400, response.statusCode());
        assertTrue(response.body().contains("Code is required"));
    }

    @Test
    void codeCanBeExchangedOnlyOnce() {
        String rawCode = oAuthCodeService.issueCode(createUser());

        assertTrue(oAuthCodeService.exchangeCode(rawCode).isPresent());
        assertTrue(oAuthCodeService.exchangeCode(rawCode).isEmpty());
    }

    @Test
    void concurrentRequestsCannotBothConsumeTheSameCode() throws Exception {
        String rawCode = oAuthCodeService.issueCode(createUser());
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Future<Boolean> first = executor.submit(() -> tryExchange(rawCode, ready, start));
            Future<Boolean> second = executor.submit(() -> tryExchange(rawCode, ready, start));
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            assertNotEquals(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void onlyTheHashOfAnIssuedRawCodeIsStored() {
        String rawCode = oAuthCodeService.issueCode(createUser());
        String expectedHash = OAuthCode.hashCodeFor(rawCode);

        OAuthCode storedCode = oAuthCodeRepository.findByCodeHash(expectedHash).orElseThrow();

        assertEquals(expectedHash, storedCode.getCodeHash());
        assertNotEquals(rawCode, storedCode.getCodeHash());
        assertTrue(oAuthCodeRepository.findByCodeHash(rawCode).isEmpty());
        assertEquals(60, java.time.Duration.between(storedCode.getCreatedAt(), storedCode.getExpiryAt()).getSeconds());
    }

    @Test
    void productionFrontendCanPreflightOAuthCodeExchangePost() throws Exception {
        mockMvc.perform(options("/api/auth/oauth/exchange-code")
                        .header("Origin", "https://srh-codeverse.vercel.app")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin",
                        "https://srh-codeverse.vercel.app"))
                .andExpect(header().string(
                        "Access-Control-Allow-Methods",
                        containsString("POST")))
                .andExpect(header().string(
                        "Access-Control-Allow-Headers",
                        containsString("content-type")))
                .andExpect(header().string(
                        "Access-Control-Allow-Headers",
                        containsString("authorization")));
    }

    @Test
    void oauthStateIsSessionBackedAndInvalidStateCannotConsumeTheAuthorizationRequest()
            throws Exception {
        MvcResult initiation = mockMvc.perform(get("/api/auth/login/oauth2/google"))
                .andExpect(status().is3xxRedirection())
                .andReturn();

        MockHttpSession session = (MockHttpSession) initiation.getRequest().getSession(false);
        assertNotNull(session);
        OAuth2AuthorizationRequest authorizationRequest = findAuthorizationRequest(session);
        assertNotNull(authorizationRequest);
        String location = initiation.getResponse().getRedirectedUrl();
        String encodedState = UriComponentsBuilder.fromUriString(location)
                .build()
                .getQueryParams()
                .getFirst("state");
        assertNotNull(encodedState);
        String state = URLDecoder.decode(encodedState, StandardCharsets.UTF_8);
        assertEquals(authorizationRequest.getState(), state);

        mockMvc.perform(get("/login/oauth2/code/google")
                        .session(session)
                        .param("state", "invalid-state")
                        .param("error", "access_denied"))
                .andExpect(status().is3xxRedirection());
        assertEquals(authorizationRequest, findAuthorizationRequest(session));

        mockMvc.perform(get("/login/oauth2/code/google")
                        .session(session)
                        .param("state", state)
                        .param("error", "access_denied"))
                .andExpect(status().is3xxRedirection());
        assertTrue(findAuthorizationRequest(session) == null);
    }

    private OAuth2AuthorizationRequest findAuthorizationRequest(MockHttpSession session) {
        Enumeration<String> attributeNames = session.getAttributeNames();
        while (attributeNames.hasMoreElements()) {
            Object value = session.getAttribute(attributeNames.nextElement());
            if (value instanceof OAuth2AuthorizationRequest authorizationRequest) {
                return authorizationRequest;
            }
        }
        return null;
    }

    private boolean tryExchange(String rawCode, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        if (!start.await(5, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Concurrent test did not start");
        }
        return oAuthCodeService.exchangeCode(rawCode).isPresent();
    }

    private HttpResponse<String> postExchangeCode(String rawCode) throws Exception {
        return postExchangeBody("{\"code\":\"" + rawCode + "\"}");
    }

    private HttpResponse<String> postExchangeBody(String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/auth/oauth/exchange-code"))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    }

    private User createUser() {
        Role studentRole = roleRepository.findByName("STUDENT").orElseThrow();
        String uniqueSuffix = UUID.randomUUID().toString();
        User user = User.builder()
                .username("oauth-code-" + uniqueSuffix)
                .email("oauth-code-" + uniqueSuffix + "@example.test")
                .passwordHash("not-a-password")
                .role(studentRole)
                .build();
        return userRepository.saveAndFlush(user);
    }

    private void saveCode(String rawCode, User user, LocalDateTime expiryAt) {
        oAuthCodeRepository.saveAndFlush(OAuthCode.builder()
                .codeHash(OAuthCode.hashCodeFor(rawCode))
                .createdAt(LocalDateTime.now())
                .expiryAt(expiryAt)
                .consumed(false)
                .expired(false)
                .user(user)
                .build());
    }
}

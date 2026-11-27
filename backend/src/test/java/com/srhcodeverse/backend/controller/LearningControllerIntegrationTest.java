package com.srhcodeverse.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end coverage for the Learning Path HTTP API: security, controller
 * mappings, seeded catalog, per-user progress, bookmarks, notes and
 * recommendations. This catches route or wiring regressions that service-level
 * tests cannot see.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class LearningControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private JwtUtil jwtUtil;

    private String token;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:learningcontroller");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
        registry.add("jwt.secret", () -> UUID.randomUUID().toString());
        registry.add("jwt.expiration-ms", () -> "3600000");
        registry.add("spring.security.oauth2.client.registration.google.client-id", () -> "test-google-client-id");
        registry.add("spring.security.oauth2.client.registration.google.client-secret", () -> "test-google-client-secret");
        registry.add("spring.security.oauth2.client.registration.github.client-id", () -> "test-github-client-id");
        registry.add("spring.security.oauth2.client.registration.github.client-secret", () -> "test-github-client-secret");
    }

    @BeforeEach
    void createStudent() {
        Role role = roleRepository.findByName("STUDENT")
                .orElseGet(() -> roleRepository.save(Role.builder().name("STUDENT").build()));
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = userRepository.save(User.builder()
                .username("controller_" + suffix)
                .email("controller_" + suffix + "@test.dev")
                .passwordHash("not-used-in-tests")
                .role(role)
                .build());
        token = jwtUtil.generateToken(user.getUsername(), "STUDENT");
    }

    private JsonNode getJson(String path) throws Exception {
        String body = mockMvc.perform(get(path).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body);
    }

    @Test
    void learningReadEndpointsReturnRealSeededData() throws Exception {
        JsonNode catalog = getJson("/api/learning/courses");
        assertTrue(catalog.get("items").isArray());
        assertTrue(catalog.get("items").size() > 0);

        JsonNode detail = getJson("/api/learning/courses/java-foundations");
        assertTrue(detail.get("modules").size() > 0);
        long lessonId = detail.get("modules").get(0).get("lessons").get(0).get("id").asLong();

        JsonNode lesson = getJson("/api/learning/lessons/" + lessonId);
        assertEquals(lessonId, lesson.get("id").asLong());
        assertTrue(lesson.get("lessonContent").asText().length() > 0);
        assertTrue(lesson.get("quiz").asText().length() > 0);

        assertEquals(0, getJson("/api/learning/my").get("total").asInt());
        assertEquals(0, getJson("/api/learning/progress").get("enrolledCourses").asInt());
        assertEquals(0, getJson("/api/learning/bookmarks").get("total").asInt());
        assertEquals("RULE_BASED",
                getJson("/api/learning/recommendations").get("engine").asText());
    }

    @Test
    void learningMutationsPersistAndRecommendationLinksUseLearningPathRoutes() throws Exception {
        JsonNode detail = getJson("/api/learning/courses/java-foundations");
        long lessonId = detail.get("modules").get(0).get("lessons").get(0).get("id").asLong();

        mockMvc.perform(post("/api/learning/courses/java-foundations/enroll")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        String completedBody = mockMvc.perform(post("/api/learning/lessons/" + lessonId + "/complete")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(objectMapper.readTree(completedBody).get("completed").asBoolean());

        mockMvc.perform(post("/api/learning/lessons/" + lessonId + "/bookmark")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/learning/lessons/" + lessonId + "/note")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"review this\"}"))
                .andExpect(status().isOk());

        JsonNode progress = getJson("/api/learning/progress");
        assertEquals(1, progress.get("enrolledCourses").asInt());
        assertEquals(1, progress.get("completedLessons").asInt());
        assertEquals(1, progress.get("bookmarks").asInt());
        assertEquals(1, getJson("/api/learning/bookmarks").get("total").asInt());
        assertEquals("review this",
                getJson("/api/learning/lessons/" + lessonId).get("note").asText());

        JsonNode recommendations = getJson("/api/learning/recommendations");
        boolean learningPathLink = false;
        for (JsonNode item : recommendations.get("items")) {
            if (item.hasNonNull("href")
                    && item.get("href").asText().startsWith("/learning-path/")) {
                learningPathLink = true;
            }
        }
        assertTrue(learningPathLink, "recommendations should link into the Learning Path routes");
    }

    @Test
    void unknownRouteAndUnsupportedMethodReturnSpecificClientErrors() throws Exception {
        mockMvc.perform(get("/api/learning/does-not-exist")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/learning/courses")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isMethodNotAllowed());
    }
}

package com.srhcodeverse.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.CourseRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.security.JwtUtil;
import com.srhcodeverse.backend.service.RazorpayGateway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:approvedpricing;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "jwt.secret=approved-pricing-test-secret-key",
        "spring.security.oauth2.client.registration.google.client-id=test",
        "spring.security.oauth2.client.registration.google.client-secret=test",
        "spring.security.oauth2.client.registration.github.client-id=test",
        "spring.security.oauth2.client.registration.github.client-secret=test",
        "codeverse.content.seed-on-startup=true",
        "payment.razorpay.key-id=rzp_test_local",
        "payment.razorpay.key-secret=local_test_secret"
})
class ApprovedCoursePricingIntegrationTest {

    private static final Map<String, String> PAID = Map.of(
            "java-foundations", "299",
            "dsa-essentials", "349",
            "spring-boot-backend", "399",
            "fullstack-projects", "449");

    private static final java.util.List<String> FREE = java.util.List.of(
            "sql-mastery", "react-frontend", "job-preparation",
            "java-programming", "python-programming", "javascript", "html-css", "react-js",
            "sql-mysql", "spring-boot", "data-structures-algorithms", "git-github",
            "full-stack-web-development");

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CourseRepository courseRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean
    private RazorpayGateway razorpayGateway;

    private String studentToken() {
        Role role = roleRepository.findByName("STUDENT")
                .orElseGet(() -> roleRepository.save(Role.builder().name("STUDENT").build()));
        String username = "student_" + UUID.randomUUID().toString().substring(0, 8);
        userRepository.save(User.builder().username(username).email(username + "@test.dev")
                .passwordHash("x").role(role).build());
        return "Bearer " + jwtUtil.generateToken(username, "STUDENT");
    }

    @Test
    void seededCoursesCarryExactlyTheApprovedPricing() {
        for (Map.Entry<String, String> entry : PAID.entrySet()) {
            Course course = courseRepository.findBySlug(entry.getKey()).orElseThrow();
            assertEquals("PAID", course.getCourseType(), entry.getKey());
            assertEquals(0, new BigDecimal(entry.getValue()).compareTo(course.getPrice()), entry.getKey());
            assertEquals("INR", course.getCurrency(), entry.getKey());
        }
        for (String slug : FREE) {
            Course course = courseRepository.findBySlug(slug).orElseThrow();
            assertEquals("FREE", course.getCourseType(), slug);
            assertEquals(0, BigDecimal.ZERO.compareTo(course.getPrice()), slug);
            assertEquals("INR", course.getCurrency(), slug);
        }
    }

    @Test
    void listAndDetailEndpointsUseBackendPricing() throws Exception {
        String body = mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode list = objectMapper.readTree(body);
        JsonNode javaFoundations = null;
        for (JsonNode item : list) {
            if ("java-foundations".equals(item.get("slug").asText())) javaFoundations = item;
        }
        assertNotNull(javaFoundations);
        assertEquals("PAID", javaFoundations.get("courseType").asText());
        assertEquals(299, javaFoundations.get("price").asInt());
        assertEquals("INR", javaFoundations.get("currency").asText());
        assertTrue(javaFoundations.get("paid").asBoolean());

        String detail = mockMvc.perform(get("/api/courses/sql-mastery"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode sql = objectMapper.readTree(detail);
        assertEquals("FREE", sql.get("courseType").asText());
        assertEquals(0, sql.get("price").asInt());
        assertFalse(sql.get("paid").asBoolean());
    }

    @Test
    void freeEnrollmentWorksAndPaidCourseStaysLockedWithoutPayment() throws Exception {
        String token = studentToken();
        mockMvc.perform(post("/api/courses/sql-mastery/enroll").header("Authorization", token))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/courses/java-foundations/enroll").header("Authorization", token))
                .andExpect(status().isPaymentRequired());

        String detail = mockMvc.perform(get("/api/courses/sql-mastery").header("Authorization", token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(objectMapper.readTree(detail).get("lessons").size() > 0);
    }

    @Test
    void paymentOrderAmountMatchesApprovedPaiseAmount() throws Exception {
        when(razorpayGateway.createOrder(anyLong(), anyString(), anyString()))
                .thenReturn("order_java_foundations");
        String token = studentToken();
        String body = mockMvc.perform(post("/api/payments/orders")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"java-foundations\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode order = objectMapper.readTree(body);
        assertEquals(29900, order.get("amountPaise").asInt());
        assertEquals("INR", order.get("currency").asText());
        assertEquals("rzp_test_local", order.get("keyId").asText());
    }
}

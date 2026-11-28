package com.srhcodeverse.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.CourseLessonRepository;
import com.srhcodeverse.backend.repository.CourseRepository;
import com.srhcodeverse.backend.repository.PaymentOrderRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.security.JwtUtil;
import com.srhcodeverse.backend.service.RazorpayGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP-level coverage for the paid/free course marketplace: legacy free
 * enrollment, paid-course gating, price validation, admin authorization,
 * thumbnails and server-side payment verification (with test-only credentials).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:coursemarketplace;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "jwt.secret=marketplace-test-secret-key-do-not-use-in-prod",
        "spring.security.oauth2.client.registration.google.client-id=test-google",
        "spring.security.oauth2.client.registration.google.client-secret=test-google-secret",
        "spring.security.oauth2.client.registration.github.client-id=test-github",
        "spring.security.oauth2.client.registration.github.client-secret=test-github-secret",
        "payment.razorpay.key-id=rzp_test_public_key",
        "payment.razorpay.key-secret=test_key_secret",
        "payment.razorpay.webhook-secret=test_webhook_secret"
})
class CourseMarketplaceIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private CourseLessonRepository courseLessonRepository;
    @Autowired private PaymentOrderRepository paymentOrderRepository;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean
    private RazorpayGateway razorpayGateway;

    private String studentToken;
    private String trainerToken;

    @BeforeEach
    void setUp() {
        studentToken = tokenFor("STUDENT");
        trainerToken = tokenFor("TRAINER");
    }

    private String tokenFor(String roleName) {
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
        String username = roleName.toLowerCase() + "_" + UUID.randomUUID().toString().substring(0, 8);
        userRepository.save(User.builder()
                .username(username)
                .email(username + "@test.dev")
                .passwordHash("not-used-in-tests")
                .role(role)
                .build());
        return jwtUtil.generateToken(username, roleName);
    }

    private String auth(String token) {
        return "Bearer " + token;
    }

    private String paidCoursePayload(String slug, String courseType, String price) {
        return """
                {
                  "slug": "%s",
                  "title": "Paid Java Masterclass",
                  "shortDescription": "A paid course used for access-control tests",
                  "detailedDescription": "Detailed description",
                  "category": "Programming",
                  "difficulty": "Intermediate",
                  "level": "Intermediate",
                  "thumbnail": "/course-thumbnails/java-programming.svg",
                  "courseType": "%s",
                  "price": %s,
                  "currency": "INR"
                }
                """.formatted(slug, courseType, price);
    }

    private void createCourse(String payload, String token) throws Exception {
        mockMvc.perform(post("/api/trainer/courses")
                        .header("Authorization", auth(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());
    }

    private String hmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : raw) hex.append(String.format("%02x", b & 0xff));
        return hex.toString();
    }

    @Test
    void freeCourseEnrollmentAndProgressRemainCompatible() throws Exception {
        mockMvc.perform(post("/api/courses/sql-mastery/enroll")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paid").value(false))
                .andExpect(jsonPath("$.eligible").value(true));

        JsonNode detail = objectMapper.readTree(mockMvc.perform(get("/api/courses/sql-mastery")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertTrue(detail.get("lessons").size() > 0);

        long lessonId = detail.get("lessons").get(0).get("id").asLong();
        mockMvc.perform(post("/api/courses/sql-mastery/progress")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lessonId\":" + lessonId + ",\"completed\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progressPercent").value(org.hamcrest.Matchers.greaterThan(0)));
    }

    @Test
    void paidCourseRequiresVerifiedPaymentBeforeEnrollment() throws Exception {
        createCourse(paidCoursePayload("paid-java", "PAID", "499"), trainerToken);
        Course paid = courseRepository.findBySlug("paid-java").orElseThrow();
        courseLessonRepository.save(CourseLesson.builder()
                .course(paid)
                .moduleName("Module 1")
                .moduleOrder(1)
                .lessonOrder(1)
                .title("Paid lesson")
                .description("A lesson that must stay locked")
                .lessonContent("SECRET LESSON CONTENT")
                .build());

        JsonNode detail = objectMapper.readTree(mockMvc.perform(get("/api/courses/paid-java")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertEquals("PAID", detail.get("courseType").asText());
        assertEquals(499, detail.get("price").asInt());
        assertEquals("INR", detail.get("currency").asText());
        assertTrue(detail.get("eligible").asBoolean() == false);
        assertTrue(detail.get("lessons").get(0).get("lessonContent").isNull());

        mockMvc.perform(post("/api/courses/paid-java/enroll")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isPaymentRequired());

        JsonNode order = objectMapper.readTree(mockMvc.perform(post("/api/payments/orders")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"paid-java\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String orderId = order.get("orderId").asText();
        assertNotNull(orderId);
        assertEquals("rzp_test_public_key", order.get("keyId").asText());

        mockMvc.perform(post("/api/payments/verify")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":\"" + orderId + "\",\"paymentId\":\"pay_123\",\"signature\":\"bad\"}"))
                .andExpect(status().isBadRequest());

        when(razorpayGateway.fetchPayment("pay_123")).thenReturn(
                new RazorpayGateway.Payment("pay_123", orderId, 49900, "INR", "captured", true));
        String signature = hmac(orderId + "|pay_123", "test_key_secret");
        mockMvc.perform(post("/api/payments/verify")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":\"" + orderId + "\",\"paymentId\":\"pay_123\",\"signature\":\""
                                + signature + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrolled").value(true));

        JsonNode unlocked = objectMapper.readTree(mockMvc.perform(get("/api/courses/paid-java")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertTrue(unlocked.get("eligible").asBoolean());
        assertEquals("SECRET LESSON CONTENT",
                unlocked.get("lessons").get(0).get("lessonContent").asText());

        mockMvc.perform(post("/api/courses/paid-java/enroll")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isOk());

        // Replaying the same payment is idempotent: no duplicate enrollment/payment.
        mockMvc.perform(post("/api/payments/verify")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":\"" + orderId + "\",\"paymentId\":\"pay_123\",\"signature\":\""
                                + signature + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void negativePricesAndUnauthorizedCourseCreationAreRejected() throws Exception {
        mockMvc.perform(post("/api/trainer/courses")
                        .header("Authorization", auth(trainerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paidCoursePayload("negative-price", "PAID", "-10")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/trainer/courses")
                        .header("Authorization", auth(trainerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paidCoursePayload("free-with-price", "FREE", "-5")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/trainer/courses")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paidCoursePayload("student-created", "FREE", "0")))
                .andExpect(status().isForbidden());
    }

    @Test
    void legacyCoursesGetThumbnailFallbackAndApprovedPricing() throws Exception {
        JsonNode list = objectMapper.readTree(mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        boolean found = false;
        for (JsonNode item : list) {
            if ("java-foundations".equals(item.get("slug").asText())) {
                found = true;
                assertEquals("PAID", item.get("courseType").asText());
                assertEquals(299, item.get("price").asInt());
                assertEquals("/course-thumbnails/java-programming.svg", item.get("thumbnailUrl").asText());
            }
        }
        assertTrue(found, "legacy seeded course should be present");
    }

    @Test
    void webhookRequiresSignatureAndIsIdempotent() throws Exception {
        createCourse(paidCoursePayload("webhook-course", "PAID", "299"), trainerToken);
        JsonNode order = objectMapper.readTree(mockMvc.perform(post("/api/payments/orders")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"webhook-course\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String orderId = order.get("orderId").asText();

        String body = """
                {"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_webhook_1","order_id":"%s"}}}}
                """.formatted(orderId);

        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", "invalid")
                        .content(body))
                .andExpect(status().isBadRequest());

        when(razorpayGateway.fetchPayment("pay_webhook_1")).thenReturn(
                new RazorpayGateway.Payment("pay_webhook_1", orderId, 29900, "INR", "captured", true));
        String signature = hmac(body, "test_webhook_secret");
        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", signature)
                        .content(body))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", signature)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/courses/webhook-course")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(true));
    }

    private String orderIdFor(String slug, String token) throws Exception {
        JsonNode order = objectMapper.readTree(mockMvc.perform(post("/api/payments/orders")
                        .header("Authorization", auth(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"" + slug + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        return order.get("orderId").asText();
    }

    private MvcResult verify(String orderId, String paymentId,
                             RazorpayGateway.Payment details, String token) throws Exception {
        when(razorpayGateway.fetchPayment(paymentId)).thenReturn(details);
        String signature = hmac(orderId + "|" + paymentId, "test_key_secret");
        return mockMvc.perform(post("/api/payments/verify")
                        .header("Authorization", auth(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":\"" + orderId + "\",\"paymentId\":\"" + paymentId
                                + "\",\"signature\":\"" + signature + "\"}"))
                .andReturn();
    }

    @Test
    void verificationReconcilesAmountCurrencyOrderAndOwnership() throws Exception {
        createCourse(paidCoursePayload("secure-course", "PAID", "150"), trainerToken);
        String orderId = orderIdFor("secure-course", studentToken);
        String otherStudent = tokenFor("STUDENT");

        MvcResult amount = verify(orderId, "pay_secure",
                new RazorpayGateway.Payment("pay_secure", orderId, 15100, "INR", "captured", true), studentToken);
        assertEquals(400, amount.getResponse().getStatus());
        assertTrue(amount.getResponse().getContentAsString().contains("Payment amount mismatch"));

        MvcResult currency = verify(orderId, "pay_secure",
                new RazorpayGateway.Payment("pay_secure", orderId, 15000, "USD", "captured", true), studentToken);
        assertEquals(400, currency.getResponse().getStatus());
        assertTrue(currency.getResponse().getContentAsString().contains("Payment currency mismatch"));

        MvcResult wrongOrder = verify(orderId, "pay_secure",
                new RazorpayGateway.Payment("pay_secure", "cv_other", 15000, "INR", "captured", true), studentToken);
        assertEquals(400, wrongOrder.getResponse().getStatus());

        MvcResult wrongStudent = verify(orderId, "pay_secure",
                new RazorpayGateway.Payment("pay_secure", orderId, 15000, "INR", "captured", true), otherStudent);
        assertEquals(403, wrongStudent.getResponse().getStatus());

        MvcResult unauthenticated = mockMvc.perform(post("/api/payments/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":\"" + orderId + "\",\"paymentId\":\"pay_secure\",\"signature\":\"x\"}"))
                .andReturn();
        assertEquals(401, unauthenticated.getResponse().getStatus());

        MvcResult authorized = verify(orderId, "pay_secure",
                new RazorpayGateway.Payment("pay_secure", orderId, 15000, "INR", "authorized", false), studentToken);
        assertEquals(200, authorized.getResponse().getStatus());
        assertTrue(authorized.getResponse().getContentAsString().contains("\"enrolled\":false"));

        RazorpayGateway.Payment captured =
                new RazorpayGateway.Payment("pay_secure", orderId, 15000, "INR", "captured", true);
        MvcResult paid = verify(orderId, "pay_secure", captured, studentToken);
        assertEquals(200, paid.getResponse().getStatus());
        assertTrue(paid.getResponse().getContentAsString().contains("\"enrolled\":true"));

        MvcResult replay = verify(orderId, "pay_secure", captured, studentToken);
        assertEquals(200, replay.getResponse().getStatus());

        mockMvc.perform(post("/api/payments/orders")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"sql-mastery\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/payments/orders")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"no-such-course\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unpaidStudentCannotUpdateProgressOrReusePayments() throws Exception {
        createCourse(paidCoursePayload("locked-progress", "PAID", "200"), trainerToken);
        Course paid = courseRepository.findBySlug("locked-progress").orElseThrow();
        CourseLesson lesson = courseLessonRepository.save(CourseLesson.builder()
                .course(paid).moduleName("Module 1").moduleOrder(1).lessonOrder(1)
                .title("Locked lesson").description("Locked").lessonContent("SECRET").build());
        String progressBody = "{\"lessonId\":" + lesson.getId() + ",\"completed\":true}";

        mockMvc.perform(post("/api/courses/locked-progress/progress")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON).content(progressBody))
                .andExpect(status().isPaymentRequired());
        mockMvc.perform(post("/api/learning/lessons/" + lesson.getId() + "/complete")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"completed\":true}"))
                .andExpect(status().isPaymentRequired());
        mockMvc.perform(post("/api/learning/lessons/" + lesson.getId() + "/bookmark")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isPaymentRequired());
        mockMvc.perform(put("/api/learning/lessons/" + lesson.getId() + "/note")
                        .header("Authorization", auth(studentToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"x\"}"))
                .andExpect(status().isPaymentRequired());

        String orderId = orderIdFor("locked-progress", studentToken);
        String otherStudent = tokenFor("STUDENT");
        MvcResult foreignOrder = verify(orderId, "pay_foreign",
                new RazorpayGateway.Payment("pay_foreign", orderId, 20000, "INR", "captured", true), otherStudent);
        assertEquals(403, foreignOrder.getResponse().getStatus());

        createCourse(paidCoursePayload("second-paid", "PAID", "100"), trainerToken);
        String secondOrder = orderIdFor("second-paid", otherStudent);
        MvcResult duplicate = verify(secondOrder, "pay_123",
                new RazorpayGateway.Payment("pay_123", secondOrder, 10000, "INR", "captured", true), otherStudent);
        assertEquals(409, duplicate.getResponse().getStatus());
    }

    @Test
    void delayedFailureDoesNotDowngradeCapturedPayment() throws Exception {
        createCourse(paidCoursePayload("webhook-order", "PAID", "350"), trainerToken);
        String orderId = orderIdFor("webhook-order", studentToken);
        String captureBody = """
                {"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_webhook_2","order_id":"%s","amount":35000}}}}
                """.formatted(orderId);
        when(razorpayGateway.fetchPayment("pay_webhook_2")).thenReturn(
                new RazorpayGateway.Payment("pay_webhook_2", orderId, 35000, "INR", "captured", true));
        String captureSignature = hmac(captureBody, "test_webhook_secret");
        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", captureSignature)
                        .content(captureBody))
                .andExpect(status().isOk());

        String failureBody = """
                {"event":"payment.failed","payload":{"payment":{"entity":{"id":"pay_webhook_2","order_id":"%s"}}}}
                """.formatted(orderId);
        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", hmac(failureBody, "test_webhook_secret"))
                        .content(failureBody))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/courses/webhook-order")
                        .header("Authorization", auth(studentToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eligible").value(true));

        mockMvc.perform(post("/api/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Signature", captureSignature)
                        .content(captureBody.replace("35000", "1")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void concurrentVerificationIsIdempotent() throws Exception {
        createCourse(paidCoursePayload("concurrent-course", "PAID", "75"), trainerToken);
        String orderId = orderIdFor("concurrent-course", studentToken);
        when(razorpayGateway.fetchPayment("pay_conc")).thenReturn(
                new RazorpayGateway.Payment("pay_conc", orderId, 7500, "INR", "captured", true));
        String signature = hmac(orderId + "|pay_conc", "test_key_secret");
        String body = "{\"orderId\":\"" + orderId + "\",\"paymentId\":\"pay_conc\",\"signature\":\""
                + signature + "\"}";

        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> first = pool.submit(() -> {
                start.await();
                return mockMvc.perform(post("/api/payments/verify")
                                .header("Authorization", auth(studentToken))
                                .contentType(MediaType.APPLICATION_JSON).content(body))
                        .andReturn().getResponse().getStatus();
            });
            Future<Integer> second = pool.submit(() -> {
                start.await();
                return mockMvc.perform(post("/api/payments/verify")
                                .header("Authorization", auth(studentToken))
                                .contentType(MediaType.APPLICATION_JSON).content(body))
                        .andReturn().getResponse().getStatus();
            });
            start.countDown();

            assertEquals(200, first.get(30, TimeUnit.SECONDS));
            assertEquals(200, second.get(30, TimeUnit.SECONDS));
            assertEquals("CAPTURED", paymentOrderRepository.findByOrderId(orderId).orElseThrow().getStatus());
        } finally {
            pool.shutdownNow();
        }
    }
}

package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.dto.PaymentRequests.VerifyRequest;
import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.entity.CourseProgress;
import com.srhcodeverse.backend.entity.PaymentOrder;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.CourseLessonRepository;
import com.srhcodeverse.backend.repository.CourseProgressRepository;
import com.srhcodeverse.backend.repository.CourseRepository;
import com.srhcodeverse.backend.repository.PaymentOrderRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Server-authoritative payment lifecycle. The browser supplies only identifiers
 * and a gateway signature; amount, currency, order/payment association and
 * capture status are always verified against Razorpay's server-side API before
 * any paid-course entitlement is created. Credentials stay in backend config.
 */
@Service
public class PaymentService {

    static final String CREATED = "CREATED";
    static final String AUTHORIZED = "AUTHORIZED";
    static final String CAPTURED = "CAPTURED";
    static final String FAILED = "FAILED";
    static final String EXPIRED = "EXPIRED";
    static final String REFUNDED = "REFUNDED";

    private static final Set<String> ACTIVE_STATES = Set.of(CREATED, AUTHORIZED);
    private static final long MAX_AMOUNT_PAISE = 100_000_000L; // INR 10,00,000

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseLessonRepository lessonRepository;
    private final CourseProgressRepository progressRepository;
    private final PaymentOrderRepository paymentOrderRepository;
    private final CoursePricing pricing;
    private final ObjectMapper objectMapper;
    private final RazorpayGateway gateway;

    @Value("${payment.razorpay.key-id:}")
    private String keyId;

    @Value("${payment.razorpay.key-secret:}")
    private String keySecret;

    @Value("${payment.razorpay.webhook-secret:}")
    private String webhookSecret;

    public PaymentService(CourseRepository courseRepository, UserRepository userRepository,
                          CourseLessonRepository lessonRepository, CourseProgressRepository progressRepository,
                          PaymentOrderRepository paymentOrderRepository, CoursePricing pricing,
                          ObjectMapper objectMapper, RazorpayGateway gateway) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.progressRepository = progressRepository;
        this.paymentOrderRepository = paymentOrderRepository;
        this.pricing = pricing;
        this.objectMapper = objectMapper;
        this.gateway = gateway;
    }

    private boolean configured() {
        return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
    }

    @Transactional
    public Map<String, Object> createOrder(String slug, String username) {
        Course course = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!pricing.isPaid(course))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This course is free; no payment is required");
        if (!pricing.enrollmentEnabled(course))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Enrollment is disabled for this course");
        if (pricing.entitled(course, user))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have access to this course");
        if (!configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Online payments are not configured yet");

        BigDecimal amount = pricing.price(course);
        String currency = pricing.currency(course);
        long amountPaise = toPaise(amount);

        PaymentOrder existing = paymentOrderRepository
                .findFirstByUserAndCourseAndStatusOrderByCreatedAtDesc(user, course, CREATED)
                .orElse(null);
        if (existing != null
                && (existing.getAmountPaise() != amountPaise
                || !existing.getCurrency().equalsIgnoreCase(currency))) {
            // Price/currency changed after the order was created: retire the old order.
            existing.setStatus(EXPIRED);
            paymentOrderRepository.save(existing);
            existing = null;
        }

        PaymentOrder order = existing != null ? existing : paymentOrderRepository.save(PaymentOrder.builder()
                .orderId("cv_" + UUID.randomUUID().toString().replace("-", ""))
                .user(user)
                .course(course)
                .amount(amount)
                .amountPaise(amountPaise)
                .currency(currency)
                .status(CREATED)
                .build());
        return orderResponse(order);
    }

    @Transactional
    public Map<String, Object> verify(VerifyRequest request, String username) {
        if (!configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Online payments are not configured yet");

        // Pessimistic lock serializes concurrent verification and webhook delivery.
        PaymentOrder order = paymentOrderRepository.findByOrderIdForUpdate(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown order"));
        requireOwnership(order, username);
        Map<String, Object> completed = completedResult(order, request.paymentId());
        if (completed != null)
            return completed;
        if (!ACTIVE_STATES.contains(order.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This order can no longer be verified");

        requireValidSignature(hmac(order.getOrderId() + "|" + request.paymentId(), keySecret),
                request.signature());
        rejectDuplicatePayment(request.paymentId(), order);

        RazorpayGateway.Payment payment = gateway.fetchPayment(request.paymentId());
        if (payment == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment not found");
        reconcile(order, payment, request.paymentId());

        if (isCaptured(payment)) {
            capture(order, request.paymentId());
            return activated(order);
        }
        if ("authorized".equalsIgnoreCase(payment.status())) {
            markAuthorized(order, request.paymentId());
            return Map.of("orderId", order.getOrderId(), "status", AUTHORIZED, "enrolled", false);
        }
        markFailed(order, request.paymentId());
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment was not captured");
    }

    @Transactional
    public void handleWebhook(String body, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payment webhooks are not configured yet");
        requireValidSignature(hmac(body == null ? "" : body, webhookSecret), signature);

        JsonNode root;
        try {
            root = objectMapper.readTree(body == null ? "" : body);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid webhook payload");
        }

        String event = root.path("event").asText();
        switch (event) {
            case "payment.captured" -> handlePaymentEvent(root, true);
            case "payment.authorized" -> handlePaymentEvent(root, false);
            case "payment.failed" -> handleFailedEvent(root);
            case "refund.created", "refund.processed" -> handleRefundEvent(root);
            default -> {
                // Unrelated events are ignored without changing payment state.
            }
        }
    }

    private void handlePaymentEvent(JsonNode root, boolean capturedEvent) {
        JsonNode entity = root.path("payload").path("payment").path("entity");
        String paymentId = entity.path("id").asText(null);
        String orderId = entity.path("order_id").asText(null);
        if (paymentId == null || orderId == null)
            return;

        PaymentOrder order = paymentOrderRepository.findByOrderIdForUpdate(orderId).orElse(null);
        if (order == null)
            return; // not an order created by this application
        if (!ACTIVE_STATES.contains(order.getStatus()))
            return; // idempotent replay or no downgrade from CAPTURED/REFUNDED

        rejectDuplicatePayment(paymentId, order);
        RazorpayGateway.Payment payment = gateway.fetchPayment(paymentId);
        if (payment == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment not found");
        reconcile(order, payment, paymentId);

        if (isCaptured(payment))
            capture(order, paymentId);
        else if (capturedEvent)
            markFailed(order, paymentId); // event claims capture but gateway says otherwise
        else
            markAuthorized(order, paymentId);
    }

    private void handleFailedEvent(JsonNode root) {
        JsonNode entity = root.path("payload").path("payment").path("entity");
        String orderId = entity.path("order_id").asText(null);
        String paymentId = entity.path("id").asText(null);
        if (orderId == null)
            return;
        PaymentOrder order = paymentOrderRepository.findByOrderIdForUpdate(orderId).orElse(null);
        if (order == null || !ACTIVE_STATES.contains(order.getStatus()))
            return; // a delayed failure can never downgrade CAPTURED/REFUNDED
        if (paymentId != null && order.getRazorpayPaymentId() != null
                && !order.getRazorpayPaymentId().equals(paymentId))
            return; // failure for a different attempt
        markFailed(order, paymentId);
    }

    private void handleRefundEvent(JsonNode root) {
        JsonNode refund = root.path("payload").path("refund").path("entity");
        String paymentId = refund.path("payment_id").asText(null);
        if (paymentId == null)
            return;
        PaymentOrder order = paymentOrderRepository.findByRazorpayPaymentId(paymentId).orElse(null);
        if (order == null || !CAPTURED.equals(order.getStatus()))
            return;
        // Explicit entitlement policy: refunds are recorded for audit, but
        // existing progress rows are never deleted and access is not silently
        // revoked. Operators handle refund entitlements manually.
        order.setStatus(REFUNDED);
        paymentOrderRepository.save(order);
    }

    private void capture(PaymentOrder order, String paymentId) {
        requireCompleteState(order, paymentId);
        order.setStatus(CAPTURED);
        order.setRazorpayPaymentId(paymentId);
        paymentOrderRepository.save(order);
        if (progressRepository.findByUserAndCourse(order.getUser(), order.getCourse()).isEmpty()) {
            List<CourseLesson> lessons = lessonRepository
                    .findByCourseOrderByModuleOrderAscLessonOrderAsc(order.getCourse());
            progressRepository.save(CourseProgress.builder()
                    .user(order.getUser())
                    .course(order.getCourse())
                    .completedLessonIds("")
                    .currentLessonId(lessons.isEmpty() ? null : lessons.get(0).getId())
                    .xpEarned(0)
                    .build());
        }
    }

    private void markAuthorized(PaymentOrder order, String paymentId) {
        requireCompleteState(order, paymentId);
        order.setStatus(AUTHORIZED);
        order.setRazorpayPaymentId(paymentId);
        paymentOrderRepository.save(order);
    }

    private void markFailed(PaymentOrder order, String paymentId) {
        if (!ACTIVE_STATES.contains(order.getStatus()))
            return;
        if (paymentId != null && order.getRazorpayPaymentId() != null
                && !order.getRazorpayPaymentId().equals(paymentId))
            return;
        order.setStatus(FAILED);
        if (paymentId != null) order.setRazorpayPaymentId(paymentId);
        paymentOrderRepository.save(order);
    }

    private void requireCompleteState(PaymentOrder order, String paymentId) {
        if (CAPTURED.equals(order.getStatus()) || REFUNDED.equals(order.getStatus())) {
            if (paymentId.equals(order.getRazorpayPaymentId()))
                return; // idempotent completion
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A different payment was already recorded for this order");
        }
        if (!ACTIVE_STATES.contains(order.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This order can no longer be completed");
    }

    private Map<String, Object> completedResult(PaymentOrder order, String paymentId) {
        if (REFUNDED.equals(order.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This payment was refunded");
        if (CAPTURED.equals(order.getStatus())) {
            if (!paymentId.equals(order.getRazorpayPaymentId()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A different payment was already recorded for this order");
            return activated(order);
        }
        return null;
    }

    private void requireOwnership(PaymentOrder order, String username) {
        if (!order.getUser().getUsername().equals(username))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This order belongs to another student");
    }

    private void rejectDuplicatePayment(String paymentId, PaymentOrder current) {
        paymentOrderRepository.findByRazorpayPaymentId(paymentId)
                .filter(other -> !other.getId().equals(current.getId()))
                .ifPresent(other -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "This payment was already used for another order");
                });
    }

    private void reconcile(PaymentOrder order, RazorpayGateway.Payment payment, String paymentId) {
        if (paymentId == null || !paymentId.equals(payment.id()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment ID mismatch");
        if (!order.getOrderId().equals(payment.orderId()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment order mismatch");
        if (payment.amountPaise() != order.getAmountPaise())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment amount mismatch");
        if (payment.currency() == null || !order.getCurrency().equalsIgnoreCase(payment.currency()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment currency mismatch");
    }

    private boolean isCaptured(RazorpayGateway.Payment payment) {
        return payment.captured() || "captured".equalsIgnoreCase(payment.status());
    }

    private long toPaise(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0 || amount.scale() > 2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Paid courses require a valid positive price");
        try {
            long paise = amount.movePointRight(2).setScale(0, RoundingMode.UNNECESSARY).longValueExact();
            if (paise <= 0 || paise > MAX_AMOUNT_PAISE)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid course price");
            return paise;
        } catch (ArithmeticException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid course price");
        }
    }

    private Map<String, Object> orderResponse(PaymentOrder order) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", order.getOrderId());
        result.put("amount", order.getAmount());
        result.put("amountPaise", order.getAmountPaise());
        result.put("currency", order.getCurrency());
        result.put("status", order.getStatus());
        // Razorpay key_id is a public identifier; the key secret is never returned.
        result.put("keyId", keyId);
        return result;
    }

    private Map<String, Object> activated(PaymentOrder order) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderId", order.getOrderId());
        result.put("status", CAPTURED);
        result.put("slug", order.getCourse().getSlug());
        result.put("enrolled", true);
        return result;
    }

    private void requireValidSignature(String expected, String provided) {
        boolean valid = provided != null && MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                provided.trim().getBytes(StandardCharsets.UTF_8));
        if (!valid)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
    }

    private String hmac(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(raw.length * 2);
            for (byte b : raw)
                hex.append(String.format("%02x", b & 0xff));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to verify payment signature", e);
        }
    }
}

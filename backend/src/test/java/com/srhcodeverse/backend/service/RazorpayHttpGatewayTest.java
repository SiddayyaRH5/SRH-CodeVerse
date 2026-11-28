package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpRequest;
import java.time.Duration;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class RazorpayHttpGatewayTest {

    private static final String KEY = "rzp_test_local";
    private static final String SECRET = "local_test_secret_value";

    private static final class CapturingTransport implements RazorpayHttpGateway.GatewayTransport {
        private final int status;
        private final String responseBody;
        private final AtomicReference<HttpRequest> request = new AtomicReference<>();
        private final AtomicReference<String> body = new AtomicReference<>();

        private CapturingTransport(int status, String responseBody) {
            this.status = status;
            this.responseBody = responseBody;
        }

        @Override
        public RazorpayHttpGateway.GatewayResponse send(HttpRequest req, String requestBody) {
            request.set(req);
            body.set(requestBody);
            return new RazorpayHttpGateway.GatewayResponse(status, responseBody);
        }

        private String authorization() {
            return request.get().headers().firstValue("Authorization").orElse(null);
        }
    }

    private RazorpayHttpGateway gateway(RazorpayHttpGateway.GatewayTransport transport) {
        return RazorpayHttpGateway.forTesting(new ObjectMapper(),
                RazorpayHttpGateway.DEFAULT_API_BASE, KEY, SECRET, transport);
    }

    @Test
    void createsOrderWithOfficialUrlBasicAuthAndBackendAmount() {
        CapturingTransport transport = new CapturingTransport(200, "{\"id\":\"order_real_1\"}");
        String id = gateway(transport).createOrder(29900L, "inr", "course_java-foundations_7");

        assertEquals("order_real_1", id);
        assertEquals("https://api.razorpay.com/v1/orders", transport.request.get().uri().toString());
        assertEquals("POST", transport.request.get().method());
        assertEquals(Duration.ofSeconds(10), transport.request.get().timeout().orElseThrow());
        String expectedAuth = "Basic " + Base64.getEncoder().encodeToString((KEY + ":" + SECRET).getBytes());
        assertEquals(expectedAuth, transport.authorization());
        assertTrue(transport.body.get().contains("\"amount\":29900"));
        assertTrue(transport.body.get().contains("\"currency\":\"INR\""));
        assertTrue(transport.body.get().contains("course_java-foundations_7"));
    }

    @Test
    void fetchesPaymentWithEncodedIdAndParsesFields() {
        CapturingTransport transport = new CapturingTransport(200,
                "{\"id\":\"pay_1\",\"order_id\":\"order_real_1\",\"amount\":29900,"
                        + "\"currency\":\"INR\",\"status\":\"captured\",\"captured\":true}");
        RazorpayGateway.Payment payment = gateway(transport).fetchPayment("pay_1");

        assertEquals("https://api.razorpay.com/v1/payments/pay_1", transport.request.get().uri().toString());
        assertEquals("GET", transport.request.get().method());
        assertEquals("pay_1", payment.id());
        assertEquals("order_real_1", payment.orderId());
        assertEquals(29900L, payment.amountPaise());
        assertEquals("INR", payment.currency());
        assertTrue(payment.captured());
    }

    @Test
    void httpErrorsAndMalformedResponsesFailClosedWithoutLeakingSecret() {
        ResponseStatusException httpError = assertThrows(ResponseStatusException.class,
                () -> gateway(new CapturingTransport(400, "{\"error\":\"bad\"}")).createOrder(100L, "INR", "r"));
        assertEquals(HttpStatus.BAD_GATEWAY, httpError.getStatusCode());
        assertFalse(httpError.getMessage().contains(SECRET));

        ResponseStatusException malformed = assertThrows(ResponseStatusException.class,
                () -> gateway(new CapturingTransport(200, "not-json")).fetchPayment("pay_1"));
        assertEquals(HttpStatus.BAD_GATEWAY, malformed.getStatusCode());
        assertFalse(malformed.getMessage().contains(SECRET));

        ResponseStatusException noOrderId = assertThrows(ResponseStatusException.class,
                () -> gateway(new CapturingTransport(200, "{}")).createOrder(100L, "INR", "r"));
        assertEquals(HttpStatus.BAD_GATEWAY, noOrderId.getStatusCode());
    }

    @Test
    void missingConfigurationIsRejectedBeforeSendingRequest() {
        RazorpayHttpGateway gateway = RazorpayHttpGateway.forTesting(new ObjectMapper(),
                RazorpayHttpGateway.DEFAULT_API_BASE, null, SECRET,
                new CapturingTransport(200, "{}"));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> gateway.createOrder(100L, "INR", "r"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }
}

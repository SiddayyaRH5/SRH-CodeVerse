package com.srhcodeverse.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RazorpayGatewaySecurityTest {

    @Test
    void officialHttpsApiBaseIsAccepted() {
        assertEquals(RazorpayHttpGateway.DEFAULT_API_BASE,
                RazorpayHttpGateway.validateApiBase("https://api.razorpay.com/v1"));
        assertEquals(RazorpayHttpGateway.DEFAULT_API_BASE,
                RazorpayHttpGateway.validateApiBase("https://api.razorpay.com/v1/"));
    }

    @Test
    void httpIsRejected() {
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("http://api.razorpay.com/v1"));
    }

    @Test
    void unexpectedHostAndLookalikeAreRejected() {
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("https://evil.example/v1"));
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("https://api.razorpay.com.evil.test/v1"));
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("https://api-razorpay-com.test/v1"));
    }

    @Test
    void userInfoPortAndPathAreRejected() {
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("https://user:pass@api.razorpay.com/v1"));
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("https://api.razorpay.com:8443/v1"));
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("https://api.razorpay.com/v2"));
        assertThrows(IllegalStateException.class,
                () -> RazorpayHttpGateway.validateApiBase("https://api.razorpay.com/v1?x=1"));
    }

    @Test
    void testKeyIsAccepted() {
        assertDoesNotThrow(() -> RazorpayConfig.validate("rzp_test_abc", "secret"));
    }

    @Test
    void liveKeyIsRejected() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> RazorpayConfig.validate("rzp_live_abc", "secret"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
    }

    @Test
    void missingKeyOrSecretIsRejected() {
        assertThrows(ResponseStatusException.class, () -> RazorpayConfig.validate(null, "secret"));
        assertThrows(ResponseStatusException.class, () -> RazorpayConfig.validate("", "secret"));
        assertThrows(ResponseStatusException.class, () -> RazorpayConfig.validate("rzp_test_abc", null));
        assertThrows(ResponseStatusException.class, () -> RazorpayConfig.validate("rzp_test_abc", ""));
    }
}

package com.srhcodeverse.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Shared, fail-closed validation for Razorpay Test Mode configuration. */
public final class RazorpayConfig {

    public static final String TEST_KEY_PREFIX = "rzp_test_";

    private RazorpayConfig() {
    }

    public static void validate(String keyId, String keySecret) {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payments are not configured");
        if (!keyId.startsWith(TEST_KEY_PREFIX))
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Only Razorpay Test Mode is enabled");
    }
}

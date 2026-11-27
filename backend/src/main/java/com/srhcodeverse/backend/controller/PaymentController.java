package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.PaymentRequests.OrderRequest;
import com.srhcodeverse.backend.dto.PaymentRequests.VerifyRequest;
import com.srhcodeverse.backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping("/orders")
    public Map<String, Object> createOrder(@Valid @RequestBody OrderRequest request, Authentication auth) {
        return service.createOrder(request.slug(), auth.getName());
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody VerifyRequest request, Authentication auth) {
        return service.verify(request, auth.getName());
    }

    /** Verified by HMAC over the raw request body; no credentials in the response. */
    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> webhook(
            @RequestBody String body,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        service.handleWebhook(body, signature);
        return ResponseEntity.ok().build();
    }
}

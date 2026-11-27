package com.srhcodeverse.backend.dto;

import jakarta.validation.constraints.NotBlank;

public final class PaymentRequests {

    private PaymentRequests() {
    }

    public record OrderRequest(@NotBlank String slug) {
    }

    public record VerifyRequest(
            @NotBlank String orderId,
            @NotBlank String paymentId,
            @NotBlank String signature) {
    }
}

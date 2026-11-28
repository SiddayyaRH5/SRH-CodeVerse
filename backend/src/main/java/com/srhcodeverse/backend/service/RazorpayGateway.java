package com.srhcodeverse.backend.service;

/**
 * Abstraction over Razorpay's server-side API. Implementations must use the
 * backend key secret over TLS; the browser never calls this directly.
 */
public interface RazorpayGateway {

    /** Creates a real Razorpay order and returns its Razorpay order ID. */
    String createOrder(long amountPaise, String currency, String receipt);

    /** Returns null when Razorpay reports no such payment. */
    Payment fetchPayment(String paymentId);

    record Payment(
            String id,
            String orderId,
            long amountPaise,
            String currency,
            String status,
            boolean captured) {
    }
}

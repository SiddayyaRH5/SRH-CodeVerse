package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Server-side record of a payment attempt. No Razorpay credentials or secrets
 * are stored here. Payment capture/verification is handled by PaymentService.
 */
@Entity
@Table(name = "payment_orders", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_order_id", columnNames = "order_id"),
        @UniqueConstraint(name = "uk_payment_razorpay_id", columnNames = "razorpay_payment_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentOrder {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true, length = 64)
    private String orderId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Authoritative amount in paise, used for gateway reconciliation. */
    @Builder.Default
    @Column(name = "amount_paise", nullable = false)
    private long amountPaise = 0L;

    @Column(nullable = false, length = 3)
    private String currency;

    /**
     * CREATED, AUTHORIZED, CAPTURED, FAILED, EXPIRED or REFUNDED.
     * Only CAPTURED grants entitlement.
     */
    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "razorpay_payment_id", length = 64)
    private String razorpayPaymentId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

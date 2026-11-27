package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.PaymentOrder;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByOrderId(String orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from PaymentOrder o where o.orderId = :orderId")
    Optional<PaymentOrder> findByOrderIdForUpdate(@Param("orderId") String orderId);

    Optional<PaymentOrder> findByRazorpayPaymentId(String razorpayPaymentId);

    boolean existsByUserAndCourseAndStatus(User user, Course course, String status);

    Optional<PaymentOrder> findFirstByUserAndCourseAndStatusOrderByCreatedAtDesc(
            User user, Course course, String status);
}

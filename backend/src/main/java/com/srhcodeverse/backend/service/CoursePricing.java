package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.CourseProgressRepository;
import com.srhcodeverse.backend.repository.PaymentOrderRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Single source of truth for course pricing, thumbnails and paid-course
 * entitlement. Legacy rows (created before the pricing columns existed) are
 * always treated as FREE, so no existing course, enrollment or progress data
 * changes behaviour.
 */
@Component
public class CoursePricing {

    static final String FREE = "FREE";
    static final String PAID = "PAID";
    static final String CAPTURED_STATUS = "CAPTURED";
    // Legacy label retained for databases created before the state machine was hardened.
    static final String LEGACY_PAID_STATUS = "PAID";

    private static final Map<String, String> THUMBNAILS = Map.ofEntries(
            Map.entry("java-foundations", "/course-thumbnails/java-programming.svg"),
            Map.entry("dsa-essentials", "/course-thumbnails/data-structures-algorithms.svg"),
            Map.entry("sql-mastery", "/course-thumbnails/sql-mysql.svg"),
            Map.entry("react-frontend", "/course-thumbnails/react-js.svg"),
            Map.entry("spring-boot-backend", "/course-thumbnails/spring-boot.svg"),
            Map.entry("fullstack-projects", "/course-thumbnails/full-stack-web-development.svg"),
            Map.entry("job-preparation", "/course-thumbnails/git-github.svg"));

    private static final String DEFAULT_THUMBNAIL = "/course-thumbnails/html-css.svg";

    private final CourseProgressRepository progressRepository;
    private final PaymentOrderRepository paymentOrderRepository;

    public CoursePricing(CourseProgressRepository progressRepository,
                         PaymentOrderRepository paymentOrderRepository) {
        this.progressRepository = progressRepository;
        this.paymentOrderRepository = paymentOrderRepository;
    }

    public String type(Course course) {
        return PAID.equalsIgnoreCase(course.getCourseType()) ? PAID : FREE;
    }

    public boolean isPaid(Course course) {
        return PAID.equals(type(course));
    }

    public BigDecimal price(Course course) {
        if (!isPaid(course))
            return BigDecimal.ZERO;
        BigDecimal amount = course.getPrice();
        return amount == null || amount.signum() < 0 ? BigDecimal.ZERO : amount;
    }

    public String currency(Course course) {
        String currency = course.getCurrency();
        return currency == null || currency.isBlank() ? "INR" : currency.trim().toUpperCase();
    }

    public String thumbnail(Course course) {
        String thumbnail = course.getThumbnail();
        if (thumbnail != null && !thumbnail.isBlank())
            return thumbnail;
        return THUMBNAILS.getOrDefault(course.getSlug(), DEFAULT_THUMBNAIL);
    }

    public String instructor(Course course) {
        String instructor = course.getInstructor();
        return instructor == null || instructor.isBlank() ? "SRH CodeVerse" : instructor;
    }

    public boolean published(Course course) {
        return course.getPublished() == null || course.getPublished();
    }

    public boolean enrollmentEnabled(Course course) {
        return course.getEnrollmentEnabled() == null || course.getEnrollmentEnabled();
    }

    /**
     * Access is granted only for a free course, a pre-existing enrollment
     * (legacy users keep their access), or a payment verified server-side.
     */
    public boolean entitled(Course course, User user) {
        if (user == null)
            return false;
        if (!isPaid(course))
            return true;
        if (progressRepository.findByUserAndCourse(user, course).isPresent())
            return true;
        return paymentOrderRepository.existsByUserAndCourseAndStatus(user, course, CAPTURED_STATUS)
                || paymentOrderRepository.existsByUserAndCourseAndStatus(user, course, LEGACY_PAID_STATUS);
    }
}

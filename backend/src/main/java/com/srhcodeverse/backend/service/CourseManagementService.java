package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.CourseAdminRequest;
import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/** Administrative course catalog management, backed by the existing Course entity. */
@Service
public class CourseManagementService {

    private final CourseRepository courseRepository;
    private final CoursePricing pricing;

    public CourseManagementService(CourseRepository courseRepository, CoursePricing pricing) {
        this.courseRepository = courseRepository;
        this.pricing = pricing;
    }

    @Transactional
    public Map<String, Object> create(CourseAdminRequest request) {
        if (courseRepository.findBySlug(request.slug()).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A course with this slug already exists");
        Course course = Course.builder()
                .slug(request.slug().trim())
                .title(request.title().trim())
                .shortDescription(request.shortDescription().trim())
                .detailedDescription(request.detailedDescription() == null ? "" : request.detailedDescription())
                .category(request.category().trim())
                .difficulty(request.difficulty() == null || request.difficulty().isBlank()
                        ? "BEGINNER" : request.difficulty().trim())
                .level(request.level() == null || request.level().isBlank()
                        ? "Beginner" : request.level().trim())
                .thumbnail(request.thumbnail())
                .instructor(request.instructor())
                .estimatedDurationMinutes(request.estimatedDurationMinutes())
                .lessonCount(0)
                .problemCount(0)
                .published(request.published() == null || request.published())
                .enrollmentEnabled(request.enrollmentEnabled() == null || request.enrollmentEnabled())
                .build();
        applyPricing(course, request.courseType(), request.price(), request.currency());
        courseRepository.save(course);
        return result(course, "created");
    }

    @Transactional
    public Map<String, Object> update(String slug, CourseAdminRequest request) {
        Course course = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        if (request.title() != null && !request.title().isBlank()) course.setTitle(request.title().trim());
        if (request.shortDescription() != null && !request.shortDescription().isBlank())
            course.setShortDescription(request.shortDescription().trim());
        if (request.detailedDescription() != null) course.setDetailedDescription(request.detailedDescription());
        if (request.category() != null && !request.category().isBlank()) course.setCategory(request.category().trim());
        if (request.difficulty() != null && !request.difficulty().isBlank()) course.setDifficulty(request.difficulty().trim());
        if (request.level() != null && !request.level().isBlank()) course.setLevel(request.level().trim());
        if (request.thumbnail() != null) course.setThumbnail(request.thumbnail());
        if (request.instructor() != null) course.setInstructor(request.instructor());
        if (request.estimatedDurationMinutes() != null)
            course.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
        if (request.published() != null) course.setPublished(request.published());
        if (request.enrollmentEnabled() != null) course.setEnrollmentEnabled(request.enrollmentEnabled());
        if (request.courseType() != null || request.price() != null || request.currency() != null)
            applyPricing(course, request.courseType(), request.price(), request.currency());
        courseRepository.save(course);
        return result(course, "updated");
    }

    @Transactional
    public Map<String, Object> setPublished(String slug, boolean published) {
        Course course = courseRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        course.setPublished(published);
        courseRepository.save(course);
        return result(course, published ? "published" : "unpublished");
    }

    private void applyPricing(Course course, String type, BigDecimal price, String currency) {
        String resolvedType = type == null || type.isBlank() ? pricing.type(course) : type.trim().toUpperCase();
        if (!"FREE".equals(resolvedType) && !"PAID".equals(resolvedType))
            throw new IllegalArgumentException("courseType must be FREE or PAID");
        if ("PAID".equals(resolvedType) && (price == null || price.signum() <= 0))
            throw new IllegalArgumentException("A PAID course requires a positive price");
        course.setCourseType(resolvedType);
        course.setPrice("PAID".equals(resolvedType) ? price : BigDecimal.ZERO);
        course.setCurrency(currency == null || currency.isBlank() ? "INR" : currency.trim().toUpperCase());
    }

    private Map<String, Object> result(Course course, String action) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("slug", course.getSlug());
        out.put("courseType", pricing.type(course));
        out.put("price", pricing.price(course));
        out.put("currency", pricing.currency(course));
        out.put("published", pricing.published(course));
        out.put("status", action);
        return out;
    }
}

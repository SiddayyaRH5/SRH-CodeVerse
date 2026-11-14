// AnalyticsController.java
package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.AnalyticsResponse;
import com.srhcodeverse.backend.dto.PersonalAnalyticsResponse;
import com.srhcodeverse.backend.service.AnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PreAuthorize("hasRole('TRAINER')")
    @GetMapping("/api/trainer/analytics")
    public AnalyticsResponse getAnalytics() {
        return analyticsService.getAnalytics();
    }

    @GetMapping("/api/analytics")
    public PersonalAnalyticsResponse getMyAnalytics() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return analyticsService.getAnalyticsForUser(username);
    }
}

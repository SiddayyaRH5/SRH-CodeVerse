package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.AchievementProgressResponse;
import com.srhcodeverse.backend.dto.AchievementResponse;
import com.srhcodeverse.backend.dto.ActivityHeatmapResponse;
import com.srhcodeverse.backend.dto.DashboardResponse;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.service.AchievementService;
import com.srhcodeverse.backend.service.DashboardService;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AchievementService achievementService;
    private final UserRepository userRepository;

    public DashboardController(
            DashboardService dashboardService,
            AchievementService achievementService,
            UserRepository userRepository) {

        this.dashboardService = dashboardService;
        this.achievementService = achievementService;
        this.userRepository = userRepository;
    }

    // =========================================================
    // GET DASHBOARD
    // =========================================================

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String username = auth.getName();

        return dashboardService.getDashboard(username);
    }

    // =========================================================
    // GET EARNED ACHIEVEMENTS
    // =========================================================

    @GetMapping("/achievements")
    public List<AchievementResponse> getMyAchievements() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String username = auth.getName();

        return dashboardService.getAchievements(username);
    }

    // =========================================================
    // GET ALL ACHIEVEMENTS WITH PROGRESS
    // =========================================================

    @GetMapping("/achievements/all")
    public List<AchievementProgressResponse> getAllAchievements() {

        String username = getCurrentUsername();

        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found: " + username
                                )
                        );

        return achievementService
                .getAllAchievementsWithProgress(user);
    }

    // =========================================================
    // GET ACTIVITY HEATMAP
    // =========================================================

    @GetMapping("/activity")
    public ActivityHeatmapResponse getActivity() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String username = auth.getName();

        return dashboardService
                .getActivityHeatmap(username);
    }

    // =========================================================
    // GET CURRENT USERNAME
    // =========================================================

    private String getCurrentUsername() {

        Authentication auth =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException(
                    "User is not authenticated"
            );
        }

        return auth.getName();
    }
    
   
}
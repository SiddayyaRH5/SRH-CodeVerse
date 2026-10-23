package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.ActivityHeatmapResponse;
import com.srhcodeverse.backend.dto.StudentDetailResponse;
import com.srhcodeverse.backend.dto.StudentSummaryResponse;
import com.srhcodeverse.backend.service.DashboardService;
import com.srhcodeverse.backend.service.TrainerStudentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TrainerStudentController {

    private final TrainerStudentService trainerStudentService;
    private final DashboardService dashboardService;

    public TrainerStudentController(TrainerStudentService trainerStudentService, DashboardService dashboardService) {
        this.trainerStudentService = trainerStudentService;
        this.dashboardService = dashboardService;
    }

    @PreAuthorize("hasRole('TRAINER')")
    @GetMapping("/api/trainer/students")
    public List<StudentSummaryResponse> getAllStudents() {
        return trainerStudentService.getAllStudents();
    }

    @PreAuthorize("hasRole('TRAINER')")
    @GetMapping("/api/trainer/students/{username}")
    public StudentDetailResponse getStudentDetail(@PathVariable String username) {
        return trainerStudentService.getStudentDetail(username);
    }

    @PreAuthorize("hasRole('TRAINER')")
    @GetMapping("/api/trainer/students/{username}/activity")
    public ActivityHeatmapResponse getStudentActivity(@PathVariable String username) {
        return dashboardService.getActivityHeatmap(username);
    }
}
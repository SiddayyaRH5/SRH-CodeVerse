// TrainerDashboardResponse.java (replace entirely)
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class TrainerDashboardResponse {
    private String username;
    private long totalProblems;
    private long totalStudents;
    private long totalSubmissions;
    private double successRate;
    private long activeToday;
    private long solvedToday;
    private long submissionsToday;
}
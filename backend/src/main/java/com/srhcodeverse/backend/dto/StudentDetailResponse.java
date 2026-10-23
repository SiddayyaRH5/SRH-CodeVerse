// StudentDetailResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor
public class StudentDetailResponse {
    private String username;
    private String email;
    private LocalDateTime joinedAt;
    private long problemsSolved;
    private int forgeStreakCurrent;
    private int forgeStreakLongest;
    private long totalSubmissions;
    private double successRate;
    private List<RecentSubmissionResponse> recentSubmissions; // reuse from trainer dashboard
    private List<AchievementResponse> achievements; // reuse from Phase 14
}
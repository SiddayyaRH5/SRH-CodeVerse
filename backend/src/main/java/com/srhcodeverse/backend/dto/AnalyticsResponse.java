// AnalyticsResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data @Builder @AllArgsConstructor
public class AnalyticsResponse {
    private List<DayCount> submissionTrend;      // last 7 days
    private Map<String, Long> difficultyDistribution; // EASY/MEDIUM/HARD -> count
    private List<StudentActivity> studentActivity;    // per-student recent activity
}
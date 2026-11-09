package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class DashboardResponse {
    private String username;
    private String role;
    private int problemsSolved;
    private int forgeStreakCurrent;
    private int forgeStreakLongest;
    private Integer rank; // nullable - no leaderboard yet
}
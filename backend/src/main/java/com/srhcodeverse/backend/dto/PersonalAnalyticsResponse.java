package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class PersonalAnalyticsResponse {
    private long problemsSolved;
    private long totalAvailableProblems;
    private double solveCoverage;
    private int currentStreak;
    private long activeDays;
    private List<DayCount> activity;
    private List<DifficultyMastery> difficultyMastery;
}

package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ProblemResponse {
    private Long id;
    private String title;
    private String description;
    private String difficulty;
    private String topic;
    private String constraints;
    private String starterCode;
    private Integer estimatedTimeMinutes;
    private String hint1;
    private String hint2;
    private String hint3;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private List<TestCaseResponse> testCases;
}
package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ProblemDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String difficulty;
    private String topic;
    private String constraints;
    private String starterCode;
    private Integer estimatedTimeMinutes;
    private List<VisibleTestCaseResponse> visibleTestCases;
    // Deliberately NO hint1/hint2/hint3 here - hints are fetched separately, on demand
    // Deliberately NO hidden test cases - ever
}
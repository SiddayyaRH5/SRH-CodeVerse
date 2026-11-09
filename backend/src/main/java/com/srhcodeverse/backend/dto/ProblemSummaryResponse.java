package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ProblemSummaryResponse {
    private Long id;
    private String title;
    private String difficulty;
    private String topic;
    private Integer estimatedTimeMinutes;
    private boolean solved;
}
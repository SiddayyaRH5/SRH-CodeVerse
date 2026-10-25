package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResponse {

    private boolean success;
    private String status;
    private String output;
    private String error;
    private Long runtimeMs;
    private Integer passedTestCount;
    private Integer totalTestCount;
    private List<TestResult> results;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestResult {
        private Integer testCaseNumber;
        private boolean passed;
        private String actualOutput;
        private String expectedOutput;
        private String error;
    }
}
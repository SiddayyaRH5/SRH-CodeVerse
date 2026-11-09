// SubmissionResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder @AllArgsConstructor
public class SubmissionResponse {
    private String status;
    private int passedTestCount;
    private int totalTestCount;
    private long runtimeMs;
    private String compileError;
    private List<TestCaseResult> testResults;
}
// TestCaseResult.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class TestCaseResult {
    private int testNumber;
    private boolean hidden;
    private boolean passed;
    private String input;          // null if hidden
    private String expectedOutput; // null if hidden
    private String actualOutput;   // null if hidden
    private String errorMessage;
}
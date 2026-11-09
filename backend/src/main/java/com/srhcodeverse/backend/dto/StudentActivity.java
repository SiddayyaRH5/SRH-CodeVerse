// StudentActivity.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class StudentActivity {
    private String username;
    private long problemsSolved;
    private long totalSubmissions;
    private String lastActive; // ISO date or "Never"
}
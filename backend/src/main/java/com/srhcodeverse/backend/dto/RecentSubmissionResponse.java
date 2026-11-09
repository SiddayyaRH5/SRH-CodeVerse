// RecentSubmissionResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class RecentSubmissionResponse {
    private String studentUsername;
    private String problemTitle;
    private String status;
    private LocalDateTime submittedAt;
}
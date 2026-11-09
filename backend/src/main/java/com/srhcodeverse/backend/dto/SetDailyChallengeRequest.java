// SetDailyChallengeRequest.java
package com.srhcodeverse.backend.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SetDailyChallengeRequest {
    @NotNull
    private Long problemId;
    private Integer rewardPoints;
}
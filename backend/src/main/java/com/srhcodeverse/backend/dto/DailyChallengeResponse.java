// DailyChallengeResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class DailyChallengeResponse {
    private Long problemId;
    private String title;
    private String difficulty;
    private String topic;
    private Integer rewardPoints;
    private boolean solvedToday;
}
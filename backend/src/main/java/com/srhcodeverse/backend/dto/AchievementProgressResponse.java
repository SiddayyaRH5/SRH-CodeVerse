// AchievementProgressResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class AchievementProgressResponse {
    private String code;
    private String name;
    private String description;
    private String icon;
    private boolean earned;
    private LocalDateTime earnedAt; // null if not earned
    private long currentProgress;   // e.g. 23 problems solved
    private long targetProgress;    // e.g. 50 for SOLVED_50
}
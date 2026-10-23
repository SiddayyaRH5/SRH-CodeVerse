// AchievementResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class AchievementResponse {
    private String code;
    private String name;
    private String description;
    private String icon;
    private LocalDateTime earnedAt;
}
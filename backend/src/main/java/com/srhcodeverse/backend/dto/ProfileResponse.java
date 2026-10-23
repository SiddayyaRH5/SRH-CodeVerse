// ProfileResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor
public class ProfileResponse {
    private String username;
    private String email;
    private String role;
    private LocalDateTime createdAt;
    private Long problemsSolved;   // null for trainers
    private Integer forgeStreakCurrent; // null for trainers
    private Long problemsCreated;  // null for students
}
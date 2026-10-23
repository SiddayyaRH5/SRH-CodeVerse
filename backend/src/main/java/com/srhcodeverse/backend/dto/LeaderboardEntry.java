// LeaderboardEntry.java
package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class LeaderboardEntry {
    private int rank;
    private String username;
    private long problemsSolved;
    private int forgeStreakCurrent;
}
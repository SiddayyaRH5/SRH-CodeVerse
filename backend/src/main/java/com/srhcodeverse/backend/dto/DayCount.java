// DayCount.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data @Builder @AllArgsConstructor
public class DayCount {
    private String date; // "2026-08-09"
    private long count;
}
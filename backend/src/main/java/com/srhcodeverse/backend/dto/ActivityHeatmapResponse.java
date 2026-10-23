// ActivityHeatmapResponse.java
package com.srhcodeverse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder @AllArgsConstructor
public class ActivityHeatmapResponse {
    private List<DayCount> days; // reuse the DayCount DTO from Phase 15
}
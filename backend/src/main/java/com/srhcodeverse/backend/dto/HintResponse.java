package com.srhcodeverse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class HintResponse {
    private int hintNumber;
    private String hint;
}
package com.srhcodeverse.backend.dto;

import lombok.Data;

@Data
public class SubmissionRequest {
    private String code;
    private String language = "java";
}
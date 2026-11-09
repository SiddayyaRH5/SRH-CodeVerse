package com.srhcodeverse.backend.dto;

import java.time.LocalDateTime;

public record SubmissionHistoryResponse(
        Long id,
        Long problemId,
        String problemTitle,
        String code,
        String status,
        Integer passedTestCount,
        Integer totalTestCount,
        Long runtimeMs,
        LocalDateTime submittedAt
) {}

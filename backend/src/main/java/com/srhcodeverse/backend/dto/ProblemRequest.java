package com.srhcodeverse.backend.dto;

import com.srhcodeverse.backend.entity.Problem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ProblemRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Difficulty is required")
    private Problem.Difficulty difficulty;

    @NotBlank(message = "Topic is required")
    private String topic;

    private String constraints;
    private String starterCode;
    private Integer estimatedTimeMinutes;
    private String hint1;
    private String hint2;
    private String hint3;

    @Valid
    private List<TestCaseRequest> testCases;
}
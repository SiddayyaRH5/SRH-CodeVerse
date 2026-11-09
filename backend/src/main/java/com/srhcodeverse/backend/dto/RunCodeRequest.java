package com.srhcodeverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RunCodeRequest {

    @NotBlank
    private String code;

    private String input = "";
}
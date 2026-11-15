package com.srhcodeverse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OAuthCodeExchangeRequest(
        @NotBlank(message = "Code is required")
        @Size(max = 128, message = "Code is invalid")
        String code) {}

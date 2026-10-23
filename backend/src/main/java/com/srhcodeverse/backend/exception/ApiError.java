package com.srhcodeverse.backend.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.Instant;

@Data
@AllArgsConstructor
public class ApiError {
    private boolean success;
    private String message;
    private String timestamp;

    public ApiError(String message) {
        this.success = false;
        this.message = message;
        this.timestamp = Instant.now().toString();
    }
}
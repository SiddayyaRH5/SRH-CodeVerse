package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.AuthResponse;
import com.srhcodeverse.backend.dto.LoginRequest;
import com.srhcodeverse.backend.dto.OAuthCodeExchangeRequest;
import com.srhcodeverse.backend.dto.RegisterRequest;
import com.srhcodeverse.backend.exception.ApiError;
import com.srhcodeverse.backend.service.AuthService;
import com.srhcodeverse.backend.service.OAuthCodeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final OAuthCodeService oAuthCodeService;

    public AuthController(AuthService authService, OAuthCodeService oAuthCodeService) {
        this.authService = authService;
        this.oAuthCodeService = oAuthCodeService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/oauth/exchange-code")
    public ResponseEntity<?> exchangeOAuthCode(
            @Valid @RequestBody(required = false) OAuthCodeExchangeRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(new ApiError("Invalid OAuth code request"));
        }
        return oAuthCodeService.exchangeCode(request.code())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ApiError("Invalid or expired OAuth code")));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedRequestBody(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(new ApiError("Invalid request body"));
    }
}
package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.AuthResponse;
import com.srhcodeverse.backend.entity.OAuthCode;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.OAuthCodeRepository;
import com.srhcodeverse.backend.security.JwtUtil;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OAuthCodeService {

    private static final int CODE_TTL_SECONDS = 60;
    private static final int MAX_CODE_LENGTH = 128;

    private final OAuthCodeRepository oAuthCodeRepository;
    private final JwtUtil jwtUtil;

    public OAuthCodeService(OAuthCodeRepository oAuthCodeRepository, JwtUtil jwtUtil) {
        this.oAuthCodeRepository = oAuthCodeRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public String issueCode(User user) {
        String rawCode = OAuthCode.generateCode();
        LocalDateTime now = LocalDateTime.now();
        OAuthCode oauthCode = OAuthCode.builder()
                .codeHash(OAuthCode.hashCodeFor(rawCode))
                .createdAt(now)
                .expiryAt(now.plusSeconds(CODE_TTL_SECONDS))
                .consumed(false)
                .expired(false)
                .user(user)
                .build();
        oAuthCodeRepository.saveAndFlush(oauthCode);
        return rawCode;
    }

    @Transactional
    public Optional<AuthResponse> exchangeCode(String rawCode) {
        if (rawCode == null || rawCode.isBlank() || rawCode.length() > MAX_CODE_LENGTH) {
            return Optional.empty();
        }

        String codeHash = OAuthCode.hashCodeFor(rawCode);
        int consumed = oAuthCodeRepository.consumeIfUsable(codeHash, LocalDateTime.now());
        if (consumed != 1) {
            return Optional.empty();
        }

        OAuthCode oauthCode = oAuthCodeRepository.findByCodeHash(codeHash)
                .orElseThrow(() -> new IllegalStateException("Consumed OAuth code was not found"));
        User user = oauthCode.getUser();
        String role = user.getRole().getName();
        return Optional.of(new AuthResponse(
                jwtUtil.generateToken(user.getUsername(), role),
                user.getUsername(),
                role));
    }
}

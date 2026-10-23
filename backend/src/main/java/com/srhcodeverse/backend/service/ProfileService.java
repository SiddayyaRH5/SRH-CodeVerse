package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.ChangePasswordRequest;
import com.srhcodeverse.backend.dto.ProfileResponse;
import com.srhcodeverse.backend.dto.UpdateProfileRequest;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.ProblemRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository, SubmissionRepository submissionRepository,
                           ProblemRepository problemRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.problemRepository = problemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isTrainer = "TRAINER".equals(user.getRole().getName());

        return ProfileResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .createdAt(user.getCreatedAt())
                .problemsSolved(isTrainer ? null : submissionRepository.countDistinctSolvedProblems(user))
                .forgeStreakCurrent(isTrainer ? null : user.getForgeStreakCurrent())
                .problemsCreated(isTrainer ? problemRepository.countByCreatedBy(user) : null)
                .build();
    }

    public void updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        user.setEmail(request.getEmail());
        userRepository.save(user);
    }

    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
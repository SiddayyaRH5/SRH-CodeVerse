package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.LeaderboardEntry;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SubmissionRepository submissionRepository;

    public LeaderboardService(UserRepository userRepository, RoleRepository roleRepository,
                               SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.submissionRepository = submissionRepository;
    }

    public List<LeaderboardEntry> getLeaderboard() {
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new IllegalStateException("STUDENT role not seeded"));

        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole().getId().equals(studentRole.getId()))
                .toList();

        Map<Long, Long> solvedCounts = submissionRepository.countSolvedGroupedByStudent().stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));

        List<User> ranked = students.stream()
                .sorted((a, b) -> {
                    long solvedA = solvedCounts.getOrDefault(a.getId(), 0L);
                    long solvedB = solvedCounts.getOrDefault(b.getId(), 0L);
                    if (solvedB != solvedA) return Long.compare(solvedB, solvedA); // more solved = better
                    return Integer.compare(b.getForgeStreakCurrent(), a.getForgeStreakCurrent()); // tie-break: streak
                })
                .toList();

        List<LeaderboardEntry> result = new ArrayList<>();
        for (int i = 0; i < ranked.size(); i++) {
            User u = ranked.get(i);
            result.add(LeaderboardEntry.builder()
                    .rank(i + 1)
                    .username(u.getUsername())
                    .problemsSolved(solvedCounts.getOrDefault(u.getId(), 0L))
                    .forgeStreakCurrent(u.getForgeStreakCurrent())
                    .build());
        }
        return result;
    }

    public Integer getRankForUser(String username) {
        List<LeaderboardEntry> leaderboard = getLeaderboard();
        return leaderboard.stream()
                .filter(e -> e.getUsername().equals(username))
                .map(LeaderboardEntry::getRank)
                .findFirst()
                .orElse(null);
    }
}
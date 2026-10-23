package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.AchievementResponse;
import com.srhcodeverse.backend.dto.ActivityHeatmapResponse;
import com.srhcodeverse.backend.dto.DashboardResponse;
import com.srhcodeverse.backend.dto.DayCount;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.UserRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.StudentAchievementRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final LeaderboardService leaderboardService;
    private final StudentAchievementRepository studentAchievementRepository;

    public DashboardService(
            UserRepository userRepository,
            SubmissionRepository submissionRepository,
            LeaderboardService leaderboardService,
            StudentAchievementRepository studentAchievementRepository) {

        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.leaderboardService = leaderboardService;
        this.studentAchievementRepository = studentAchievementRepository;
    }

    public DashboardResponse getDashboard(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        long solvedCount =
                submissionRepository.countDistinctSolvedProblems(user);

        return DashboardResponse.builder()
                .username(user.getUsername())
                .role(user.getRole().getName())
                .problemsSolved((int) solvedCount)
                .forgeStreakCurrent(user.getForgeStreakCurrent())
                .forgeStreakLongest(user.getForgeStreakLongest())
                .rank(leaderboardService.getRankForUser(username))
                .build();
    }
    
    
    public ActivityHeatmapResponse getActivityHeatmap(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        java.time.LocalDate startDate = java.time.LocalDate.now().minusDays(90);
        Map<String, Long> countsByDate = submissionRepository
                .countSubmissionsByDayForStudent(user, startDate.atStartOfDay()).stream()
                .collect(Collectors.toMap(row -> row[0].toString(), row -> (Long) row[1]));

        List<DayCount> days = new ArrayList<>();
        for (int i = 90; i >= 0; i--) {
            String date = java.time.LocalDate.now().minusDays(i).toString();
            days.add(DayCount.builder().date(date).count(countsByDate.getOrDefault(date, 0L)).build());
        }

        return ActivityHeatmapResponse.builder().days(days).build();
    }

    public List<AchievementResponse> getAchievements(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return studentAchievementRepository
                .findByStudentOrderByEarnedAtDesc(user)
                .stream()
                .map(sa -> AchievementResponse.builder()
                        .code(sa.getAchievement().getCode())
                        .name(sa.getAchievement().getName())
                        .description(sa.getAchievement().getDescription())
                        .icon(sa.getAchievement().getIcon())
                        .earnedAt(sa.getEarnedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
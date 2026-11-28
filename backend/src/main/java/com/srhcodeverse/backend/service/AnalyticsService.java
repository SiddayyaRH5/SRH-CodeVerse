package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.*;
import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    /** Blank keeps the previous JVM-default-zone behaviour. */
    @Value("${codeverse.analytics.timezone:}")
    private String configuredTimezone;

    public AnalyticsService(SubmissionRepository submissionRepository, ProblemRepository problemRepository,
                             UserRepository userRepository, RoleRepository roleRepository) {
        this.submissionRepository = submissionRepository;
        this.problemRepository = problemRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public AnalyticsResponse getAnalytics() {
        return AnalyticsResponse.builder()
                .submissionTrend(getSubmissionTrend())
                .difficultyDistribution(getDifficultyDistribution())
                .studentActivity(getStudentActivity())
                .build();
    }

    @Transactional(readOnly = true)
    public PersonalAnalyticsResponse getAnalyticsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long solved = submissionRepository.countDistinctSolvedProblems(user);
        long totalAvailable = problemRepository.count();
        Set<Long> solvedProblemIds = new HashSet<>(submissionRepository.findDistinctSolvedProblemIds(user));
        Set<LocalDate> acceptedDays = submissionRepository
                .findDistinctAcceptedSubmissionDatesByStudent(user)
                .stream()
                .map(this::toLocalDate)
                .collect(Collectors.toSet());

        return PersonalAnalyticsResponse.builder()
                .problemsSolved(solved)
                .totalAvailableProblems(totalAvailable)
                .solveCoverage(totalAvailable == 0 ? 0 : (solved * 100.0) / totalAvailable)
                .currentStreak(calculateCurrentStreak(acceptedDays, LocalDate.now()))
                .longestStreak(calculateLongestStreak(acceptedDays))
                .activeDays(acceptedDays.size())
                .activity(getActivityForUser(user, LocalDate.now()))
                .difficultyMastery(getDifficultyMastery(solvedProblemIds))
                .build();
    }

    private int calculateCurrentStreak(Set<LocalDate> acceptedDays, LocalDate today) {
        LocalDate cursor = acceptedDays.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (acceptedDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private int calculateLongestStreak(Set<LocalDate> acceptedDays) {
        if (acceptedDays.isEmpty()) {
            return 0;
        }
        List<LocalDate> sortedDates = new ArrayList<>(acceptedDays);
        Collections.sort(sortedDates);
        int longest = 1;
        int current = 1;
        for (int i = 1; i < sortedDates.size(); i++) {
            LocalDate prev = sortedDates.get(i - 1);
            LocalDate curr = sortedDates.get(i);
            if (curr.equals(prev.plusDays(1))) {
                current++;
                if (current > longest) {
                    longest = current;
                }
            } else {
                current = 1;
            }
        }
        return longest;
    }

    private ZoneId zone() {
        return configuredTimezone == null || configuredTimezone.isBlank()
                ? ZoneId.systemDefault()
                : ZoneId.of(configuredTimezone);
    }

    private LocalDate toLocalDate(Object value) {
        return AnalyticsDates.toLocalDate(value, zone());
    }

    private List<DayCount> getActivityForUser(User user, LocalDate today) {
        LocalDate startDate = today.minusDays(13);
        Map<LocalDate, Long> countsByDate = AnalyticsDates.countByDay(
                submissionRepository.findSubmissionTimesForStudentAfter(user, startDate.atStartOfDay()),
                zone());

        List<DayCount> activity = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            activity.add(DayCount.builder()
                    .date(date.toString())
                    .count(countsByDate.getOrDefault(date, 0L))
                    .build());
        }
        return activity;
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        throw new IllegalStateException("Unsupported submission count value: " + value);
    }

    private List<DifficultyMastery> getDifficultyMastery(Set<Long> solvedProblemIds) {
        Map<Problem.Difficulty, Long> totalByDifficulty = new EnumMap<>(Problem.Difficulty.class);
        Map<Problem.Difficulty, Long> solvedByDifficulty = new EnumMap<>(Problem.Difficulty.class);
        for (Problem problem : problemRepository.findAll()) {
            totalByDifficulty.merge(problem.getDifficulty(), 1L, Long::sum);
            if (solvedProblemIds.contains(problem.getId())) {
                solvedByDifficulty.merge(problem.getDifficulty(), 1L, Long::sum);
            }
        }

        return Arrays.stream(Problem.Difficulty.values())
                .map(difficulty -> new DifficultyMastery(
                        difficulty.name(),
                        solvedByDifficulty.getOrDefault(difficulty, 0L),
                        totalByDifficulty.getOrDefault(difficulty, 0L)))
                .toList();
    }

    private List<DayCount> getSubmissionTrend() {
        LocalDateTime sevenDaysAgo = java.time.LocalDate.now().minusDays(6).atStartOfDay();
        Map<LocalDate, Long> countsByDate = AnalyticsDates.countByDay(
                submissionRepository.findSubmissionTimesAfter(sevenDaysAgo), zone());

        List<DayCount> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = java.time.LocalDate.now().minusDays(i);
            trend.add(DayCount.builder().date(date.toString())
                    .count(countsByDate.getOrDefault(date, 0L)).build());
        }
        return trend;
    }

    private Map<String, Long> getDifficultyDistribution() {
        Map<String, Long> dist = new LinkedHashMap<>();
        for (Problem.Difficulty d : Problem.Difficulty.values()) {
            dist.put(d.name(), problemRepository.countByDifficulty(d));
        }
        return dist;
    }

    private List<StudentActivity> getStudentActivity() {
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new IllegalStateException("STUDENT role not seeded"));

        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole().getId().equals(studentRole.getId()))
                .toList();

        return students.stream()
                .map(s -> {
                    long solved = submissionRepository.countDistinctSolvedProblems(s);
                    long total = submissionRepository.countByStudent(s);
                    var submissions = submissionRepository.findByStudentOrderBySubmittedAtDesc(s);
                    String lastActive = submissions.isEmpty() ? "Never" : submissions.get(0).getSubmittedAt().toString();

                    return StudentActivity.builder()
                            .username(s.getUsername())
                            .problemsSolved(solved)
                            .totalSubmissions(total)
                            .lastActive(lastActive)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getProblemsSolved(), a.getProblemsSolved()))
                .collect(Collectors.toList());
    }
}

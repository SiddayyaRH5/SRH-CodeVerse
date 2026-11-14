package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.ProblemRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnalyticsServiceTest {

    @Test
    void calculatesPersonalAnalyticsFromAcceptedSubmissionsOnly() {
        LocalDate today = LocalDate.now();
        User user = User.builder().id(11L).username("student").build();
        List<Object> acceptedDates = List.of(
                java.sql.Timestamp.valueOf(today.atStartOfDay()),
                java.sql.Date.valueOf(today.minusDays(1)),
                today.minusDays(4));

        UserRepository userRepository = repository(UserRepository.class, (method, args) ->
                method.getName().equals("findByUsername") ? Optional.of(user) : null);
        List<Problem> problems = List.of(
                Problem.builder().id(1L).difficulty(Problem.Difficulty.EASY).build(),
                Problem.builder().id(2L).difficulty(Problem.Difficulty.EASY).build(),
                Problem.builder().id(3L).difficulty(Problem.Difficulty.MEDIUM).build(),
                Problem.builder().id(4L).difficulty(Problem.Difficulty.MEDIUM).build(),
                Problem.builder().id(5L).difficulty(Problem.Difficulty.HARD).build());
        ProblemRepository problemRepository = repository(ProblemRepository.class, (method, args) -> switch (method.getName()) {
            case "count" -> 5L;
            case "findAll" -> problems;
            default -> null;
        });
        SubmissionRepository submissionRepository = repository(SubmissionRepository.class, (method, args) -> switch (method.getName()) {
            case "countDistinctSolvedProblems" -> 2L;
            case "findDistinctAcceptedSubmissionDatesByStudent" -> acceptedDates;
            case "countSubmissionsByDayForStudent" -> List.of(
                    new Object[] { today.toString(), 3L },
                    new Object[] { today.minusDays(1).toString(), 1L });
            case "findDistinctSolvedProblemIds" -> List.of(1L, 3L);
            default -> null;
        });

        AnalyticsService service = new AnalyticsService(submissionRepository, problemRepository,
                userRepository, null);
        var analytics = service.getAnalyticsForUser("student");

        assertEquals(2L, analytics.getProblemsSolved());
        assertEquals(5L, analytics.getTotalAvailableProblems());
        assertEquals(40.0, analytics.getSolveCoverage());
        assertEquals(2, analytics.getCurrentStreak());
        assertEquals(3L, analytics.getActiveDays());
        assertEquals(14, analytics.getActivity().size());
        assertEquals(3L, analytics.getActivity().getLast().getCount());
        assertEquals(List.of(1L, 1L, 0L), analytics.getDifficultyMastery().stream()
                .map(item -> item.solved()).toList());
        assertEquals(List.of(2L, 2L, 1L), analytics.getDifficultyMastery().stream()
                .map(item -> item.total()).toList());
    }

    @SuppressWarnings("unchecked")
    private <T> T repository(Class<T> type, RepositoryMethod handler) {
        return (T) Proxy.newProxyInstance(getClass().getClassLoader(), new Class<?>[] { type },
                (proxy, method, args) -> handler.invoke(method, args));
    }

    @FunctionalInterface
    private interface RepositoryMethod {
        Object invoke(java.lang.reflect.Method method, Object[] args);
    }
}

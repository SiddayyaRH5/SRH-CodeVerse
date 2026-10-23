package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.AchievementProgressResponse;
import com.srhcodeverse.backend.entity.Achievement;
import com.srhcodeverse.backend.entity.StudentAchievement;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.AchievementRepository;
import com.srhcodeverse.backend.repository.StudentAchievementRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

@Service
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final StudentAchievementRepository studentAchievementRepository;
    private final SubmissionRepository submissionRepository;

    public AchievementService(
            AchievementRepository achievementRepository,
            StudentAchievementRepository studentAchievementRepository,
            SubmissionRepository submissionRepository) {

        this.achievementRepository = achievementRepository;
        this.studentAchievementRepository = studentAchievementRepository;
        this.submissionRepository = submissionRepository;
    }

    /**
     * Call this after every PASSED submission.
     * Checks and awards any newly earned achievements.
     */
    public void checkAndAwardAchievements(User student, boolean isDailyChallenge) {

        // =========================================================
        // SOLVED PROBLEMS ACHIEVEMENTS
        // =========================================================

        long solvedCount =
                submissionRepository.countDistinctSolvedProblems(student);

        awardIfEligible(
                student,
                "FIRST_SOLUTION",
                solvedCount >= 1
        );

        awardIfEligible(
                student,
                "SOLVED_10",
                solvedCount >= 10
        );

        awardIfEligible(
                student,
                "SOLVED_50",
                solvedCount >= 50
        );

        awardIfEligible(
                student,
                "SOLVED_100",
                solvedCount >= 100
        );

        awardIfEligible(
                student,
                "SOLVED_500",
                solvedCount >= 500
        );

        // =========================================================
        // STREAK ACHIEVEMENTS
        // =========================================================

        int streak = student.getForgeStreakCurrent();

        awardIfEligible(
                student,
                "STREAK_3",
                streak >= 3
        );

        awardIfEligible(
                student,
                "STREAK_7",
                streak >= 7
        );

        awardIfEligible(
                student,
                "STREAK_15",
                streak >= 15
        );

        awardIfEligible(
                student,
                "STREAK_30",
                streak >= 30
        );

        awardIfEligible(
                student,
                "STREAK_50",
                streak >= 50
        );

        awardIfEligible(
                student,
                "STREAK_100",
                streak >= 100
        );

        // =========================================================
        // DAILY CHALLENGE ACHIEVEMENT
        // =========================================================

        if (isDailyChallenge) {
            awardIfEligible(
                    student,
                    "DAILY_CHAMPION",
                    true
            );
        }
    }

    /**
     * Returns every achievement along with the student's
     * current progress.
     */
    public List<AchievementProgressResponse> getAllAchievementsWithProgress(
            User student) {

        // =========================================================
        // GET ALL ACHIEVEMENTS
        // =========================================================

        List<Achievement> allAchievements =
                achievementRepository.findAll();

        // =========================================================
        // GET EARNED ACHIEVEMENTS
        // =========================================================

        List<StudentAchievement> earned =
                studentAchievementRepository
                        .findByStudentOrderByEarnedAtDesc(student);

        // =========================================================
        // CREATE MAP OF EARNED ACHIEVEMENTS
        // =========================================================

        Map<String, LocalDateTime> earnedMap =
                earned.stream()
                        .collect(Collectors.toMap(
                                sa -> sa.getAchievement().getCode(),
                                StudentAchievement::getEarnedAt,
                                (existing, replacement) -> existing
                        ));

        // =========================================================
        // CURRENT USER PROGRESS
        // =========================================================

        long solvedCount =
                submissionRepository.countDistinctSolvedProblems(student);

        int streak =
                student.getForgeStreakCurrent();

        // =========================================================
        // BUILD RESPONSE
        // =========================================================

        return allAchievements.stream()

                .map(achievement -> {

                    String code = achievement.getCode();

                    boolean isEarned =
                            earnedMap.containsKey(code);

                    long currentProgress;
                    long targetProgress;

                    // =================================================
                    // SOLVED PROBLEMS
                    // =================================================

                    if (code.startsWith("SOLVED_")) {

                        targetProgress =
                                Long.parseLong(
                                        code.replace("SOLVED_", "")
                                );

                        currentProgress =
                                Math.min(
                                        solvedCount,
                                        targetProgress
                                );
                    }

                    // =================================================
                    // STREAK
                    // =================================================

                    else if (code.startsWith("STREAK_")) {

                        targetProgress =
                                Long.parseLong(
                                        code.replace("STREAK_", "")
                                );

                        currentProgress =
                                Math.min(
                                        streak,
                                        targetProgress
                                );
                    }

                    // =================================================
                    // FIRST SOLUTION
                    // =================================================

                    else if (code.equals("FIRST_SOLUTION")) {

                        targetProgress = 1;

                        currentProgress =
                                Math.min(
                                        solvedCount,
                                        1
                                );
                    }

                    // =================================================
                    // DAILY CHAMPION
                    // =================================================

                    else if (code.equals("DAILY_CHAMPION")) {

                        targetProgress = 1;

                        currentProgress =
                                isEarned ? 1 : 0;
                    }

                    // =================================================
                    // FUTURE / CUSTOM ACHIEVEMENTS
                    // =================================================

                    else {

                        targetProgress = 1;

                        currentProgress =
                                isEarned ? 1 : 0;
                    }

                    // =================================================
                    // BUILD RESPONSE
                    // =================================================

                    return AchievementProgressResponse.builder()
                            .code(code)
                            .name(achievement.getName())
                            .description(achievement.getDescription())
                            .icon(achievement.getIcon())
                            .earned(isEarned)
                            .earnedAt(earnedMap.get(code))
                            .currentProgress(currentProgress)
                            .targetProgress(targetProgress)
                            .build();
                })

                // =====================================================
                // SORTING
                // =====================================================
                // 1. Earned achievements first
                // 2. Higher progress percentage first
                // =====================================================

                .sorted((a, b) -> {

                    // Earned first
                    if (a.isEarned() && !b.isEarned()) {
                        return -1;
                    }

                    if (!a.isEarned() && b.isEarned()) {
                        return 1;
                    }

                    // Calculate progress percentage
                    double progressA =
                            a.getTargetProgress() == 0
                                    ? 0
                                    : (double) a.getCurrentProgress()
                                    / a.getTargetProgress();

                    double progressB =
                            b.getTargetProgress() == 0
                                    ? 0
                                    : (double) b.getCurrentProgress()
                                    / b.getTargetProgress();

                    // Higher progress first
                    return Double.compare(
                            progressB,
                            progressA
                    );
                })

                .collect(Collectors.toList());
    }

    /**
     * Awards an achievement if the student is eligible
     * and has not already earned it.
     */
    private void awardIfEligible(
            User student,
            String code,
            boolean eligible) {

        // Student is not eligible
        if (!eligible) {
            return;
        }

        // Achievement already earned
        if (studentAchievementRepository
                .existsByStudentAndAchievement_Code(
                        student,
                        code)) {

            return;
        }

        // Find achievement
        Achievement achievement =
                achievementRepository
                        .findByCode(code)
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Achievement not seeded: " + code
                                )
                        );

        // Create student achievement
        StudentAchievement studentAchievement =
                StudentAchievement.builder()
                        .student(student)
                        .achievement(achievement)
                        .build();

        // Save
        studentAchievementRepository.save(
                studentAchievement
        );
    }
}
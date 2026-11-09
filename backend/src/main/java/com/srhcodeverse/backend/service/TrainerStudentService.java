package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.AchievementResponse;
import com.srhcodeverse.backend.dto.RecentSubmissionResponse;
import com.srhcodeverse.backend.dto.StudentDetailResponse;
import com.srhcodeverse.backend.dto.StudentSummaryResponse;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.StudentAchievementRepository;
import com.srhcodeverse.backend.repository.SubmissionRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TrainerStudentService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SubmissionRepository submissionRepository;
    private final StudentAchievementRepository studentAchievementRepository;

    public TrainerStudentService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            SubmissionRepository submissionRepository,
            StudentAchievementRepository studentAchievementRepository) {

        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.submissionRepository = submissionRepository;
        this.studentAchievementRepository = studentAchievementRepository;
    }

    public List<StudentSummaryResponse> getAllStudents() {

        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() ->
                        new IllegalStateException("STUDENT role not seeded"));

        List<User> students = userRepository.findAll()
                .stream()
                .filter(u ->
                        u.getRole() != null &&
                        u.getRole().getId().equals(studentRole.getId()))
                .toList();

        return students.stream()
                .map(s -> {

                    long solved =
                            submissionRepository.countDistinctSolvedProblems(s);

                    long total =
                            submissionRepository.countByStudent(s);

                    var submissions =
                            submissionRepository
                                    .findByStudentOrderBySubmittedAtDesc(s);

                    String lastActive =
                            submissions.isEmpty()
                                    ? "Never"
                                    : submissions.get(0)
                                            .getSubmittedAt()
                                            .toString();

                    return StudentSummaryResponse.builder()
                            .username(s.getUsername())
                            .email(s.getEmail())
                            .problemsSolved(solved)
                            .forgeStreakCurrent(s.getForgeStreakCurrent())
                            .forgeStreakLongest(s.getForgeStreakLongest())
                            .totalSubmissions(total)
                            .lastActive(lastActive)
                            .joinedAt(s.getCreatedAt())
                            .build();
                })
                .sorted((a, b) ->
                        Long.compare(
                                b.getProblemsSolved(),
                                a.getProblemsSolved()))
                .collect(Collectors.toList());
    }

    public StudentDetailResponse getStudentDetail(String username) {

        User student = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new IllegalArgumentException("Student not found"));

        // Problems solved
        long solved =
                submissionRepository.countDistinctSolvedProblems(student);

        // Total submissions
        long total =
                submissionRepository.countByStudent(student);

        // Passed submissions
        long passed =
                submissionRepository.countByStudentAndStatus(
                        student,
                        Submission.Status.PASSED
                );

        // Success rate
        double successRate =
                total == 0
                        ? 0.0
                        : (passed * 100.0) / total;

        // Recent submissions
        List<RecentSubmissionResponse> recent =
                submissionRepository
                        .findTop15ByStudentOrderBySubmittedAtDesc(student)
                        .stream()
                        .map(s ->
                                RecentSubmissionResponse.builder()
                                        .studentUsername(
                                                student.getUsername())
                                        .problemTitle(
                                                s.getProblem().getTitle())
                                        .status(
                                                s.getStatus().name())
                                        .submittedAt(
                                                s.getSubmittedAt())
                                        .build()
                        )
                        .collect(Collectors.toList());

        // Achievements
        List<AchievementResponse> achievements =
                studentAchievementRepository
                        .findByStudentOrderByEarnedAtDesc(student)
                        .stream()
                        .map(sa ->
                                AchievementResponse.builder()
                                        .code(
                                                sa.getAchievement().getCode())
                                        .name(
                                                sa.getAchievement().getName())
                                        .description(
                                                sa.getAchievement()
                                                        .getDescription())
                                        .icon(
                                                sa.getAchievement().getIcon())
                                        .earnedAt(
                                                sa.getEarnedAt())
                                        .build()
                        )
                        .collect(Collectors.toList());

        // Final response
        return StudentDetailResponse.builder()
                .username(student.getUsername())
                .email(student.getEmail())
                .joinedAt(student.getCreatedAt())
                .problemsSolved(solved)
                .forgeStreakCurrent(
                        student.getForgeStreakCurrent())
                .forgeStreakLongest(
                        student.getForgeStreakLongest())
                .totalSubmissions(total)
                .successRate(
                        Math.round(successRate * 10) / 10.0)
                .recentSubmissions(recent)
                .achievements(achievements)
                .build();
    }
}
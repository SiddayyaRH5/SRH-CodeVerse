package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByStudentUsernameOrderBySubmittedAtDesc(String username);

    long countByStudent(User student);

    long countByStudentAndStatus(User student, Submission.Status status);

    long countByStatus(Submission.Status status);

    List<Submission> findByStudentOrderBySubmittedAtDesc(User student);

    List<Submission> findTop15ByStudentOrderBySubmittedAtDesc(User student);

    List<Submission> findTop10ByOrderBySubmittedAtDesc();

    Optional<Submission> findFirstByStudentAndProblemIdOrderBySubmittedAtDesc(
            User student, Long problemId);

    List<Submission> findByStudentAndStatus(
            User student, Submission.Status status);

    @Query("SELECT s.submittedAt FROM Submission s " +
           "WHERE s.student = :student AND s.status = 'PASSED' AND s.submittedAt IS NOT NULL " +
           "ORDER BY s.submittedAt")
    List<Object> findDistinctAcceptedSubmissionDatesByStudent(@Param("student") User student);

    boolean existsByStudent_UsernameAndProblem_IdAndStatusAndSubmittedAtAfter(
            String username, Long problemId, Submission.Status status,
            LocalDateTime submittedAt);

    long countByStatusAndSubmittedAtAfter(
            Submission.Status status, LocalDateTime submittedAt);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM Submission s " +
           "WHERE s.student = :student AND s.status = 'PASSED'")
    long countDistinctSolvedProblems(@Param("student") User student);

    /** Portable alternative to GROUP BY DATE(): fetch only timestamps, aggregate in Java. */
    @Query("SELECT s.submittedAt FROM Submission s WHERE s.submittedAt >= :since " +
           "ORDER BY s.submittedAt")
    List<Object> findSubmissionTimesAfter(@Param("since") LocalDateTime since);

    /** Per-student variant of findSubmissionTimesAfter; ownership is enforced by caller. */
    @Query("SELECT s.submittedAt FROM Submission s WHERE s.student = :student " +
           "AND s.submittedAt >= :since ORDER BY s.submittedAt")
    List<Object> findSubmissionTimesForStudentAfter(
            @Param("student") User student,
            @Param("since") LocalDateTime since);

    @Query("SELECT s.student.id, COUNT(DISTINCT s.problem.id) " +
           "FROM Submission s WHERE s.status = 'PASSED' " +
           "GROUP BY s.student.id")
    List<Object[]> countSolvedGroupedByStudent();

    @Query("SELECT DISTINCT s.problem.id FROM Submission s " +
           "WHERE s.student = :student AND s.status = 'PASSED'")
    List<Long> findDistinctSolvedProblemIds(@Param("student") User student);

    @Query("SELECT COUNT(DISTINCT s.student.id) FROM Submission s " +
           "WHERE s.submittedAt >= :since")
    long countActiveStudents(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(s) FROM Submission s " +
           "WHERE s.submittedAt >= :since")
    long countTodaysSubmissions(@Param("since") LocalDateTime since);

    @Query("SELECT s.problem.id, COUNT(s), " +
           "SUM(CASE WHEN s.status = 'PASSED' THEN 1 ELSE 0 END) " +
           "FROM Submission s GROUP BY s.problem.id")
    List<Object[]> getAttemptsAndPassesByProblem();
}

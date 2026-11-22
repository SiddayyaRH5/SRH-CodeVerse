package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.InterviewSession;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserOrderByStartedAtDesc(User user);
    Optional<InterviewSession> findByIdAndUser(Long id, User user);
    long countByUser(User user);
    long countByUserAndStatus(User user, String status);

    @Query("SELECT COALESCE(MAX(s.scorePercent), 0) FROM InterviewSession s " +
            "WHERE s.user = :user AND s.category = :category AND s.status = 'SUBMITTED'")
    Integer bestScore(@Param("user") User user, @Param("category") String category);
}

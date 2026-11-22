package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.InterviewQuestion;
import com.srhcodeverse.backend.entity.InterviewSession;
import com.srhcodeverse.backend.entity.InterviewSessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InterviewSessionQuestionRepository extends JpaRepository<InterviewSessionQuestion, Long> {
    List<InterviewSessionQuestion> findBySessionOrderByOrderIndexAsc(InterviewSession session);
    Optional<InterviewSessionQuestion> findBySessionAndQuestion(InterviewSession session, InterviewQuestion question);
    long countBySession(InterviewSession session);
}

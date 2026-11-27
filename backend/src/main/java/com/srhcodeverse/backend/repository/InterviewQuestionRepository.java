package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.InterviewQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestion, Long> {
    List<InterviewQuestion> findByActiveTrueOrderByIdAsc();
    List<InterviewQuestion> findByActiveTrueAndCategoryOrderByIdAsc(String category);
    List<InterviewQuestion> findByActiveTrueAndCategoryAndDifficultyOrderByIdAsc(String category, String difficulty);
    List<InterviewQuestion> findByIdInAndActiveTrue(Collection<Long> ids);
    long countByActiveTrue();
    long countByActiveTrueAndCategory(String category);
    long countByActiveTrueAndCategoryAndDifficulty(String category, String difficulty);
    long countByCategory(String category);
}

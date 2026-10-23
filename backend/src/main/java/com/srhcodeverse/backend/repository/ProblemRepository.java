package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Problem;
import com.srhcodeverse.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
	long countByDifficulty(Problem.Difficulty difficulty);
	long countByCreatedBy(User createdBy);
}
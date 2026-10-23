package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
}
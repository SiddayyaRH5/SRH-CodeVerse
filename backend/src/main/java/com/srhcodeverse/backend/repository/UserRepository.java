package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String username, String email, Pageable pageable);
}
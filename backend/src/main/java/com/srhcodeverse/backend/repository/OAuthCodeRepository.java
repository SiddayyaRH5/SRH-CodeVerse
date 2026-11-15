package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.OAuthCode;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OAuthCodeRepository extends JpaRepository<OAuthCode, Long> {

    Optional<OAuthCode> findByCodeHash(String codeHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE OAuthCode oauthCode
            SET oauthCode.consumed = true
            WHERE oauthCode.codeHash = :codeHash
              AND oauthCode.consumed = false
              AND oauthCode.expired = false
              AND oauthCode.expiryAt > :now
            """)
    int consumeIfUsable(
            @Param("codeHash") String codeHash,
            @Param("now") LocalDateTime now);
}
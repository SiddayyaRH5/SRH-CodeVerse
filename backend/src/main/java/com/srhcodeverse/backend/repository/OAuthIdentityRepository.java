package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.OAuthIdentity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OAuthIdentityRepository extends JpaRepository<OAuthIdentity, Long> {
    Optional<OAuthIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);
}

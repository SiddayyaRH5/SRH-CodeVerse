package com.srhcodeverse.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("publicLeaderboard");
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1)
                .expireAfterWrite(Duration.ofSeconds(45))
                .recordStats());
        return manager;
    }
}

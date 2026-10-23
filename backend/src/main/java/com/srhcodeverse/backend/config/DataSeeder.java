package com.srhcodeverse.backend.config;

import com.srhcodeverse.backend.entity.Achievement;
import com.srhcodeverse.backend.entity.Role;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.AchievementRepository;
import com.srhcodeverse.backend.repository.RoleRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AchievementRepository achievementRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${trainer.seed.password}")
    private String trainerSeedPassword;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            AchievementRepository achievementRepository,
            PasswordEncoder passwordEncoder) {

        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.achievementRepository = achievementRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedRole("STUDENT");
        seedRole("TRAINER");

        seedTrainerAccount();

        seedAchievements();
    }

    private void seedRole(String name) {
        if (roleRepository.findByName(name).isEmpty()) {

            Role role = Role.builder()
                    .name(name)
                    .build();

            roleRepository.save(role);

            System.out.println("Seeded role: " + name);
        }
    }

    private void seedTrainerAccount() {
        createTrainerIfNotExists(
                "yash_trainer",
                "yash.trainer@srhcodeverse.com",
                trainerSeedPassword
        );
    }

    private void createTrainerIfNotExists(
            String username,
            String email,
            String rawPassword) {

        if (userRepository.existsByUsername(username)) {
            return;
        }

        Role trainerRole = roleRepository.findByName("TRAINER")
                .orElseThrow(() ->
                        new IllegalStateException("TRAINER role not seeded"));

        User trainer = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(trainerRole)
                .build();

        userRepository.save(trainer);

        System.out.println("Seeded trainer account: " + username);
    }

    private void seedAchievements() {

        seedAchievement(
                "FIRST_SOLUTION",
                "First Solution",
                "Solved your first problem",
                "🔥"
        );

        seedAchievement(
                "SOLVED_10",
                "Getting Started",
                "Solved 10 problems",
                "🥉"
        );

        seedAchievement(
                "SOLVED_50",
                "Steel Sharpened",
                "Solved 50 problems",
                "🥈"
        );

        seedAchievement(
                "SOLVED_100",
                "Forge Master",
                "Solved 100 problems",
                "🥇"
        );

        seedAchievement(
                "SOLVED_500",
                "Legendary Forger",
                "Solved 500 problems",
                "💎"
        );

        seedAchievement(
                "STREAK_3",
                "Warming Up",
                "3-day forge streak",
                "🔥"
        );

        seedAchievement(
                "STREAK_7",
                "One Week Strong",
                "7-day forge streak",
                "🔥"
        );

        seedAchievement(
                "STREAK_15",
                "Half a Month",
                "15-day forge streak",
                "🔥"
        );

        seedAchievement(
                "STREAK_30",
                "One Month Strong",
                "30-day forge streak",
                "🔥"
        );

        seedAchievement(
                "STREAK_50",
                "Unstoppable",
                "50-day forge streak",
                "🔥"
        );

        seedAchievement(
                "STREAK_100",
                "Century Forger",
                "100-day forge streak",
                "🔥"
        );

        seedAchievement(
                "DAILY_CHAMPION",
                "Daily Challenge Champion",
                "Solved a Daily Forge Challenge",
                "🏆"
        );
    }

    private void seedAchievement(
            String code,
            String name,
            String description,
            String icon) {

        if (achievementRepository.findByCode(code).isEmpty()) {

            achievementRepository.save(
                    Achievement.builder()
                            .code(code)
                            .name(name)
                            .description(description)
                            .icon(icon)
                            .build()
            );
        }
    }
}
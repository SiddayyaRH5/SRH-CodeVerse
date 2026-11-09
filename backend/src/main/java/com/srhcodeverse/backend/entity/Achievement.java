package com.srhcodeverse.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "achievements")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // e.g. "FIRST_SOLUTION", "SOLVED_10", "STREAK_7"

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    private String icon;
}
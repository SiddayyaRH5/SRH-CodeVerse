package com.srhcodeverse.backend.dto;
import lombok.*;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseProjectResponse { Long id; String title; String description; String requirements; String technologies; String features; String difficulty; String outcome; }

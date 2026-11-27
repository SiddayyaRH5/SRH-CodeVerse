package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.CourseAdminRequest;
import com.srhcodeverse.backend.service.CourseManagementService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/trainer/courses")
@PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
public class TrainerCourseController {

    private final CourseManagementService service;

    public TrainerCourseController(CourseManagementService service) {
        this.service = service;
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody CourseAdminRequest request) {
        return service.create(request);
    }

    @PutMapping("/{slug}")
    public Map<String, Object> update(@PathVariable String slug,
                                       @Valid @RequestBody CourseAdminRequest request) {
        return service.update(slug, request);
    }

    @PatchMapping("/{slug}/publish")
    public Map<String, Object> publish(@PathVariable String slug,
                                        @RequestParam boolean published) {
        return service.setPublished(slug, published);
    }
}

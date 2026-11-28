package com.srhcodeverse.backend.controller;

import com.srhcodeverse.backend.dto.AnnouncementRequest;
import com.srhcodeverse.backend.dto.AnnouncementResponse;
import com.srhcodeverse.backend.service.AnnouncementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService service;

    public AnnouncementController(AnnouncementService service) {
        this.service = service;
    }

    @GetMapping
    public List<AnnouncementResponse> list() {
        return service.list(currentUsername());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public AnnouncementResponse create(@Valid @RequestBody AnnouncementRequest request) {
        return service.create(request, currentUsername());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public AnnouncementResponse update(@PathVariable Long id,
                                       @Valid @RequestBody AnnouncementRequest request) {
        return service.update(id, request, currentUsername());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TRAINER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id, currentUsername());
        return ResponseEntity.noContent().build();
    }

    private String currentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}

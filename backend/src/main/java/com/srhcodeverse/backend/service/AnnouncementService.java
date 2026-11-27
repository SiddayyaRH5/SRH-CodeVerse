package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.dto.AnnouncementRequest;
import com.srhcodeverse.backend.dto.AnnouncementResponse;
import com.srhcodeverse.backend.entity.Announcement;
import com.srhcodeverse.backend.entity.User;
import com.srhcodeverse.backend.repository.AnnouncementRepository;
import com.srhcodeverse.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AnnouncementService {

    private static final Set<String> ALLOWED_AUDIENCES = Set.of("ALL", "STUDENT", "TRAINER");

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository,
                               UserRepository userRepository) {
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> list(String username) {
        User user = user(username);
        String role = user.getRole() == null ? "STUDENT" : user.getRole().getName();
        List<String> audiences = List.of("ALL", role);
        return announcementRepository.findByAudienceInOrderByCreatedAtDesc(audiences).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AnnouncementResponse create(AnnouncementRequest request, String authorUsername) {
        user(authorUsername);
        Announcement announcement = Announcement.builder()
                .title(request.title().trim())
                .body(request.body().trim())
                .audience(audience(request.audience()))
                .author(authorUsername)
                .build();
        return toResponse(announcementRepository.save(announcement));
    }

    @Transactional
    public AnnouncementResponse update(Long id, AnnouncementRequest request, String authorUsername) {
        user(authorUsername);
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Announcement not found"));
        announcement.setTitle(request.title().trim());
        announcement.setBody(request.body().trim());
        announcement.setAudience(audience(request.audience()));
        return toResponse(announcementRepository.save(announcement));
    }

    @Transactional
    public void delete(Long id, String authorUsername) {
        user(authorUsername);
        if (!announcementRepository.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found");
        announcementRepository.deleteById(id);
    }

    private String audience(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_AUDIENCES.contains(normalized))
            throw new IllegalArgumentException("Audience must be ALL, STUDENT or TRAINER");
        return normalized;
    }

    private User user(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Authenticated user not found"));
    }

    private AnnouncementResponse toResponse(Announcement a) {
        return new AnnouncementResponse(
                a.getId(),
                a.getTitle(),
                a.getAudience(),
                a.getAuthor(),
                a.getCreatedAt() == null ? null : a.getCreatedAt().toString());
    }
}

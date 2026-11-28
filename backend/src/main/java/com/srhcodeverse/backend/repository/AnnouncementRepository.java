package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByCreatedAtDesc();

    List<Announcement> findByAudienceInOrderByCreatedAtDesc(Collection<String> audiences);
}

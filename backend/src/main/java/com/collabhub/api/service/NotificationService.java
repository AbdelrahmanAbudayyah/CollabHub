package com.collabhub.api.service;

import com.collabhub.api.exception.ResourceNotFoundException;
import com.collabhub.api.model.dto.response.NotificationResponse;
import com.collabhub.api.model.dto.response.PagedResponse;
import com.collabhub.api.model.entity.Notification;
import com.collabhub.api.model.entity.Project;
import com.collabhub.api.model.entity.User;
import com.collabhub.api.model.enums.NotificationType;
import com.collabhub.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // ─── CREATE NOTIFICATIONS ───────────────────────────────────────────

    @Transactional
    public void notifyJoinRequestReceived(Project project, User requester) {
        String title = requester.getFirstName() + " " + requester.getLastName()
                + " wants to join " + project.getTitle();
        create(project.getOwner(), NotificationType.JOIN_REQUEST_RECEIVED,
                title, null, project.getId(), "PROJECT");
    }

    @Transactional
    public void notifyJoinRequestApproved(Project project, User requester) {
        String title = "Your request to join " + project.getTitle() + " was approved";
        create(requester, NotificationType.JOIN_REQUEST_APPROVED,
                title, null, project.getId(), "PROJECT");
    }

    @Transactional
    public void notifyJoinRequestRejected(Project project, User requester) {
        String title = "Your request to join " + project.getTitle() + " was rejected";
        create(requester, NotificationType.JOIN_REQUEST_REJECTED,
                title, null, project.getId(), "PROJECT");
    }

    @Transactional
    public void notifyMemberLeft(Project project, User member) {
        String title = member.getFirstName() + " " + member.getLastName()
                + " left " + project.getTitle();
        create(project.getOwner(), NotificationType.MEMBER_LEFT,
                title, null, project.getId(), "PROJECT");
    }

    @Transactional
    public void notifyMemberRemoved(Project project, User member) {
        String title = "You were removed from " + project.getTitle();
        create(member, NotificationType.MEMBER_REMOVED,
                title, null, project.getId(), "PROJECT");
    }

    // ─── READ ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<NotificationResponse> getNotifications(Long userId, int page, int size) {
        Page<Notification> notifPage = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        List<NotificationResponse> content = notifPage.getContent().stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());

        return PagedResponse.<NotificationResponse>builder()
                .content(content)
                .page(notifPage.getNumber())
                .size(notifPage.getSize())
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification not found");
        }

        notification.setRead(true);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    // ─── HELPER ─────────────────────────────────────────────────────────

    private void create(User recipient, NotificationType type, String title,
                        String body, Long referenceId, String referenceType) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .body(body)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();
        notificationRepository.save(notification);
    }
}

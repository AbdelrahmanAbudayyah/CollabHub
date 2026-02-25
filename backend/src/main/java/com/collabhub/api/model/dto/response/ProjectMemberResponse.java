package com.collabhub.api.model.dto.response;

import com.collabhub.api.model.entity.ProjectMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for a project member in the API response.
 *
 * Includes user details (name, avatar) so the frontend can display
 * team members without making separate API calls per member.
 *
 * Important: from() accesses member.getUser() which is LAZY-loaded.
 * This method must be called inside a @Transactional method,
 * otherwise Hibernate throws LazyInitializationException.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberResponse {

    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private String profilePicUrl;
    private String role;
    private Instant joinedAt;

    public static ProjectMemberResponse from(ProjectMember member) {
        return ProjectMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .firstName(member.getUser().getFirstName())
                .lastName(member.getUser().getLastName())
                .profilePicUrl(member.getUser().getProfilePicUrl())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}

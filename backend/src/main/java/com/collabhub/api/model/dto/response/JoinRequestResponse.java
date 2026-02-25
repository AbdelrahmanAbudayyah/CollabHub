package com.collabhub.api.model.dto.response;

import com.collabhub.api.model.entity.JoinRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for join request data in the API response.
 *
 * Includes user details (name, avatar) so the owner can see
 * who is requesting to join without making separate API calls.
 *
 * The from() factory method extracts data from the JoinRequest entity.
 * Must be called inside @Transactional because it accesses LAZY-loaded user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequestResponse {

    private Long id;
    private Long projectId;
    private Long userId;
    private String userFirstName;
    private String userLastName;
    private String userProfilePicUrl;
    private String message;
    private String status;
    private Instant reviewedAt;
    private Instant createdAt;

    public static JoinRequestResponse from(JoinRequest joinRequest) {
        return JoinRequestResponse.builder()
                .id(joinRequest.getId())
                .projectId(joinRequest.getProject().getId())
                .userId(joinRequest.getUser().getId())
                .userFirstName(joinRequest.getUser().getFirstName())
                .userLastName(joinRequest.getUser().getLastName())
                .userProfilePicUrl(joinRequest.getUser().getProfilePicUrl())
                .message(joinRequest.getMessage())
                .status(joinRequest.getStatus().name())
                .reviewedAt(joinRequest.getReviewedAt())
                .createdAt(joinRequest.getCreatedAt())
                .build();
    }
}

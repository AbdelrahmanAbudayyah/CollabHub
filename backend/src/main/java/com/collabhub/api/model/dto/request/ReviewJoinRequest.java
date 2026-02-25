package com.collabhub.api.model.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for PUT /projects/{id}/join-requests/{reqId}.
 *
 * The owner sends either "APPROVED" or "REJECTED" as the status.
 * @Pattern ensures only these two values are accepted — you can't
 * set a request back to PENDING or to an invalid status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewJoinRequest {

    @NotNull(message = "Status is required")
    @Pattern(regexp = "APPROVED|REJECTED", message = "Status must be APPROVED or REJECTED")
    private String status;
}

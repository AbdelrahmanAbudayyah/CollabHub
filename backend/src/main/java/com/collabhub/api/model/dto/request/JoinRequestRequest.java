package com.collabhub.api.model.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for POST /projects/{id}/join-requests.
 *
 * The message is optional — the user can explain why they want to join,
 * but it's not required. @Size limits it to 1000 characters.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequestRequest {

    @Size(max = 1000, message = "Message must be at most 1000 characters")
    private String message;
}

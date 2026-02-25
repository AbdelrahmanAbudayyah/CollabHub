package com.collabhub.api.model.enums;

/**
 * Status lifecycle for join requests:
 *   PENDING   → initial state when user submits a request
 *   APPROVED  → owner accepted the request (user becomes a member)
 *   REJECTED  → owner declined the request
 *   CANCELLED → requester withdrew their own request
 */
public enum JoinRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED
}

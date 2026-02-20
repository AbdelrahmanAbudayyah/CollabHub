package com.collabhub.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                "collabhub-test-secret-key-must-be-at-least-32-characters!!",
                900_000L,   // 15 min
                604_800_000L // 7 days
        );
    }

    @Test
    void generateAccessToken_returnsNonNullToken() {
        String token = jwtService.generateAccessToken(1L, "user@example.com");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void generateAccessToken_containsCorrectUserId() {
        String token = jwtService.generateAccessToken(42L, "user@example.com");
        Long userId = jwtService.extractUserId(token);
        assertEquals(42L, userId);
    }

    @Test
    void generateRefreshToken_returnsNonNullToken() {
        String token = jwtService.generateRefreshToken(1L);
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void generateRefreshToken_containsCorrectUserId() {
        String token = jwtService.generateRefreshToken(1L);
        Long userId = jwtService.extractUserId(token);
        assertEquals(1L, userId);
    }

    @Test
    void generateRefreshToken_producesUniqueTokensForSameUser() {
        String token1 = jwtService.generateRefreshToken(1L);
        String token2 = jwtService.generateRefreshToken(1L);
        assertNotEquals(token1, token2, "Refresh tokens should be unique due to UUID jti claim");
    }

    @Test
    void isTokenValid_returnsTrueForValidAccessToken() {
        String token = jwtService.generateAccessToken(1L, "user@example.com");
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void isTokenValid_returnsTrueForValidRefreshToken() {
        String token = jwtService.generateRefreshToken(1L);
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void isTokenValid_returnsFalseForGarbageToken() {
        assertFalse(jwtService.isTokenValid("not.a.real.token"));
    }

    @Test
    void isTokenValid_returnsFalseForNullToken() {
        assertFalse(jwtService.isTokenValid(null));
    }

    @Test
    void isTokenValid_returnsFalseForEmptyToken() {
        assertFalse(jwtService.isTokenValid(""));
    }

    @Test
    void isTokenValid_returnsFalseForTokenSignedWithDifferentKey() {
        JwtService otherService = new JwtService(
                "a-completely-different-secret-key-at-least-32-chars!!",
                900_000L,
                604_800_000L
        );
        String token = otherService.generateAccessToken(1L, "user@example.com");
        assertFalse(jwtService.isTokenValid(token));
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        JwtService shortLived = new JwtService(
                "collabhub-test-secret-key-must-be-at-least-32-characters!!",
                1L, // 1ms expiration
                1L
        );
        String token = shortLived.generateAccessToken(1L, "user@example.com");
        // Token expires almost immediately
        try { Thread.sleep(50); } catch (InterruptedException ignored) {}
        assertFalse(shortLived.isTokenValid(token));
    }

    @Test
    void getAccessTokenExpirationSeconds_returnsCorrectValue() {
        assertEquals(900L, jwtService.getAccessTokenExpirationSeconds());
    }

    @Test
    void getRefreshTokenExpirationMillis_returnsCorrectValue() {
        assertEquals(604_800_000L, jwtService.getRefreshTokenExpirationMillis());
    }
}

package com.collabhub.api.service;

import com.collabhub.api.exception.ConflictException;
import com.collabhub.api.exception.UnauthorizedException;
import com.collabhub.api.model.dto.request.LoginRequest;
import com.collabhub.api.model.dto.request.RegisterRequest;
import com.collabhub.api.model.dto.response.AuthResponse;
import com.collabhub.api.model.dto.response.UserResponse;
import com.collabhub.api.model.entity.RefreshToken;
import com.collabhub.api.model.entity.User;
import com.collabhub.api.repository.RefreshTokenRepository;
import com.collabhub.api.repository.UserRepository;
import com.collabhub.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .build();

        user = userRepository.save(user);

        return UserResponse.from(user);
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        saveRefreshToken(user.getId(), refreshToken);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(accessToken)
                .expiresIn(jwtService.getAccessTokenExpirationSeconds())
                .user(UserResponse.from(user))
                .build();

        return new LoginResult(authResponse, refreshToken);
    }

    @Transactional
    public LoginResult refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is required");
        }

        if (!jwtService.isTokenValid(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String tokenHash = hashToken(refreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired refresh token"));

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token has expired");
        }

        // Revoke old token (rotation)
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        Long userId = storedToken.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshToken = jwtService.generateRefreshToken(user.getId());

        saveRefreshToken(user.getId(), newRefreshToken);

        AuthResponse authResponse = AuthResponse.builder()
                .accessToken(newAccessToken)
                .expiresIn(jwtService.getAccessTokenExpirationSeconds())
                .user(UserResponse.from(user))
                .build();

        return new LoginResult(authResponse, newRefreshToken);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        String tokenHash = hashToken(refreshToken);
        refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    private void saveRefreshToken(Long userId, String rawToken) {
        RefreshToken token = RefreshToken.builder()
                .userId(userId)
                .tokenHash(hashToken(rawToken))
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMillis()))
                .build();
        refreshTokenRepository.save(token);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record LoginResult(AuthResponse authResponse, String refreshToken) {}
}

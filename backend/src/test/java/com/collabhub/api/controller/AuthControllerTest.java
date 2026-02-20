package com.collabhub.api.controller;

import com.collabhub.api.model.dto.request.LoginRequest;
import com.collabhub.api.model.dto.request.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private final String testEmail = "authtest_" + System.currentTimeMillis() + "@example.com";
    private final String testPassword = "Test1234";

    private Cookie refreshCookie;

    // ── Slice 1: Registration ──────────────────────────────────────────

    @Test
    @Order(1)
    void register_withValidData_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest(testEmail, testPassword, "Auth", "Tester");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Registration successful"))
                .andExpect(jsonPath("$.data.email").value(testEmail))
                .andExpect(jsonPath("$.data.firstName").value("Auth"))
                .andExpect(jsonPath("$.data.lastName").value("Tester"))
                .andExpect(jsonPath("$.data.id").isNumber());
    }

    @Test
    @Order(2)
    void register_duplicateEmail_returns409() throws Exception {
        RegisterRequest req = new RegisterRequest(testEmail, testPassword, "Auth", "Tester");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    @Test
    @Order(3)
    void register_missingEmail_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("", testPassword, "Auth", "Tester");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("error"));
    }

    @Test
    @Order(4)
    void register_weakPassword_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("weak@example.com", "short", "Auth", "Tester");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("error"));
    }

    @Test
    @Order(5)
    void register_passwordNoUppercase_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("noup@example.com", "alllower1", "Auth", "Tester");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(6)
    void register_missingFirstName_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest("nofirst@example.com", testPassword, "", "Tester");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── Slice 2: Login ─────────────────────────────────────────────────

    @Test
    @Order(10)
    void login_withValidCredentials_returns200WithTokens() throws Exception {
        LoginRequest req = new LoginRequest(testEmail, testPassword);

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.expiresIn").value(900))
                .andExpect(jsonPath("$.data.user.email").value(testEmail))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(cookie().path("refreshToken", "/api/v1/auth"))
                .andReturn();

        // Store refresh cookie for subsequent tests
        refreshCookie = result.getResponse().getCookie("refreshToken");
    }

    @Test
    @Order(11)
    void login_wrongPassword_returns401() throws Exception {
        LoginRequest req = new LoginRequest(testEmail, "WrongPassword1");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @Order(12)
    void login_nonexistentEmail_returns401() throws Exception {
        LoginRequest req = new LoginRequest("nobody@example.com", testPassword);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @Order(13)
    void login_missingEmail_returns400() throws Exception {
        LoginRequest req = new LoginRequest("", testPassword);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── Slice 2: Refresh ───────────────────────────────────────────────

    @Test
    @Order(20)
    void refresh_withValidCookie_returnsNewTokens() throws Exception {
        Assertions.assertNotNull(refreshCookie, "refresh cookie should be set from login test");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value(testEmail))
                .andExpect(cookie().exists("refreshToken"))
                .andReturn();

        // The old cookie is now revoked; save the rotated one
        Cookie oldCookie = refreshCookie;
        refreshCookie = result.getResponse().getCookie("refreshToken");
        assertNotNull(refreshCookie, "Response should include a new refresh cookie");
        assertNotEquals(oldCookie.getValue(), refreshCookie.getValue(), "Refresh should rotate the cookie");
    }

    @Test
    @Order(21)
    void refresh_withRevokedCookie_returns401() throws Exception {
        // Login again to get a fresh cookie, then refresh to revoke it
        LoginRequest req = new LoginRequest(testEmail, testPassword);
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie firstCookie = loginResult.getResponse().getCookie("refreshToken");

        // Refresh once to rotate (revokes firstCookie)
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(firstCookie))
                .andExpect(status().isOk());

        // Try using the now-revoked firstCookie
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(firstCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(22)
    void refresh_withNoCookie_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh token is required"));
    }

    @Test
    @Order(23)
    void refresh_withGarbageCookie_returns401() throws Exception {
        Cookie bad = new Cookie("refreshToken", "not.a.real.token");
        bad.setPath("/api/v1/auth");

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(bad))
                .andExpect(status().isUnauthorized());
    }

    // ── Slice 2: Logout ────────────────────────────────────────────────

    @Test
    @Order(30)
    void logout_withValidCookie_returns200AndClearsCookie() throws Exception {
        // Login to get a fresh cookie for this test
        LoginRequest req = new LoginRequest(testEmail, testPassword);
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie logoutCookie = loginResult.getResponse().getCookie("refreshToken");

        MvcResult logoutResult = mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(logoutCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.message").value("Logged out successfully"))
                .andReturn();

        // Verify the cookie is cleared (maxAge = 0)
        Cookie cleared = logoutResult.getResponse().getCookie("refreshToken");
        assertNotNull(cleared);
        assertEquals(0, cleared.getMaxAge());
    }

    @Test
    @Order(31)
    void logout_thenRefresh_returns401() throws Exception {
        // Login, logout, then try to refresh
        LoginRequest req = new LoginRequest(testEmail, testPassword);
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookie = loginResult.getResponse().getCookie("refreshToken");

        mockMvc.perform(post("/api/v1/auth/logout").cookie(cookie))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(cookie))
                .andExpect(status().isUnauthorized());
    }
}

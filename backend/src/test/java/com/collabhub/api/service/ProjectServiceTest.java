package com.collabhub.api.service;

import com.collabhub.api.exception.ForbiddenException;
import com.collabhub.api.exception.ResourceNotFoundException;
import com.collabhub.api.model.dto.response.ProjectResponse;
import com.collabhub.api.model.entity.Project;
import com.collabhub.api.model.entity.ProjectMember;
import com.collabhub.api.model.entity.User;
import com.collabhub.api.model.enums.ProjectStatus;
import com.collabhub.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProjectService
 *
 * Tests business logic in isolation using mocked dependencies.
 * Each test follows the Arrange-Act-Assert pattern.
 *
 * Key concepts:
 * - @ExtendWith(MockitoExtension.class) enables Mockito annotations
 * - @Mock creates mock dependencies
 * - @InjectMocks injects mocks into the service under test
 * - when().thenReturn() stubs method behavior
 * - verify() checks that methods were called as expected
 * - assertThat() provides fluent assertions (AssertJ)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService Unit Tests")
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectInterestRepository projectInterestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    private ProjectService projectService;

    private User testUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        // Create ProjectService with mocked dependencies
        // ObjectMapper is created as a real instance since it's hard to mock
        projectService = new ProjectService(
                projectRepository,
                projectMemberRepository,
                projectInterestRepository,
                userRepository,
                skillRepository,
                new com.fasterxml.jackson.databind.ObjectMapper()
        );
        // Create test data used across multiple tests
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .build();

        testProject = Project.builder()
                .id(100L)
                .title("Test Project")
                .description("A test project")
                .owner(testUser)
                .maxTeamSize(5)
                .status(ProjectStatus.RECRUITING)
                .build();
    }

    // ─── GET PROJECT BY ID ──────────────────────────────────────────────

    @Test
    @DisplayName("getProjectById - should return project when it exists")
    void getProjectById_WhenExists_ReturnsProject() {
        // Arrange: Set up mock to return our test project
        when(projectRepository.findById(100L))
                .thenReturn(Optional.of(testProject));

        // Act: Call the method under test
        ProjectResponse result = projectService.getProjectById(100L);

        // Assert: Verify the result
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getTitle()).isEqualTo("Test Project");
        assertThat(result.getOwnerId()).isEqualTo(1L);

        // Verify repository was called exactly once
        verify(projectRepository, times(1)).findById(100L);
    }

    @Test
    @DisplayName("getProjectById - should throw ResourceNotFoundException when project doesn't exist")
    void getProjectById_WhenNotFound_ThrowsException() {
        // Arrange: Mock repository to return empty
        when(projectRepository.findById(999L))
                .thenReturn(Optional.empty());

        // Act & Assert: Verify exception is thrown
        assertThatThrownBy(() -> projectService.getProjectById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");

        verify(projectRepository, times(1)).findById(999L);
    }

    // ─── DELETE PROJECT ─────────────────────────────────────────────────

    @Test
    @DisplayName("deleteProject - owner can delete their project")
    void deleteProject_ByOwner_Succeeds() {
        // Arrange
        when(projectRepository.findById(100L))
                .thenReturn(Optional.of(testProject));

        // Act
        projectService.deleteProject(100L, 1L); // User ID 1 is the owner

        // Assert: Verify delete was called
        verify(projectRepository, times(1)).delete(testProject);
    }

    @Test
    @DisplayName("deleteProject - non-owner cannot delete project")
    void deleteProject_ByNonOwner_ThrowsForbiddenException() {
        // Arrange
        when(projectRepository.findById(100L))
                .thenReturn(Optional.of(testProject));

        // Act & Assert: User ID 2 is not the owner
        assertThatThrownBy(() -> projectService.deleteProject(100L, 2L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only the project owner can perform this action");

        // Verify delete was never called
        verify(projectRepository, never()).delete(any(Project.class));
    }

    // ─── DASHBOARD METHODS ──────────────────────────────────────────────

    @Test
    @DisplayName("getOwnedProjects - should return projects owned by user")
    void getOwnedProjects_ReturnsUserProjects() {
        // Arrange
        when(projectRepository.findByOwnerIdOrderByCreatedAtDesc(1L))
                .thenReturn(java.util.List.of(testProject));

        // Act
        var result = projectService.getOwnedProjects(1L);

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Project");
        verify(projectRepository, times(1)).findByOwnerIdOrderByCreatedAtDesc(1L);
    }
}

package com.collabhub.api.repository;

import com.collabhub.api.model.entity.ProjectTask;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {
}

package com.collabhub.api.service;

import com.collabhub.api.model.dto.response.SkillResponse;
import com.collabhub.api.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Business logic for skills.
 *
 * @Service marks this as a Spring-managed bean — Spring creates
 * one instance and injects it wherever needed.
 *
 * @RequiredArgsConstructor (Lombok) generates a constructor for
 * all `final` fields. Spring uses that constructor to inject
 * the SkillRepository automatically (constructor injection).
 */
@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    /**
     * Returns all skills grouped by category.
     *
     * Example output:
     * {
     *   "LANGUAGE": [ {id:1, name:"JavaScript"}, {id:2, name:"Python"} ],
     *   "FRAMEWORK": [ {id:11, name:"React"}, {id:12, name:"Next.js"} ]
     * }
     *
     * How it works:
     * 1. Fetch all skills sorted by name from DB
     * 2. Convert each Skill entity to a SkillResponse DTO
     * 3. Group them into a Map where key = category name, value = list of skills
     *
     * Collectors.groupingBy() is like SQL GROUP BY but in Java streams.
     */
    public Map<String, List<SkillResponse>> getAllGroupedByCategory() {
        return skillRepository.findAllByOrderByNameAsc().stream()
                .map(SkillResponse::from)
                .collect(Collectors.groupingBy(
                        skill -> skill.getCategory().name()
                ));
    }

    /**
     * Returns all skills as a flat list (useful for simpler lookups).
     */
    public List<SkillResponse> getAll() {
        return skillRepository.findAllByOrderByNameAsc().stream()
                .map(SkillResponse::from)
                .toList();
    }
}

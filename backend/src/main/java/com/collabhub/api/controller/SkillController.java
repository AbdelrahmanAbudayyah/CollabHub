package com.collabhub.api.controller;

import com.collabhub.api.model.dto.response.ApiResponse;
import com.collabhub.api.model.dto.response.SkillResponse;
import com.collabhub.api.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * REST controller for skill-related endpoints.
 *
 * @RestController = @Controller + @ResponseBody
 *   - @Controller: marks this as a Spring MVC controller
 *   - @ResponseBody: every method return value is serialized
 *     to JSON automatically (no need for a view/template)
 *
 * @RequestMapping("/api/v1/skills"): all methods in this class
 * handle URLs starting with /api/v1/skills
 */
@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    /**
     * GET /api/v1/skills
     *
     * Returns all predefined skills grouped by category.
     * This is a public endpoint (no auth required) so the
     * skill selector can load even on public-facing pages.
     *
     * Response shape:
     * {
     *   "status": "success",
     *   "data": {
     *     "LANGUAGE": [ { "id": 1, "name": "JavaScript", "category": "LANGUAGE" }, ... ],
     *     "FRAMEWORK": [ ... ]
     *   }
     * }
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<SkillResponse>>>> getAllGroupedByCategory() {
        Map<String, List<SkillResponse>> grouped = skillService.getAllGroupedByCategory();
        return ResponseEntity.ok(ApiResponse.success(grouped));
    }
}

"use client";

/**
 * SkillSelector — lets users pick predefined skills from checkboxes.
 *
 * "use client" is required because this component:
 *   - Uses React hooks (useState, useEffect)
 *   - Handles user interactions (click events)
 *   - Fetches data on the client side
 *
 * In Next.js App Router, components are Server Components by default
 * (rendered on the server, no interactivity). Adding "use client"
 * makes it a Client Component that runs in the browser.
 *
 * Props pattern:
 *   selectedIds: number[]  — currently selected skill IDs (controlled by parent)
 *   onChange: (ids) => void — callback when selection changes
 *
 * This is the "controlled component" pattern — the parent owns the
 * state, and this component just renders it and reports changes.
 * Same pattern as <input value={x} onChange={...} />.
 */

import { useEffect, useState } from "react";
import { getSkillsGrouped } from "@/lib/api/skills";
import { GroupedSkills } from "@/lib/types/skill";

// Display-friendly labels for category keys
const CATEGORY_LABELS: Record<string, string> = {
  LANGUAGE: "Languages",
  FRAMEWORK: "Frameworks",
  TOOL: "Tools",
  CONCEPT: "Concepts",
  OTHER: "Other",
};

interface SkillSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export default function SkillSelector({
  selectedIds,
  onChange,
}: SkillSelectorProps) {
  // Local state for the fetched skills data
  const [groupedSkills, setGroupedSkills] = useState<GroupedSkills>({});
  const [loading, setLoading] = useState(true);

  /**
   * useEffect runs side effects after render.
   * The empty dependency array [] means "run once on mount."
   *
   * We fetch skills from the API when the component first appears.
   * This is a one-time fetch — skills don't change during a session.
   */
  useEffect(() => {
    getSkillsGrouped()
      .then(setGroupedSkills)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /**
   * Toggle a skill on/off.
   *
   * If the skill is already selected, remove it from the array.
   * If not, add it. Then tell the parent about the new array.
   *
   * We create a NEW array each time (not mutating the old one)
   * because React only re-renders when it detects a new reference.
   * Mutating the same array wouldn't trigger a re-render.
   */
  const toggleSkill = (skillId: number) => {
    const newIds = selectedIds.includes(skillId)
      ? selectedIds.filter((id) => id !== skillId) // Remove
      : [...selectedIds, skillId]; // Add
    onChange(newIds);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading skills...</p>;
  }

  return (
    <div className="space-y-4">
      {/*
        Object.entries() converts { LANGUAGE: [...], FRAMEWORK: [...] }
        into [["LANGUAGE", [...]], ["FRAMEWORK", [...]]] so we can
        loop over each category.
      */}
      {Object.entries(groupedSkills).map(([category, skills]) => (
        <div key={category}>
          {/* Category header */}
          <h4 className="mb-2 text-sm font-medium">
            {CATEGORY_LABELS[category] || category}
          </h4>

          {/* Skill checkboxes in a wrapping flex row */}
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              const isSelected = selectedIds.includes(skill.id);
              return (
                /*
                  Each skill is a clickable pill/badge.
                  Selected = solid primary background.
                  Unselected = outline style.

                  We use a <button> (not <input type="checkbox">)
                  because it's easier to style as a pill/badge shape.
                  The visual state communicates selected/unselected.
                */
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {skill.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

/**
 * CustomSkillInput — a tag input for free-text skills.
 *
 * Users type a skill name and press Enter to add it as a tag.
 * Each tag has an X button to remove it.
 *
 * This handles skills NOT in the predefined list (e.g. "Solidity",
 * "Blender"). They're stored as a JSON array in the DB.
 *
 * Controlled component pattern:
 *   skills: string[]  — current list of custom skills
 *   onChange: (skills) => void  — callback when list changes
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CustomSkillInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export default function CustomSkillInput({
  skills,
  onChange,
}: CustomSkillInputProps) {
  // Local state for the text currently being typed
  const [inputValue, setInputValue] = useState("");

  /**
   * Handle keyboard events on the input.
   *
   * "Enter" adds the current text as a new tag (if valid).
   * "Backspace" on an empty input removes the last tag
   * (common UX pattern in tag inputs).
   *
   * e.preventDefault() on Enter stops the form from submitting
   * (since this input lives inside a <form>).
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    } else if (e.key === "Backspace" && inputValue === "" && skills.length > 0) {
      // Remove last tag when backspacing on empty input
      onChange(skills.slice(0, -1));
    }
  };

  const addSkill = () => {
    const trimmed = inputValue.trim();

    // Don't add empty strings or duplicates (case-insensitive)
    if (
      trimmed === "" ||
      skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      setInputValue("");
      return;
    }

    onChange([...skills, trimmed]);
    setInputValue("");
  };

  const removeSkill = (index: number) => {
    /**
     * filter((_, i) => i !== index) creates a new array
     * with all elements EXCEPT the one at `index`.
     *
     * The underscore _ is a convention for "I don't need this
     * parameter" — we only care about the index, not the value.
     */
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Render existing tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm"
            >
              {skill}
              {/*
                The X button. We use the Lucide "X" icon (already
                installed via shadcn/ui dependencies).

                type="button" prevents form submission when clicked.
              */}
              <button
                type="button"
                onClick={() => removeSkill(index)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* The text input for typing new skills */}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a skill and press Enter"
        className="max-w-xs"
      />
    </div>
  );
}

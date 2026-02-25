"use client";

/**
 * Create Project Page — /projects/create
 *
 * A 3-step wizard for creating a new project:
 *   Step 1: Basics (title, description, team size, GitHub URL)
 *   Step 2: Tech Stack (predefined skills + custom skills)
 *   Step 3: Tasks (dynamic list of roles/tasks needed)
 *
 * All wizard state lives in a single useState object. Each step
 * merges its data when clicking "Next". On the final step, we
 * send everything in one POST /projects request.
 *
 * No drafts — if you leave the page, your progress is lost.
 * This matches the plan: "no drafts" in project creation.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import SkillSelector from "@/components/profile/SkillSelector";
import CustomSkillInput from "@/components/profile/CustomSkillInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createProject } from "@/lib/api/projects";
import {
  projectBasicsSchema,
  ProjectBasicsFormData,
  taskSchema,
} from "@/lib/utils/validators";
import { CreateProjectData } from "@/lib/types/project";
import { ApiResponse } from "@/lib/types/api";
import { Plus, Trash2 } from "lucide-react";

export default function CreateProjectPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <CreateProjectWizard />
      </div>
    </ProtectedRoute>
  );
}

/**
 * Step indicator — shows progress through the 3 steps.
 * The active step is highlighted with the primary color.
 * Completed steps show a checkmark-style filled circle.
 */
const STEP_LABELS = ["Basics", "Tech Stack", "Tasks"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-3">
      {STEP_LABELS.map((label, index) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                index < currentStep
                  ? "bg-primary text-primary-foreground"
                  : index === currentStep
                    ? "border-2 border-primary text-primary"
                    : "border-2 border-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-sm ${
                index === currentStep
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
          {index < STEP_LABELS.length - 1 && (
            <div
              className={`h-px w-8 ${
                index < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * CreateProjectWizard — manages step state and accumulated form data.
 *
 * formData holds ALL the data across all steps. Each step component
 * receives the relevant slice as default values, and merges its
 * data back when clicking "Next".
 *
 * step state: 0 = Basics, 1 = Tech Stack, 2 = Tasks
 */
function CreateProjectWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<CreateProjectData>({
    title: "",
    description: "",
    maxTeamSize: 5,
    githubUrl: "",
    skillIds: [],
    customSkills: [],
    tasks: [],
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  /**
   * Called by Step 1 when "Next" is clicked.
   * Merges the basics data into formData and advances.
   */
  const handleBasicsNext = (data: ProjectBasicsFormData) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(1);
  };

  /**
   * Called by Step 2 when "Next" is clicked.
   * Merges skill selections into formData and advances.
   */
  const handleTechStackNext = (
    skillIds: number[],
    customSkills: string[]
  ) => {
    setFormData((prev) => ({ ...prev, skillIds, customSkills }));
    setStep(2);
  };

  /**
   * Called by Step 3 when "Create Project" is clicked.
   * Merges tasks, sends the POST request, and redirects on success.
   *
   * We clean up optional fields before sending:
   * - Empty githubUrl → omit entirely (backend accepts null)
   * - Empty skillIds/customSkills/tasks → omit
   */
  const handleSubmit = async (
    tasks: { title: string; description?: string }[]
  ) => {
    setServerError(null);
    setIsSubmitting(true);

    // Build the final payload, cleaning up empty optional fields
    const payload: CreateProjectData = {
      title: formData.title,
      description: formData.description,
      maxTeamSize: formData.maxTeamSize,
    };

    if (formData.githubUrl) {
      payload.githubUrl = formData.githubUrl;
    }
    if (formData.skillIds && formData.skillIds.length > 0) {
      payload.skillIds = formData.skillIds;
    }
    if (formData.customSkills && formData.customSkills.length > 0) {
      payload.customSkills = formData.customSkills;
    }
    if (tasks.length > 0) {
      payload.tasks = tasks;
    }

    try {
      const project = await createProject(payload);
      // Redirect to the project detail page (built in Slice 5)
      router.push(`/projects/${project.id}`);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        const apiError = error.response.data as ApiResponse<unknown>;
        setServerError(apiError.message || "Failed to create project");
      } else {
        setServerError("An unexpected error occurred");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Create a Project</h1>
      <p className="mb-6 text-muted-foreground">
        Post your project idea and find collaborators.
      </p>

      <StepIndicator currentStep={step} />

      {serverError && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {step === 0 && (
        <BasicsStep
          defaultValues={formData}
          onNext={handleBasicsNext}
        />
      )}
      {step === 1 && (
        <TechStackStep
          defaultSkillIds={formData.skillIds || []}
          defaultCustomSkills={formData.customSkills || []}
          onNext={handleTechStackNext}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <TasksStep
          defaultTasks={formData.tasks || []}
          onSubmit={handleSubmit}
          onBack={() => setStep(1)}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}

// ─── STEP 1: Basics ────────────────────────────────────────────────

/**
 * BasicsStep — title, description, maxTeamSize, githubUrl.
 *
 * Uses React Hook Form + Zod for validation. The form validates
 * when you click "Next". If validation fails, errors show inline.
 *
 * defaultValues come from the parent's formData, so going Back
 * and then Next again preserves what you already typed.
 */
function BasicsStep({
  defaultValues,
  onNext,
}: {
  defaultValues: CreateProjectData;
  onNext: (data: ProjectBasicsFormData) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectBasicsFormData>({
    resolver: zodResolver(projectBasicsSchema),
    defaultValues: {
      title: defaultValues.title,
      description: defaultValues.description,
      maxTeamSize: defaultValues.maxTeamSize,
      githubUrl: defaultValues.githubUrl || "",
    },
  });

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onNext)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g. AI-Powered Study Group Matcher"
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              {...register("description")}
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe your project idea, goals, and what you're looking for..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Max Team Size */}
          <div className="space-y-2">
            <Label htmlFor="maxTeamSize">Max Team Size *</Label>
            <Input
              id="maxTeamSize"
              type="number"
              {...register("maxTeamSize", { valueAsNumber: true })}
              min={2}
              max={20}
              className="max-w-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Between 2 and 20 members (including you)
            </p>
            {errors.maxTeamSize && (
              <p className="text-sm text-destructive">
                {errors.maxTeamSize.message}
              </p>
            )}
          </div>

          {/* GitHub URL */}
          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub Repository URL</Label>
            <Input
              id="githubUrl"
              {...register("githubUrl")}
              placeholder="https://github.com/user/project"
            />
            {errors.githubUrl && (
              <p className="text-sm text-destructive">
                {errors.githubUrl.message}
              </p>
            )}
          </div>

          {/* Next button */}
          <div className="flex justify-end">
            <Button type="submit">Next: Tech Stack</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── STEP 2: Tech Stack ────────────────────────────────────────────

/**
 * TechStackStep — pick predefined skills + add custom skills.
 *
 * No Zod validation needed here. SkillSelector and CustomSkillInput
 * are always in a valid state (empty is fine — skills are optional).
 *
 * Reuses the same components from the profile page.
 */
function TechStackStep({
  defaultSkillIds,
  defaultCustomSkills,
  onNext,
  onBack,
}: {
  defaultSkillIds: number[];
  defaultCustomSkills: string[];
  onNext: (skillIds: number[], customSkills: string[]) => void;
  onBack: () => void;
}) {
  const [selectedSkillIds, setSelectedSkillIds] =
    useState<number[]>(defaultSkillIds);
  const [customSkills, setCustomSkills] =
    useState<string[]>(defaultCustomSkills);

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Predefined Skills */}
        <div className="space-y-2">
          <Label>Tech Stack</Label>
          <p className="text-sm text-muted-foreground">
            Select the technologies your project will use
          </p>
          <SkillSelector
            selectedIds={selectedSkillIds}
            onChange={setSelectedSkillIds}
          />
        </div>

        {/* Custom Skills */}
        <div className="space-y-2">
          <Label>Other Technologies</Label>
          <p className="text-sm text-muted-foreground">
            Add technologies not in the list above
          </p>
          <CustomSkillInput skills={customSkills} onChange={setCustomSkills} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            onClick={() => onNext(selectedSkillIds, customSkills)}
          >
            Next: Tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── STEP 3: Tasks ─────────────────────────────────────────────────

/**
 * TasksStep — a dynamic list of tasks/roles needed for the project.
 *
 * Users can add/remove task rows. Each task has a title (required)
 * and optional description.
 *
 * Validation: when "Create Project" is clicked, we validate each
 * task with taskSchema.safeParse(). If any fail, we show errors
 * inline on that task. Empty task list is valid (tasks are optional).
 *
 * safeParse returns { success: true, data } or { success: false, error }
 * instead of throwing, so we can collect all errors before showing them.
 */
function TasksStep({
  defaultTasks,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  defaultTasks: { title: string; description?: string }[];
  onSubmit: (tasks: { title: string; description?: string }[]) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const [tasks, setTasks] = useState<{ title: string; description: string }[]>(
    defaultTasks.map((t) => ({ title: t.title, description: t.description || "" }))
  );
  const [taskErrors, setTaskErrors] = useState<
    Record<number, { title?: string; description?: string }>
  >({});

  const addTask = () => {
    setTasks([...tasks, { title: "", description: "" }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
    // Also clear errors for this task
    setTaskErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateTask = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
    // Clear error for this field when user starts typing
    if (taskErrors[index]?.[field]) {
      setTaskErrors((prev) => ({
        ...prev,
        [index]: { ...prev[index], [field]: undefined },
      }));
    }
  };

  const handleCreate = () => {
    // Validate each task
    const errors: Record<number, { title?: string; description?: string }> = {};
    let hasErrors = false;

    tasks.forEach((task, index) => {
      const result = taskSchema.safeParse(task);
      if (!result.success) {
        hasErrors = true;
        const fieldErrors: { title?: string; description?: string } = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0] as "title" | "description";
          fieldErrors[field] = issue.message;
        });
        errors[index] = fieldErrors;
      }
    });

    if (hasErrors) {
      setTaskErrors(errors);
      return;
    }

    // Clean up: omit empty descriptions
    const cleanedTasks = tasks.map((t) => ({
      title: t.title,
      ...(t.description ? { description: t.description } : {}),
    }));

    onSubmit(cleanedTasks);
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        <div>
          <Label>Roles & Tasks Needed</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            What roles are you looking for? (optional)
          </p>
        </div>

        {/* Task list */}
        {tasks.map((task, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Task {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTask(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Input
                value={task.title}
                onChange={(e) => updateTask(index, "title", e.target.value)}
                placeholder="e.g. Frontend Developer"
              />
              {taskErrors[index]?.title && (
                <p className="text-sm text-destructive">
                  {taskErrors[index].title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={task.description}
                onChange={(e) =>
                  updateTask(index, "description", e.target.value)
                }
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe what this role involves..."
              />
              {taskErrors[index]?.description && (
                <p className="text-sm text-destructive">
                  {taskErrors[index].description}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Add task button */}
        <Button
          type="button"
          variant="outline"
          onClick={addTask}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

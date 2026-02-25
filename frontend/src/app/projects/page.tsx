"use client";

/**
 * Browse Projects Page — /projects
 *
 * "use client" is REQUIRED here because this page uses:
 *   - useSearchParams() — reads URL query params (browser-only hook)
 *   - useRouter() — for client-side navigation when applying filters
 *   - useState / useEffect — manages filter state, loading, API calls
 *   - onChange handlers on inputs — interactive form elements
 *
 * Server Components can't use any of these. The browse page is inherently
 * interactive (search, filter, paginate), so it must be a Client Component.
 *
 * Filter state lives in URL search params so pages are shareable:
 *   /projects?q=react&status=RECRUITING&skillIds=1,5&page=0
 *
 * When the user clicks "Apply Filters", we update the URL via router.push(),
 * which triggers a re-render and a new API fetch via useEffect.
 */

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectCardSkeleton from "@/components/projects/ProjectCardSkeleton";
import { getProjects } from "@/lib/api/projects";
import { getSkillsGrouped } from "@/lib/api/skills";
import { Project } from "@/lib/types/project";
import { GroupedSkills } from "@/lib/types/skill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { schools } from "@/lib/data/schools";

const PAGE_SIZE = 9; // 3 columns x 3 rows

const STATUS_OPTIONS = [
  { value: "RECRUITING", label: "Recruiting" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const CATEGORY_LABELS: Record<string, string> = {
  LANGUAGE: "Languages",
  FRAMEWORK: "Frameworks",
  TOOL: "Tools",
  CONCEPT: "Concepts",
  OTHER: "Other",
};

/**
 * Default export wraps the page content in <Suspense>.
 *
 * Next.js requires useSearchParams() to be inside a Suspense boundary
 * because reading URL params prevents static pre-rendering. Without
 * Suspense, the build fails with:
 *   "useSearchParams() should be wrapped in a suspense boundary"
 *
 * The fallback shows a loading skeleton while the component mounts
 * and reads the URL params.
 */
export default function BrowseProjectsPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="h-8 w-48 animate-pulse rounded bg-muted mb-6" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <BrowseProjectsContent />
      </Suspense>
    </>
  );
}

function BrowseProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ─── Read initial state from URL params ────────────────────────────
  // useSearchParams() returns a read-only URLSearchParams object.
  // We read it on mount and whenever the URL changes.
  const initialQ = searchParams.get("q") || "";
  const initialStatus = searchParams.get("status") || "";
  const initialSchool = searchParams.get("school") || "";
  const initialSkillIds = searchParams.get("skillIds")
    ? searchParams.get("skillIds")!.split(",").map(Number)
    : [];
  const initialPage = Number(searchParams.get("page") || "0");

  // ─── Local filter state (editable before "Apply") ──────────────────
  // These are separate from URL params so the user can type/click
  // without triggering an API call on every keystroke.
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedSchool, setSelectedSchool] = useState(initialSchool);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(initialSkillIds);

  // ─── Data state ────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);

  // ─── Skills for the filter sidebar ─────────────────────────────────
  const [groupedSkills, setGroupedSkills] = useState<GroupedSkills>({});

  // Fetch skills once on mount (for filter checkboxes)
  useEffect(() => {
    getSkillsGrouped()
      .then(setGroupedSkills)
      .catch(() => {});
  }, []);

  // ─── Fetch projects when URL params change ─────────────────────────
  /**
   * useCallback memoizes the function so it only changes when searchParams
   * changes. This prevents the useEffect below from re-running needlessly.
   *
   * The flow: URL changes → searchParams updates → fetchProjects recreated
   * → useEffect fires → new data loaded.
   */
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchParams.get("q") || undefined;
      const status = searchParams.get("status") || undefined;
      const school = searchParams.get("school") || undefined;
      const skillIdsStr = searchParams.get("skillIds");
      const skillIds = skillIdsStr
        ? skillIdsStr.split(",").map(Number)
        : undefined;
      const page = Number(searchParams.get("page") || "0");

      const result = await getProjects({
        q,
        skillIds,
        status,
        school,
        page,
        size: PAGE_SIZE,
      });

      setProjects(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setCurrentPage(result.page);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ─── Apply filters → update URL params ─────────────────────────────
  /**
   * Builds a new URL from the local filter state and navigates to it.
   * router.push() is a client-side navigation (no full reload).
   * We reset to page=0 because the old page might be out of range
   * with the new filter results.
   */
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (selectedStatus) params.set("status", selectedStatus);
    if (selectedSchool) params.set("school", selectedSchool);
    if (selectedSkillIds.length > 0) {
      params.set("skillIds", selectedSkillIds.join(","));
    }
    params.set("page", "0");
    router.push(`/projects?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedSchool("");
    setSelectedSkillIds([]);
    router.push("/projects");
  };

  // ─── Pagination ────────────────────────────────────────────────────
  /**
   * Preserves current filters when navigating pages.
   * Only updates the "page" param, keeps everything else.
   */
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/projects?${params.toString()}`);
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const hasActiveFilters = initialQ || initialStatus || initialSchool || initialSkillIds.length > 0;

  return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">Browse Projects</h1>

        <div className="flex gap-8">
          {/* ─── Filters Sidebar ─────────────────────────────── */}
          <aside className="w-64 shrink-0 space-y-6">
            {/* Search */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="pl-9"
                />
              </div>
            </div>

            {/* School */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">School</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <div className="space-y-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={selectedStatus === opt.value}
                      onChange={() =>
                        setSelectedStatus(
                          selectedStatus === opt.value ? "" : opt.value
                        )
                      }
                      className="accent-primary"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Skills</label>
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {Object.entries(groupedSkills).map(([category, skills]) => (
                  <div key={category}>
                    <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                      {CATEGORY_LABELS[category] || category}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => toggleSkill(skill.id)}
                          className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                            selectedSkillIds.includes(skill.id)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {skill.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply / Clear */}
            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} size="icon">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </aside>

          {/* ─── Project Grid ────────────────────────────────── */}
          <main className="flex-1">
            {!loading && (
              <p className="mb-4 text-sm text-muted-foreground">
                {totalElements} project{totalElements !== 1 ? "s" : ""} found
              </p>
            )}

            {loading ? (
              /* Skeleton loading cards */
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  No projects found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters or search term
                </p>
              </div>
            ) : (
              <>
                {/* Project cards grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 0}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(i)}
                        className="w-9"
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
  );
}
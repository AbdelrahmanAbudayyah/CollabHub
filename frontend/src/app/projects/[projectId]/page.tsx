"use client";

/**
 * Project Detail Page — /projects/[projectId]
 *
 * "use client" is required because:
 *   - useParams() reads the dynamic URL segment (projectId)
 *   - useAuth() accesses the AuthContext for guest vs. member checks
 *   - useState/useEffect for data fetching and edit mode state
 *
 * Guest access policy (from plan.md):
 *   - Guests see: title, description, skills, status
 *   - Guests DON'T see: team members, tasks, GitHub URL
 *   - A "Log in to see more" prompt appears for hidden sections
 *
 * Slice 6 additions:
 *   - JoinRequestButton (contextual: Join / Pending / Member / Leave)
 *   - Bookmark toggle (heart icon)
 *   - Owner: approve/reject panel for pending join requests
 *   - Owner: remove member button next to each team member
 */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import ProjectDetailSkeleton from "@/components/projects/ProjectDetailSkeleton";
import {
  getProjectById,
  updateProject,
  deleteProject,
  getMembershipStatus,
  getPendingJoinRequests,
  reviewJoinRequest,
  removeMember,
  addInterest,
  removeInterest,
} from "@/lib/api/projects";
import { Project, UpdateProjectData, JoinRequest, MembershipStatus } from "@/lib/types/project";
import { useAuth } from "@/lib/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JoinRequestButton from "@/components/projects/JoinRequestButton";
import {
  ExternalLink,
  CheckCircle,
  Circle,
  Pencil,
  Trash2,
  User,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  X,
  Check,
} from "lucide-react";

/**
 * Same status style map as ProjectCard — consistent colors across the app.
 */
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  RECRUITING: { label: "Recruiting", className: "bg-green-100 text-green-800" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-800" },
  ARCHIVED: { label: "Archived", className: "bg-yellow-100 text-yellow-800" },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMaxTeamSize, setEditMaxTeamSize] = useState(2);
  const [editGithubUrl, setEditGithubUrl] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Slice 6: membership status + bookmarks + join requests
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  // ─── Parse project ID ─────────────────────────────────────────────
  const rawId = params.projectId;
  const projectId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

  // ─── Fetch project on mount ────────────────────────────────────────
  useEffect(() => {
    if (isNaN(projectId)) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    getProjectById(projectId)
      .then((p) => {
        setProject(p);
        setEditTitle(p.title);
        setEditDescription(p.description);
        setEditMaxTeamSize(p.maxTeamSize);
        setEditGithubUrl(p.githubUrl || "");
        setEditStatus(p.status);
      })
      .catch(() => setError("Project not found"))
      .finally(() => setLoading(false));
  }, [projectId]);

  // ─── Fetch membership status when auth is ready ───────────────────
  const fetchMembershipStatus = useCallback(async () => {
    if (!isAuthenticated || isNaN(projectId)) return;
    try {
      const status = await getMembershipStatus(projectId);
      setMembershipStatus(status);
    } catch {
      // Not critical — button will just not show
    }
  }, [isAuthenticated, projectId]);

  useEffect(() => {
    if (!authLoading) {
      fetchMembershipStatus();
    }
  }, [authLoading, fetchMembershipStatus]);

  // ─── Fetch pending join requests (owner only) ─────────────────────
  const fetchPendingRequests = useCallback(async () => {
    if (!isAuthenticated || !project || user?.id !== project.ownerId) return;
    try {
      const requests = await getPendingJoinRequests(projectId);
      setPendingRequests(requests);
    } catch {
      // Not critical
    }
  }, [isAuthenticated, project, user?.id, projectId]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  // ─── Helpers ───────────────────────────────────────────────────────
  const isOwner = isAuthenticated && user && project && user.id === project.ownerId;

  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    return `${baseUrl.replace(/\/api\/v1$/, "")}${url}`;
  };

  /**
   * Called when membership status changes (join, leave, approve, etc.)
   * Re-fetches both the project data and membership status.
   */
  const handleStatusChange = async () => {
    await Promise.all([
      getProjectById(projectId).then(setProject),
      fetchMembershipStatus(),
      fetchPendingRequests(),
    ]);
  };

  // ─── Edit handlers ─────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const data: UpdateProjectData = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        maxTeamSize: editMaxTeamSize,
        githubUrl: editGithubUrl.trim() || undefined,
        status: editStatus,
      };
      const updated = await updateProject(project.id, data);
      setProject(updated);
      setIsEditing(false);
    } catch {
      alert("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!project) return;
    setEditTitle(project.title);
    setEditDescription(project.description);
    setEditMaxTeamSize(project.maxTeamSize);
    setEditGithubUrl(project.githubUrl || "");
    setEditStatus(project.status);
    setIsEditing(false);
  };

  // ─── Delete handler ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await deleteProject(project.id);
      router.push("/projects");
    } catch {
      alert("Failed to delete project");
      setDeleting(false);
    }
  };

  // ─── Bookmark handler ─────────────────────────────────────────────
  const handleBookmarkToggle = async () => {
    if (!membershipStatus) return;
    setBookmarkLoading(true);
    try {
      if (membershipStatus.interested) {
        await removeInterest(projectId);
      } else {
        await addInterest(projectId);
      }
      setMembershipStatus({
        ...membershipStatus,
        interested: !membershipStatus.interested,
      });
    } catch {
      alert("Failed to update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  // ─── Review join request handler ──────────────────────────────────
  const handleReview = async (requestId: number, status: "APPROVED" | "REJECTED") => {
    setReviewingId(requestId);
    try {
      await reviewJoinRequest(projectId, requestId, status);
      // Refresh pending requests and project (member list may have changed)
      await handleStatusChange();
    } catch (err: unknown) {
      const errorMsg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      alert(errorMsg || `Failed to ${status.toLowerCase()} request`);
    } finally {
      setReviewingId(null);
    }
  };

  // ─── Remove member handler ────────────────────────────────────────
  const handleRemoveMember = async (memberUserId: number) => {
    setRemovingUserId(memberUserId);
    try {
      await removeMember(projectId, memberUserId);
      await handleStatusChange();
    } catch {
      alert("Failed to remove member");
    } finally {
      setRemovingUserId(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/projects"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>

        {loading && <ProjectDetailSkeleton />}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && project && (
          <div className="space-y-8">
            {/* ─── Header: title + status + owner actions ──────── */}
            <div>
              <div className="flex items-start justify-between gap-4">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-2xl font-bold"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{project.title}</h1>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {/* Bookmark button — shown for authenticated non-owners */}
                  {isAuthenticated && membershipStatus && !isEditing && !isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBookmarkToggle}
                      disabled={bookmarkLoading}
                      title={membershipStatus.interested ? "Remove bookmark" : "Bookmark project"}
                    >
                      {membershipStatus.interested ? (
                        <BookmarkCheck className="h-5 w-5 text-primary" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </Button>
                  )}

                  {isEditing ? (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="rounded-md border px-2 py-1 text-sm"
                    >
                      {Object.entries(STATUS_STYLES).map(([value, { label }]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        STATUS_STYLES[project.status]?.className || "bg-gray-100"
                      }`}
                    >
                      {STATUS_STYLES[project.status]?.label || project.status}
                    </span>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Created by{" "}
                <Link
                  href={`/users/${project.ownerId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {project.ownerFirstName} {project.ownerLastName}
                </Link>
              </p>

              {/* Owner action buttons */}
              {isOwner && !isEditing && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              )}

              {/* Join / Leave / Pending button — for non-owners */}
              {isAuthenticated && membershipStatus && !isEditing && (
                <div className="mt-4">
                  <JoinRequestButton
                    projectId={projectId}
                    status={membershipStatus.status}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              )}

              {/* Edit save/cancel buttons */}
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* ─── Delete confirmation modal ───────────────────── */}
            {showDeleteConfirm && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <p className="font-medium text-destructive">
                  Are you sure you want to delete this project?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This action cannot be undone. All tasks and members will be removed.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Yes, delete"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* ─── Description ─────────────────────────────────── */}
            <div>
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              ) : (
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>

            {/* ─── Skills ──────────────────────────────────────── */}
            {(project.skills.length > 0 || project.customSkills.length > 0) && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Tech Stack</h2>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                  {project.customSkills.map((skill, i) => (
                    <Badge key={`custom-${i}`} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Team Size (editable) ────────────────────────── */}
            {isEditing && (
              <div>
                <Label className="mb-1.5 block">Max Team Size</Label>
                <Input
                  type="number"
                  min={2}
                  max={20}
                  value={editMaxTeamSize}
                  onChange={(e) => setEditMaxTeamSize(Number(e.target.value))}
                  className="w-32"
                />
              </div>
            )}

            {/* ─── GitHub URL (editable) ───────────────────────── */}
            {isEditing && (
              <div>
                <Label className="mb-1.5 block">GitHub URL</Label>
                <Input
                  value={editGithubUrl}
                  onChange={(e) => setEditGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
            )}

            {/* ─── Sections hidden from guests ─────────────────── */}
            {!authLoading && !isAuthenticated ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="font-medium text-muted-foreground">
                  Log in to see the full project details
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Team members, open tasks, and repository link are visible to logged-in users.
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* ─── GitHub link ───────────────────────────────── */}
                {!isEditing && project.githubUrl && (
                  <div>
                    <h2 className="mb-2 text-lg font-semibold">Repository</h2>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {project.githubUrl}
                    </a>
                  </div>
                )}

                {/* ─── Pending Join Requests (owner only) ───────── */}
                {isOwner && pendingRequests.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold">
                      Join Requests ({pendingRequests.length})
                    </h2>
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-start justify-between gap-3 rounded-lg border p-3"
                        >
                          <div className="flex items-start gap-3">
                            {/* Requester avatar */}
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                              {req.userProfilePicUrl ? (
                                <img
                                  src={getFullImageUrl(req.userProfilePicUrl)!}
                                  alt={`${req.userFirstName}'s avatar`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/users/${req.userId}`}
                                className="text-sm font-medium hover:underline"
                              >
                                {req.userFirstName} {req.userLastName}
                              </Link>
                              {req.message && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  &ldquo;{req.message}&rdquo;
                                </p>
                              )}
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {/* Approve / Reject buttons */}
                          <div className="flex gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => handleReview(req.id, "APPROVED")}
                              disabled={reviewingId === req.id}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleReview(req.id, "REJECTED")}
                              disabled={reviewingId === req.id}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Team Members ──────────────────────────────── */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold">
                    Team ({project.members.length}/{project.maxTeamSize})
                  </h2>
                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <Link
                          href={`/users/${member.userId}`}
                          className="flex items-center gap-3"
                        >
                          {/* Avatar */}
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                            {member.profilePicUrl ? (
                              <img
                                src={getFullImageUrl(member.profilePicUrl)!}
                                alt={`${member.firstName}'s avatar`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          {/* Name + role */}
                          <div>
                            <p className="text-sm font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.role}
                            </p>
                          </div>
                        </Link>

                        {/* Owner can remove non-owner members */}
                        {isOwner && member.role !== "Owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removingUserId === member.userId}
                            title="Remove member"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── Tasks ─────────────────────────────────────── */}
                {project.tasks.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold">Open Roles / Tasks</h2>
                    <div className="space-y-2">
                      {project.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                        >
                          {task.isFilled ? (
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div>
                            <p className={`text-sm font-medium ${task.isFilled ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/context/AuthContext";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectCardSkeleton from "@/components/projects/ProjectCardSkeleton";
import { Button } from "@/components/ui/button";
import {
  getMyOwnedProjects,
  getMyJoinedProjects,
  getMyInterestedProjects,
  getPendingJoinRequests,
  reviewJoinRequest,
} from "@/lib/api/projects";
import { Project, JoinRequest } from "@/lib/types/project";
import { User } from "lucide-react";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
          <DashboardContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}

type Tab = "owned" | "joined" | "interested";

function DashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("owned");

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Welcome back, {user?.firstName}!
      </p>

      {/* Tab buttons */}
      <div className="mt-6 flex gap-1 border-b">
        {(["owned", "joined", "interested"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "owned"
              ? "My Projects"
              : tab === "joined"
                ? "Joined"
                : "Bookmarked"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "owned" && <OwnedTab />}
        {activeTab === "joined" && <JoinedTab />}
        {activeTab === "interested" && <InterestedTab />}
      </div>
    </div>
  );
}

// ─── OWNED TAB ──────────────────────────────────────────────────────

function OwnedTab() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", "owned"],
    queryFn: getMyOwnedProjects,
  });

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div>
      {/* Pending join requests across all owned projects */}
      {projects && projects.length > 0 && (
        <PendingRequestsSection projects={projects} />
      )}

      {/* Project list */}
      {!projects || projects.length === 0 ? (
        <EmptyState message="You haven't created any projects yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PENDING JOIN REQUESTS (inside Owned tab) ───────────────────────

function PendingRequestsSection({ projects }: { projects: Project[] }) {
  const queryClient = useQueryClient();

  // Fetch pending requests for all owned projects in parallel
  const { data: allRequests, isLoading } = useQuery({
    queryKey: ["pendingRequests", "all"],
    queryFn: async () => {
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const requests = await getPendingJoinRequests(project.id);
            return requests.map((r) => ({ ...r, projectTitle: project.title }));
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    },
  });

  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const handleReview = async (
    projectId: number,
    requestId: number,
    status: "APPROVED" | "REJECTED"
  ) => {
    setReviewingId(requestId);
    try {
      await reviewJoinRequest(projectId, requestId, status);
      // Refetch both pending requests and owned projects (member count changed)
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "owned"] });
    } catch {
      // Error handled by global handler
    } finally {
      setReviewingId(null);
    }
  };

  if (isLoading || !allRequests || allRequests.length === 0) return null;

  const SERVER_ROOT = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  ).replace(/\/api\/v1$/, "");

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3">
        Pending Join Requests ({allRequests.length})
      </h2>
      <div className="space-y-3">
        {allRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              {/* Requester avatar */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-muted">
                {request.userProfilePicUrl ? (
                  <img
                    src={`${SERVER_ROOT}${request.userProfilePicUrl}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {request.userFirstName} {request.userLastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  wants to join{" "}
                  <span className="font-medium text-foreground">
                    {(request as JoinRequest & { projectTitle: string }).projectTitle}
                  </span>
                </p>
                {request.message && (
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    &quot;{request.message}&quot;
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={reviewingId === request.id}
                onClick={() =>
                  handleReview(request.projectId, request.id, "REJECTED")
                }
              >
                Reject
              </Button>
              <Button
                size="sm"
                disabled={reviewingId === request.id}
                onClick={() =>
                  handleReview(request.projectId, request.id, "APPROVED")
                }
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── JOINED TAB ─────────────────────────────────────────────────────

function JoinedTab() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", "joined"],
    queryFn: getMyJoinedProjects,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (!projects || projects.length === 0) {
    return <EmptyState message="You haven't joined any projects yet." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// ─── INTERESTED TAB ─────────────────────────────────────────────────

function InterestedTab() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", "interested"],
    queryFn: getMyInterestedProjects,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (!projects || projects.length === 0) {
    return <EmptyState message="You haven't bookmarked any projects yet." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

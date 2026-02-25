/**
 * ProjectCard — displays a project summary in the browse grid.
 *
 * Shows: title, description (truncated), skills badges, team size,
 * status badge, and owner name. Clicking the card navigates to
 * the project detail page.
 *
 * No "use client" needed here — this component has no hooks or
 * event handlers. It just renders props. However, it will still
 * run as a Client Component when imported by a "use client" page
 * (like the browse page), because the client boundary cascades
 * to all children.
 */

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/types/project";
import { Users } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

/**
 * Maps project status to a human-readable label and color.
 * The status comes from the backend as an enum string (e.g., "RECRUITING").
 */
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  RECRUITING: { label: "Recruiting", className: "bg-green-100 text-green-800" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-800" },
  ARCHIVED: { label: "Archived", className: "bg-yellow-100 text-yellow-800" },
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusInfo = STATUS_STYLES[project.status] || {
    label: project.status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg">{project.title}</CardTitle>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-1.5">
          {project.skills.slice(0, 4).map((skill) => (
            <Badge key={skill.id} variant="secondary" className="text-xs">
              {skill.name}
            </Badge>
          ))}
          {project.customSkills.slice(0, Math.max(0, 4 - project.skills.length)).map((skill, i) => (
            <Badge key={`custom-${i}`} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {project.skills.length + project.customSkills.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{project.skills.length + project.customSkills.length - 4} more
            </Badge>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            by {project.ownerFirstName} {project.ownerLastName}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {project.members.length}/{project.maxTeamSize}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

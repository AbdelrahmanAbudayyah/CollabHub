"use client";

/**
 * Public Profile Page — /users/[userId]
 *
 * Displays any user's profile (read-only). No login required.
 *
 * Next.js Dynamic Routes:
 * The folder name [userId] tells Next.js this is a dynamic segment.
 * URL: /users/42 → params.userId = "42"
 *
 * useParams() hook gives us access to these URL parameters.
 * It returns { userId: "42" } as a string — we parse it to a number.
 *
 * This page does NOT use <ProtectedRoute> because public profiles
 * should be viewable by anyone (including guests).
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { getUserById } from "@/lib/api/users";
import { UserProfile } from "@/lib/types/user";
import { User, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PublicProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Parse the userId from URL params.
     *
     * params.userId could be a string or string[] (Next.js typing).
     * We handle both cases. parseInt converts "42" → 42.
     * isNaN checks if parsing failed (e.g. "/users/abc").
     */
    const rawId = params.userId;
    const userId = Number(Array.isArray(rawId) ? rawId[0] : rawId);

    if (isNaN(userId)) {
      setError("Invalid user ID");
      setLoading(false);
      return;
    }

    getUserById(userId)
      .then(setProfile)
      .catch(() => setError("User not found"))
      .finally(() => setLoading(false));
  }, [params.userId]);

  /**
   * Helper to build full image URL from relative path.
   * Same logic as ProfilePicUpload — prepend server root.
   */
  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const serverRoot = baseUrl.replace(/\/api\/v1$/, "");
    return `${serverRoot}${url}`;
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-10">
        {loading && (
          <p className="text-muted-foreground">Loading profile...</p>
        )}

        {error && <p className="text-destructive">{error}</p>}

        {profile && (
          <div className="space-y-8">
            {/* Header: avatar + name + school */}
            <div className="flex items-center gap-6">
              {/* Profile picture or placeholder */}
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
                {profile.profilePicUrl ? (
                  <img
                    src={getFullImageUrl(profile.profilePicUrl)!}
                    alt={`${profile.firstName}'s profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.schoolName && (
                  <p className="text-muted-foreground">{profile.schoolName}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">About</h2>
                {/*
                  whitespace-pre-wrap preserves line breaks the user typed.
                  Without it, "Line 1\nLine 2" would render on one line.
                */}
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {(profile.skills.length > 0 ||
              profile.customSkills.length > 0) && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                  {profile.customSkills.map((skill, index) => (
                    <Badge key={`custom-${index}`} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(profile.linkedinUrl || profile.githubUrl) && (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Links</h2>
                <div className="flex flex-col gap-2">
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

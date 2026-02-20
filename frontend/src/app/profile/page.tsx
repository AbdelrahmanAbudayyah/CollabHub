"use client";

/**
 * Profile Page — /profile
 *
 * This page has TWO modes:
 * 1. View mode (default): Shows the authenticated user's profile read-only,
 *    with an "Edit Profile" button.
 * 2. Edit mode: Shows the form to edit profile fields, skills, and picture.
 *    Toggled by clicking "Edit Profile" / "Cancel".
 *
 * The `editing` state controls which mode is shown.
 * When the user saves successfully, we switch back to view mode and
 * re-fetch the profile so the view reflects the latest data.
 */

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import ProfilePicUpload from "@/components/profile/ProfilePicUpload";
import SkillSelector from "@/components/profile/SkillSelector";
import CustomSkillInput from "@/components/profile/CustomSkillInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, updateProfile, updateSkills } from "@/lib/api/users";
import { profileSchema, ProfileFormData } from "@/lib/utils/validators";
import { schools } from "@/lib/data/schools";
import { ApiResponse } from "@/lib/types/api";
import { UserProfile } from "@/lib/types/user";
import { useAuth } from "@/lib/context/AuthContext";
import { User, ExternalLink, Pencil } from "lucide-react";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <ProfileContent />
    </ProtectedRoute>
  );
}

/**
 * ProfileContent manages both view and edit modes.
 *
 * State:
 * - `profile`: the full UserProfile fetched from GET /users/me
 * - `editing`: boolean toggle between view/edit modes
 * - `loading`: true while the initial fetch is in progress
 *
 * On mount, we fetch the profile once. When switching to edit mode,
 * we populate the form with the current profile data. After a
 * successful save, we re-fetch the profile and switch back to view.
 */
function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { refreshUser } = useAuth();

  /**
   * fetchProfile loads the user's full profile from the API.
   *
   * useCallback memoizes the function so it doesn't get recreated
   * on every render. This lets us safely include it in useEffect
   * dependency arrays without causing infinite loops.
   */
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Called after a successful save in the edit form.
   * Re-fetches the profile so the view mode shows updated data,
   * updates the navbar via refreshUser, and exits edit mode.
   */
  const handleSaveSuccess = async () => {
    await fetchProfile();
    refreshUser();
    setEditing(false);
  };

  /**
   * Helper to build full image URL from relative path.
   * Profile pic URLs are stored as relative paths (e.g. /uploads/profile-pics/uuid.jpg).
   * We prepend the server root to make them loadable in <img> tags.
   */
  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const serverRoot = baseUrl.replace(/\/api\/v1$/, "");
    return `${serverRoot}${url}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-destructive">Failed to load profile.</p>
      </div>
    );
  }

  /**
   * Conditional rendering based on the `editing` state.
   * View mode shows the profile read-only. Edit mode shows the form.
   */
  if (editing) {
    return (
      <ProfileEditForm
        profile={profile}
        onSaveSuccess={handleSaveSuccess}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header row: title + edit button */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="space-y-8">
        {/* Avatar + name + school */}
        <div className="flex items-center gap-6">
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
            <h2 className="text-2xl font-bold">
              {profile.firstName} {profile.lastName}
            </h2>
            {profile.schoolName && (
              <p className="text-muted-foreground">{profile.schoolName}</p>
            )}
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div>
            <h3 className="mb-2 text-lg font-semibold">About</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills */}
        {(profile.skills.length > 0 || profile.customSkills.length > 0) && (
          <div>
            <h3 className="mb-2 text-lg font-semibold">Skills</h3>
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
            <h3 className="mb-2 text-lg font-semibold">Links</h3>
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
    </div>
  );
}

/**
 * ProfileEditForm — the edit mode UI.
 *
 * Props:
 * - profile: the current UserProfile data (used to pre-fill the form)
 * - onSaveSuccess: called after a successful save (parent re-fetches + exits edit mode)
 * - onCancel: called when the user clicks "Cancel" (parent exits edit mode)
 *
 * This is extracted as a separate component so that React Hook Form
 * mounts fresh each time the user enters edit mode. This avoids stale
 * form state from a previous edit session.
 */
function ProfileEditForm({
  profile,
  onSaveSuccess,
  onCancel,
}: {
  profile: UserProfile;
  onSaveSuccess: () => Promise<void>;
  onCancel: () => void;
}) {
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(
    profile.skills.map((s) => s.id)
  );
  const [customSkills, setCustomSkills] = useState<string[]>(
    profile.customSkills || []
  );
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(
    profile.profilePicUrl
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const { refreshUser } = useAuth();

  /**
   * useForm is initialized with defaultValues from the profile prop.
   *
   * Because ProfileEditForm mounts fresh each time we enter edit mode,
   * the defaultValues always reflect the latest profile data.
   * No need for a separate useEffect + reset() call.
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio || "",
      linkedinUrl: profile.linkedinUrl || "",
      githubUrl: profile.githubUrl || "",
      schoolName: profile.schoolName || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null);

    try {
      // Sequential, NOT parallel! If we used Promise.all, both
      // endpoints would load the User entity simultaneously. Hibernate
      // includes ALL columns in its UPDATE by default, so whichever
      // transaction commits last would overwrite the other's changes.
      // By running sequentially, updateSkills() loads the user AFTER
      // updateProfile() has committed, so it sees the updated values.
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
        githubUrl: data.githubUrl || undefined,
        schoolName: data.schoolName || undefined,
        customSkills,
      });
      await updateSkills({ skillIds: selectedSkillIds });

      await onSaveSuccess();
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        const apiError = error.response.data as ApiResponse<unknown>;
        setServerError(apiError.message || "Failed to update profile");
      } else {
        setServerError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Profile Picture — uploads instantly, separate from form submit */}
      <div className="mb-8">
        <ProfilePicUpload
          currentPicUrl={profilePicUrl}
          onUploadSuccess={(newUrl) => {
            setProfilePicUrl(newUrl);
            refreshUser();
          }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Name fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-sm text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-sm text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            {...register("bio")}
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Tell others about yourself..."
          />
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio.message}</p>
          )}
        </div>

        {/* School dropdown */}
        <div className="space-y-2">
          <Label htmlFor="schoolName">School</Label>
          <select
            id="schoolName"
            {...register("schoolName")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select your school</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        {/* Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              {...register("linkedinUrl")}
              placeholder="https://linkedin.com/in/..."
            />
            {errors.linkedinUrl && (
              <p className="text-sm text-destructive">
                {errors.linkedinUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              {...register("githubUrl")}
              placeholder="https://github.com/..."
            />
            {errors.githubUrl && (
              <p className="text-sm text-destructive">
                {errors.githubUrl.message}
              </p>
            )}
          </div>
        </div>

        {/* Predefined Skills */}
        <div className="space-y-2">
          <Label>Skills</Label>
          <p className="text-sm text-muted-foreground">
            Select the technologies you know
          </p>
          <SkillSelector
            selectedIds={selectedSkillIds}
            onChange={setSelectedSkillIds}
          />
        </div>

        {/* Custom Skills */}
        <div className="space-y-2">
          <Label>Other Skills</Label>
          <p className="text-sm text-muted-foreground">
            Add skills not in the list above
          </p>
          <CustomSkillInput skills={customSkills} onChange={setCustomSkills} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : "Save Profile"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

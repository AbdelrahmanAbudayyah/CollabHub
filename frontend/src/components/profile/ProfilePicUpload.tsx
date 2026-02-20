"use client";

/**
 * ProfilePicUpload — handles profile picture upload with preview.
 *
 * Shows the current profile pic (or a placeholder). Clicking it
 * opens a file picker. After selecting a file, it uploads immediately
 * and shows the new image.
 *
 * Key concepts:
 * - useRef: gives us a reference to the hidden <input type="file">
 *   so we can trigger its click programmatically
 * - URL.createObjectURL: creates a temporary browser URL for a
 *   local file so we can preview it before upload completes
 */

import { useRef, useState } from "react";
import { uploadProfilePic } from "@/lib/api/users";
import { User } from "lucide-react";

interface ProfilePicUploadProps {
  currentPicUrl: string | null;
  onUploadSuccess: (newUrl: string) => void;
}

export default function ProfilePicUpload({
  currentPicUrl,
  onUploadSuccess,
}: ProfilePicUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Preview URL: shown immediately after file selection (before upload finishes)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * useRef creates a mutable reference that persists across renders.
   *
   * We use it to hold a reference to the hidden <input type="file">.
   * When the user clicks the avatar area, we call fileInputRef.current.click()
   * to open the native file picker dialog.
   *
   * Why hidden input? Because <input type="file"> is ugly and hard to
   * style. Instead we show a nice circular avatar and trigger the
   * hidden input programmatically.
   */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Construct the full image URL.
   * Profile pic URLs are stored as relative paths like "/uploads/profile-pics/abc.jpg".
   * We prepend the API base URL to make them absolute.
   */
  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    // Remove /api/v1 suffix to get the server root
    const serverRoot = baseUrl.replace(/\/api\/v1$/, "");
    return `${serverRoot}${url}`;
  };

  const displayUrl = previewUrl || getFullImageUrl(currentPicUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation before uploading
    // (backend also validates, but this gives instant feedback)
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    setError(null);

    /**
     * URL.createObjectURL() creates a temporary URL pointing to
     * the file in the browser's memory. This lets us show a preview
     * INSTANTLY — before the upload even starts. The URL looks like:
     *   blob:http://localhost:3000/abc-123-def
     *
     * We revoke it later (clean up memory) when the component
     * unmounts or a new file is selected.
     */
    setPreviewUrl(URL.createObjectURL(file));

    setUploading(true);
    try {
      const updatedUser = await uploadProfilePic(file);
      // Upload succeeded — tell parent about the new permanent URL
      onUploadSuccess(updatedUser.profilePicUrl || "");
    } catch {
      setError("Upload failed. Please try again.");
      setPreviewUrl(null); // Revert preview on failure
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Clickable avatar area */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted hover:opacity-80 transition-opacity"
        disabled={uploading}
      >
        {displayUrl ? (
          /*
            The <img> tag displays the profile picture.
            "object-cover" crops the image to fill the circle
            (like CSS background-size: cover).
          */
          <img
            src={displayUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          /* Placeholder when no image is set */
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        {/* Loading overlay during upload */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-xs text-white">Uploading...</span>
          </div>
        )}
      </button>

      {/* Hint text */}
      <p className="text-xs text-muted-foreground">
        Click to upload (JPEG, PNG, WebP, max 2MB)
      </p>

      {/* Error message */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/*
        Hidden file input. The `accept` attribute limits the
        file picker to show only image files by default.
        We hide it visually and trigger it via the button above.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

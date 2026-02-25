"use client";

/**
 * JoinRequestButton — contextual button based on user's membership status.
 *
 * Shows different UI depending on the user's relationship to the project:
 *   OWNER   → nothing (owner uses edit/delete buttons instead)
 *   MEMBER  → "Leave Project" with confirmation
 *   PENDING → "Request Pending" (disabled, informational)
 *   NONE    → "Request to Join" with optional message input
 *
 * Props:
 *   projectId  — which project this button is for
 *   status     — the user's current relationship (from membership-status API)
 *   onStatusChange — callback when status changes (so parent can refresh data)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createJoinRequest,
  leaveProject,
} from "@/lib/api/projects";
import { LogIn, Clock, LogOut, Send } from "lucide-react";

interface JoinRequestButtonProps {
  projectId: number;
  status: "OWNER" | "MEMBER" | "PENDING" | "NONE";
  onStatusChange: () => void;
}

export default function JoinRequestButton({
  projectId,
  status,
  onStatusChange,
}: JoinRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // ─── Join Request ──────────────────────────────────────────────────

  const handleJoinRequest = async () => {
    setLoading(true);
    try {
      await createJoinRequest(projectId, message.trim() || undefined);
      setShowMessageInput(false);
      setMessage("");
      onStatusChange();
    } catch (err: unknown) {
      const errorMsg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      alert(errorMsg || "Failed to submit join request");
    } finally {
      setLoading(false);
    }
  };

  // ─── Leave Project ─────────────────────────────────────────────────

  const handleLeave = async () => {
    setLoading(true);
    try {
      await leaveProject(projectId);
      setShowLeaveConfirm(false);
      onStatusChange();
    } catch {
      alert("Failed to leave project");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render based on status ────────────────────────────────────────

  // Owner sees nothing here — they have edit/delete buttons
  if (status === "OWNER") return null;

  // PENDING — informational, can't click
  if (status === "PENDING") {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Clock className="h-4 w-4" />
        Request Pending
      </Button>
    );
  }

  // MEMBER — leave button with confirmation
  if (status === "MEMBER") {
    if (showLeaveConfirm) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to leave this project?
          </p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              disabled={loading}
            >
              {loading ? "Leaving..." : "Yes, leave"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaveConfirm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setShowLeaveConfirm(true)}
      >
        <LogOut className="h-4 w-4" />
        Leave Project
      </Button>
    );
  }

  // NONE — join request with optional message
  if (showMessageInput) {
    return (
      <div className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Why do you want to join? (optional)"
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleJoinRequest}
            disabled={loading}
            className="gap-2"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? "Sending..." : "Send Request"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowMessageInput(false);
              setMessage("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button className="gap-2" onClick={() => setShowMessageInput(true)}>
      <LogIn className="h-4 w-4" />
      Request to Join
    </Button>
  );
}

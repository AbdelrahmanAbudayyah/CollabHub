/**
 * Skeleton Loading Component
 *
 * A simple, reusable skeleton loader for showing loading states.
 * Uses Tailwind's animate-pulse for the shimmer effect.
 *
 * Usage:
 *   <Skeleton className="h-4 w-full" />
 *   <Skeleton className="h-12 w-12 rounded-full" />
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

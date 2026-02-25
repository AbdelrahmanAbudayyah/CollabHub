/**
 * ProjectDetailSkeleton — Loading skeleton for project detail page
 *
 * Matches the structure of the project detail page layout
 * to provide a smooth loading experience.
 */

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header: title + status */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-48" />
      </div>

      {/* Description */}
      <div>
        <Skeleton className="mb-2 h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-2 h-4 w-4/6" />
      </div>

      {/* Tech Stack */}
      <div>
        <Skeleton className="mb-2 h-6 w-32" />
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Team Members */}
      <div>
        <Skeleton className="mb-3 h-6 w-48" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <Skeleton className="mb-3 h-6 w-48" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <Skeleton className="mt-0.5 h-4 w-4 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-1 h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

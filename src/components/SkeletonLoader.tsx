import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonLoader: React.FC = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <div className="pt-2 space-y-3">
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export default SkeletonLoader;

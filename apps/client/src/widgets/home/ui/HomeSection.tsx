import type { ReactNode } from "react";
import { Button } from "../../../shared/ui/button";
import { ListSkeleton } from "../../../shared/ui/page-skeleton";

export function HomeSection({
  pending,
  error,
  empty,
  onRetry,
  children,
}: {
  pending: boolean;
  error: boolean;
  empty: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (pending) return <ListSkeleton />;
  if (error)
    return (
      <div role="alert" className="space-y-3 py-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load data</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  if (empty)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
    );
  return children;
}

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export function ChartCard({
  title,
  pending,
  error,
  empty,
  onRetry,
  action,
  children,
}: {
  title: string;
  pending: boolean;
  error: boolean;
  empty: boolean;
  onRetry: () => void;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card role="region" aria-label={title} className="min-w-0 overflow-visible">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {pending ? (
          <Skeleton
            className="h-56 w-full"
            aria-label={`Loading ${title.toLowerCase()}`}
          />
        ) : error ? (
          <div
            role="alert"
            className="flex h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
          >
            <p>Could not load chart</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : empty ? (
          <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No data
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

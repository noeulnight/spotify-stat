import { useEffect, useRef } from "react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export function InfiniteScroll({
  hasMore,
  pending,
  error,
  onLoad,
}: {
  hasMore: boolean;
  pending: boolean;
  error: boolean;
  onLoad: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore || pending || error) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          onLoad();
        }
      },
      {
        root: target.closest("[data-scroll-container]"),
        rootMargin: "0px 0px 200px 0px",
      },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, pending, error, onLoad]);

  if (!hasMore && !error) return null;
  return (
    <div
      ref={sentinel}
      className="flex min-h-12 flex-col items-center justify-center gap-2 py-4"
    >
      {pending && (
        <div
          role="status"
          aria-label="Loading more"
          className="w-full space-y-3"
        >
          <span className="sr-only">Loading more</span>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
      )}
      {error && (
        <>
          <p role="alert" className="text-sm text-muted-foreground">
            Could not load more
          </p>
          <Button variant="outline" disabled={pending} onClick={onLoad}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
}

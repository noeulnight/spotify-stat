import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { useDateFormat } from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { createRecommendationQueries } from "../api/queries";
import { createRecommendationsApi } from "../api/recommendations";
import { RecommendationCover } from "./RecommendationCover";

export function RecommendationInbox() {
  const { client, queryClient } = useApiRuntime();
  const [page, setPage] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const dateFormat = useDateFormat();
  const api = createRecommendationsApi(client);
  const queries = createRecommendationQueries(client);
  const queryKey = queries.queryKey;
  const inbox = useQuery(
    {
      ...queries.inbox(page * 20),
    },
    queryClient,
  );
  const remove = useMutation(
    {
      mutationFn: api.remove,
      onSuccess: async () => {
        setConfirmId(null);
        if (page > 0 && inbox.data?.length === 1) setPage(page - 1);
        await queryClient.invalidateQueries({ queryKey });
      },
    },
    queryClient,
  );
  return (
    <Card aria-label="Received song recommendations">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Received recommendations</CardTitle>
        <Button
          variant="outline"
          size="sm"
          disabled={inbox.isFetching}
          onClick={() => void inbox.refetch()}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {inbox.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading recommendations…
          </p>
        ) : inbox.isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm">Could not load recommendations.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void inbox.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : !inbox.data.length ? (
          <p className="text-sm text-muted-foreground">
            No recommendations yet
          </p>
        ) : (
          <ul className="divide-y">
            {inbox.data.map((row) => (
              <li
                key={row._id}
                className="flex items-start justify-between gap-3 py-4 first:pt-0"
              >
                <RecommendationCover song={row} />
                <div className="min-w-0 flex-1 space-y-1">
                  <a
                    href={`https://open.spotify.com/track/${row.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    {row.title ?? "Open Spotify track"}
                    <ExternalLinkIcon
                      className="size-3 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                  {row.artists.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {row.artists.join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {row.name || "Anonymous"} ·{" "}
                    <time dateTime={row.createdAt}>
                      {dateFormat.format(new Date(row.createdAt))}
                    </time>
                  </p>
                  {row.message && (
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {row.message}
                    </p>
                  )}
                </div>
                {confirmId === row._id ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(row._id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete recommendation: ${row.title ?? row.trackId}`}
                    onClick={() => {
                      remove.reset();
                      setConfirmId(row._id);
                    }}
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {remove.isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not delete the recommendation. Please try again.
          </p>
        )}
        {!inbox.isPending &&
          !inbox.isError &&
          (page > 0 || inbox.data.length === 20) && (
            <nav
              aria-label="Recommendation pages"
              className="flex justify-between gap-3"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || inbox.isFetching}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={inbox.data.length < 20 || inbox.isFetching}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </nav>
          )}
      </CardContent>
    </Card>
  );
}

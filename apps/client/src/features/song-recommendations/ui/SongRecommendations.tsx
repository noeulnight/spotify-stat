import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useAccount, useDateFormat } from "../../../entities/account";
import { PageSkeleton } from "../../../shared/ui/page-skeleton";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/ui/card";
import { createRecommendationQueries } from "../api/queries";
import { RecommendSongForm } from "./RecommendSongForm";
import { RecommendationInbox } from "./RecommendationInbox";
import { RecommendationCover } from "./RecommendationCover";

export function SongRecommendations({ publicToken }: { publicToken?: string }) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  if (publicToken && account.isPending) return <PageSkeleton layout="list" />;
  if (
    publicToken &&
    account.data?.status &&
    account.data.user.settings.recommendationsEnabled === false
  )
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Song recommendations are disabled
      </p>
    );
  return publicToken ? (
    <div className="@container/recommendations">
      <div className="grid items-start gap-5 @min-[36rem]/recommendations:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <RecommendSongForm publicToken={publicToken} />
        <PublicRecommendations publicToken={publicToken} />
      </div>
    </div>
  ) : (
    <RecommendationInbox />
  );
}

function PublicRecommendations({ publicToken }: { publicToken: string }) {
  const [page, setPage] = useState(0);
  const { client, queryClient } = useApiRuntime(publicToken);
  const dates = useDateFormat(publicToken);
  const query = useQuery(
    createRecommendationQueries(client).publicList(page * 20),
    queryClient,
  );
  return (
    <Card aria-label="Recommended songs" className="min-w-0">
      <CardHeader>
        <CardTitle>Recommended songs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading recommendations…
          </p>
        ) : query.isError ? (
          <div role="alert" className="space-y-2">
            <p>
              {isAxiosError(query.error) && query.error.response?.status === 404
                ? "Share link unavailable"
                : isAxiosError(query.error) &&
                    query.error.response?.status === 403
                  ? "Song recommendations are disabled"
                  : "Could not load recommendations"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : !query.data.length ? (
          <p className="text-sm text-muted-foreground">
            No recommendations yet
          </p>
        ) : (
          <ul className="divide-y">
            {query.data.map((song) => (
              <li
                key={song.trackId}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <RecommendationCover song={song} />
                <div className="min-w-0 flex-1">
                  <a
                    href={`https://open.spotify.com/track/${song.trackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-medium hover:underline"
                  >
                    {song.title ?? "Open Spotify track"}
                  </a>
                  <p className="truncate text-xs text-muted-foreground">
                    {song.artists.join(", ")}
                  </p>
                </div>
                <time
                  dateTime={song.createdAt}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {dates.format(new Date(song.createdAt))}
                </time>
              </li>
            ))}
          </ul>
        )}
        {query.data && (page > 0 || query.data.length === 20) && (
          <nav
            aria-label="Recommendation pages"
            className="flex justify-between gap-3"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || query.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={query.data.length < 20 || query.isFetching}
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

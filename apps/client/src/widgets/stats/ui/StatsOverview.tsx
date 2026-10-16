import { Card, CardContent } from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";
import { formatListeningTime } from "../model/stats-series";
import type { useStats } from "../model/use-stats";

export function StatsOverview({
  stats,
}: {
  stats: ReturnType<typeof useStats>;
}) {
  const { songs, time, artists } = stats;
  const metrics = [
    {
      label: "Plays",
      value: (songs.data?.[0]?.count ?? 0).toLocaleString("en-US"),
      query: songs,
    },
    {
      label: "Listening time",
      value: formatListeningTime(time.data?.[0]?.count ?? 0),
      query: time,
    },
    {
      label: "Unique songs",
      value: (songs.data?.[0]?.differents ?? 0).toLocaleString("en-US"),
      query: songs,
    },
    {
      label: "Unique artists",
      value: (artists.data?.[0]?.differents ?? 0).toLocaleString("en-US"),
      query: artists,
    },
  ];
  return (
    <Card aria-label="Listening stats">
      <CardContent>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {metrics.map(({ label, value, query }) => (
            <div key={label} className="min-w-0 space-y-2">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-semibold tabular-nums sm:text-3xl">
                {query.isPending ? (
                  <Skeleton
                    className="h-8 w-20"
                    aria-label={`Loading ${label.toLowerCase()}`}
                  />
                ) : query.isError ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void query.refetch()}
                  >
                    Retry {label.toLowerCase()}
                  </Button>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

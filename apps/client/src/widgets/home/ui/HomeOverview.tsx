import { HomeSectionLink } from "./HomeSectionLink";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";
import { formatHomeDuration, getHomeChange } from "../model/home-periods";
import type { useHome } from "../model/use-home";
import { HomePeriodFilter } from "./HomePeriodFilter";

export function HomeOverview({
  home,
  publicToken,
}: {
  home: ReturnType<typeof useHome>;
  publicToken?: string;
}) {
  const metrics = [
    {
      label: "Plays",
      value: (home.songs.data?.[0]?.count ?? 0).toLocaleString("en-US"),
      current: home.songs.data?.[0]?.count ?? 0,
      previous: home.previousSongs.data?.[0]?.count ?? 0,
      query: home.songs,
      previousQuery: home.previousSongs,
    },
    {
      label: "Listening time",
      value: formatHomeDuration(home.time.data?.[0]?.count ?? 0),
      current: home.time.data?.[0]?.count ?? 0,
      previous: home.previousTime.data?.[0]?.count ?? 0,
      query: home.time,
      previousQuery: home.previousTime,
    },
    {
      label: "Unique songs",
      value: (home.songs.data?.[0]?.differents ?? 0).toLocaleString("en-US"),
      current: home.songs.data?.[0]?.differents ?? 0,
      previous: home.previousSongs.data?.[0]?.differents ?? 0,
      query: home.songs,
      previousQuery: home.previousSongs,
    },
    {
      label: "Unique artists",
      value: (home.artists.data?.[0]?.differents ?? 0).toLocaleString("en-US"),
      current: home.artists.data?.[0]?.differents ?? 0,
      previous: home.previousArtists.data?.[0]?.differents ?? 0,
      query: home.artists,
      previousQuery: home.previousArtists,
    },
  ];
  return (
    <Card aria-label="Listening summary">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>
          <h2>{home.period.label}</h2>
        </CardTitle>
        <div className="flex items-center gap-2">
          <HomePeriodFilter
            value={home.period.value}
            onChange={home.setPeriod}
          />
          <HomeSectionLink
            href="/stats"
            label="View listening stats"
            publicToken={publicToken}
          />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6 @min-[48rem]/home:grid-cols-4">
        {metrics.map(
          ({ label, value, current, previous, query, previousQuery }) => (
            <div key={label} className="min-w-0 space-y-3">
              <dl className="space-y-2">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-2xl font-semibold tabular-nums sm:text-3xl">
                  {query.isPending ? (
                    <Skeleton
                      className="h-8 w-20"
                      aria-label={`Loading ${label.toLowerCase()}`}
                    />
                  ) : query.isError ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void query.refetch()}
                    >
                      Retry {label.toLowerCase()}
                    </Button>
                  ) : (
                    value
                  )}
                </dd>
              </dl>
              {home.period.value !== "all" &&
                query.isSuccess &&
                (previousQuery.isPending ? (
                  <Skeleton
                    className="h-4 w-32"
                    aria-label="Loading comparison"
                  />
                ) : previousQuery.isError ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void previousQuery.refetch()}
                  >
                    Retry comparison
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {getHomeChange(current, previous)}
                    </span>{" "}
                    vs previous period
                  </p>
                ))}
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}

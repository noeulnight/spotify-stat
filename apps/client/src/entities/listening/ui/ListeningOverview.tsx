import { MediaInfo } from "./MediaInfo";
import type {
  DateId,
  ListeningActivityData,
  TrackWithAlbum,
} from "../api/types";
import { Card, CardContent } from "../../../shared/ui/card";
import { formatListeningTime } from "../model/format-listening-time";
import { getTopMonths } from "../model/top-months";

function dateLabel(value?: string, format?: Intl.DateTimeFormat) {
  if (!value) return "—";
  if (format) return format.format(new Date(value));
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ListeningOverview({
  stats,
  publicToken,
  dateFormat,
}: {
  publicToken?: string;
  dateFormat?: Intl.DateTimeFormat;
  stats?: {
    total: {
      count: number;
      durationMs?: number;
      differents?: number;
      albums?: number;
    };
    activity?: ListeningActivityData;
    bestPeriod?: { _id: DateId; count: number; total: number }[];
    firstLast?: {
      first?: { played_at: string; track?: TrackWithAlbum };
      last?: { played_at: string; track?: TrackWithAlbum };
    };
  };
}) {
  const months = getTopMonths(stats?.bestPeriod);
  const metrics = [
    {
      label: "Last 30 days",
      value: stats?.activity?.recent.count.toLocaleString("en-US"),
    },
    {
      label: "Listening time",
      value: formatListeningTime(stats?.total.durationMs),
    },
    {
      label: "Songs listened",
      value: stats?.total.differents?.toLocaleString("en-US"),
    },
    {
      label: "Albums listened",
      value: stats?.total.albums?.toLocaleString("en-US"),
    },
  ].filter((metric) => metric.value !== undefined);
  return (
    <Card
      aria-label="Listening overview"
      className="@container/listening-overview min-w-0"
    >
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-6 @sm/listening-overview:grid-cols-[auto_minmax(0,1fr)]">
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Total plays
            </h2>
            <p className="text-3xl font-semibold tabular-nums">
              {(stats?.total.count ?? 0).toLocaleString("en-US")}
            </p>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>
          {(!stats || stats.bestPeriod !== undefined) && (
            <div className="min-w-0 space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Top months
              </h2>
              {months.length ? (
                <dl className="space-y-2">
                  {months.map((month) => (
                    <div key={month.label}>
                      <dt className="text-sm font-medium">{month.label}</dt>
                      <dd className="text-xs text-muted-foreground">
                        {month.count.toLocaleString("en-US")} plays ·{" "}
                        {month.share}% of total plays
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </div>
          )}
        </div>
        {metrics.length > 0 && (
          <dl className="grid grid-cols-1 gap-4 border-t pt-5 @sm/listening-overview:grid-cols-2">
            {metrics.map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-xl font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="min-w-0 space-y-4 border-t pt-5">
          {[
            { label: "First listened", listen: stats?.firstLast?.first },
            { label: "Last listened", listen: stats?.firstLast?.last },
          ].map(({ label, listen }) => (
            <div
              key={label}
              className="grid min-w-0 grid-cols-1 items-center gap-3 @sm/listening-overview:grid-cols-[6rem_minmax(0,1fr)]"
            >
              <h2 className="text-sm font-medium text-muted-foreground">
                {label}
              </h2>
              <div className="min-w-0 space-y-1 text-sm">
                {listen?.track ? (
                  <MediaInfo
                    trackId={listen.track.id}
                    albumId={listen.track.album?.id}
                    publicToken={publicToken}
                    title={listen.track.name}
                    imageUrl={listen.track.album?.images?.[0]?.url}
                    subTitle={dateLabel(listen.played_at, dateFormat)}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {dateLabel(listen?.played_at, dateFormat)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

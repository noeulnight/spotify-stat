import type { TrackStatsResponse } from "../../../entities/listening";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Progress } from "../../../shared/ui/progress";

export function SongInsights({ stats }: { stats: TrackStatsResponse }) {
  const { activity, artistPlayCount } = stats;
  const share =
    artistPlayCount && artistPlayCount >= stats.total.count
      ? Math.round((stats.total.count / artistPlayCount) * 100)
      : undefined;
  return (
    <Card aria-label="Song listening patterns" className="min-w-0">
      <CardHeader>
        <CardTitle>Listening patterns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {activity && (
          <dl className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Days listened</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {activity.listeningDays.toLocaleString("en-US")}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Longest streak</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {activity.longestStreak.toLocaleString("en-US")} days
              </dd>
            </div>
            {activity.peakDay && (
              <div className="col-span-2 space-y-1">
                <dt className="text-sm text-muted-foreground">
                  Most played day
                </dt>
                <dd className="font-medium">
                  {activity.peakDay.date} ·{" "}
                  {activity.peakDay.count.toLocaleString("en-US")} plays
                </dd>
              </div>
            )}
          </dl>
        )}
        {share !== undefined && (
          <div className="space-y-2">
            <p className="text-sm">
              {share}% of your {stats.artist.name} plays
            </p>
            <Progress
              value={share}
              aria-label="Share of artist plays"
              aria-valuetext={`${share}%`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { PeriodFilter } from "../../../features/filter-period";
import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";
import { useStats } from "../model/use-stats";
import { StatsOverview } from "./StatsOverview";
import { MetricChart as StatsChart } from "../../../shared/ui/metric-chart";
import { BestArtistsChart } from "./BestArtistsChart";
import { StackedStatsChart } from "./StackedStatsChart";
import { HourlyItemsChart } from "./HourlyItemsChart";
import {
  getArtistDistribution,
  getHourlyShares,
} from "../model/distribution-series";
import { getActivitySeries } from "../model/stats-series";

export function Stats({ publicToken }: { publicToken?: string }) {
  const stats = useStats(publicToken);
  const {
    period,
    setPeriod,
    message,
    accountError,
    retryAccount,
    activity,
    hours,
  } = stats;
  const {
    monthly,
    timeActivity,
    artistActivity,
    releases,
    collaborators,
    artistDistribution,
  } = stats;
  const baseline = stats.duration ? timeActivity : activity;
  const distribution = getArtistDistribution(
    artistDistribution.data ?? [],
    baseline.data ?? [],
    monthly,
    stats.itemCount,
  );
  return (
    <div className="space-y-5">
      <PeriodFilter value={period.value} onChange={setPeriod} />
      {message ? (
        message === "Loading…" ? (
          <Skeleton className="h-32 w-full" aria-label="Loading stats" />
        ) : (
          <div className="space-y-3 py-12 text-center">
            <p
              role={accountError ? "alert" : "status"}
              className="text-sm text-muted-foreground"
            >
              {message}
            </p>
            {accountError && (
              <Button variant="outline" onClick={retryAccount}>
                Retry
              </Button>
            )}
          </div>
        )
      ) : (
        <>
          <StatsOverview stats={stats} />
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <BestArtistsChart stats={stats} publicToken={publicToken} />
            <StatsChart
              line={stats.historyLine}
              title="Listening distribution over day"
              metric="Share"
              percent
              data={getHourlyShares(hours.data ?? [])}
              pending={hours.isPending}
              error={hours.isError}
              onRetry={() => void hours.refetch()}
            />
            <StackedStatsChart
              title="Artist listening distribution"
              distribution={distribution}
              pending={artistDistribution.isPending || baseline.isPending}
              error={artistDistribution.isError || baseline.isError}
              onRetry={() => {
                void artistDistribution.refetch();
                void baseline.refetch();
              }}
            />
            <HourlyItemsChart
              period={period}
              enabled={stats.enabled}
              publicToken={publicToken}
            />
            <StatsChart
              line={stats.historyLine}
              title="Songs listened"
              metric="Plays"
              data={stats.activitySeries}
              pending={activity.isPending}
              error={activity.isError}
              onRetry={() => void activity.refetch()}
            />
            <StatsChart
              line={stats.historyLine}
              title="Time listened"
              metric="Minutes"
              data={getActivitySeries(
                (timeActivity.data ?? []).map((row) => ({
                  ...row,
                  count: row.count / 60_000,
                })),
                monthly,
              )}
              pending={timeActivity.isPending}
              error={timeActivity.isError}
              onRetry={() => void timeActivity.refetch()}
            />
            <StatsChart
              line={stats.historyLine}
              title="Different artists listened"
              metric="Artists"
              data={getActivitySeries(
                (artistActivity.data ?? []).map((row) => ({
                  ...row,
                  count: row.differents,
                })),
                monthly,
              )}
              pending={artistActivity.isPending}
              error={artistActivity.isError}
              onRetry={() => void artistActivity.refetch()}
            />
            <StatsChart
              line={stats.historyLine}
              title="Average album release year"
              metric="Year"
              year
              data={getActivitySeries(
                (releases.data ?? []).map((row) => ({
                  ...row,
                  count: row.totalYear,
                })),
                monthly,
                null,
              )}
              pending={releases.isPending}
              error={releases.isError}
              onRetry={() => void releases.refetch()}
            />
            <StatsChart
              line={stats.historyLine}
              title="Artists per song"
              metric="Artists"
              decimals
              data={getActivitySeries(
                (collaborators.data ?? []).map((row) => ({
                  ...row,
                  count: row.average,
                })),
                monthly,
                null,
              )}
              pending={collaborators.isPending}
              error={collaborators.isError}
              onRetry={() => void collaborators.refetch()}
            />
          </div>
        </>
      )}
    </div>
  );
}

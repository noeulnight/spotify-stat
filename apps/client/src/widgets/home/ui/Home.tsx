import { SongRecommendationBanner } from "../../../features/song-recommendations";
import { PlaylistActions } from "../../../features/save-to-playlist";
import { HomeSectionLink } from "./HomeSectionLink";
import { Button } from "../../../shared/ui/button";
import { PageSkeleton } from "../../../shared/ui/page-skeleton";
import { useHome } from "../model/use-home";
import { HomeOverview } from "./HomeOverview";
import { RecentPlays } from "./RecentPlays";
import { HomeTop } from "./HomeTop";
import { HomeHighlight } from "./HomeHighlight";
import { MetricChart } from "../../../shared/ui/metric-chart";
import { getHomeTimeSeries, getHomeHourlyShares } from "../model/home-series";

export function Home({ publicToken }: { publicToken?: string }) {
  const home = useHome(publicToken);
  if (home.account.isPending) return <PageSkeleton layout="list" />;
  if (!home.enabled)
    return (
      <div
        role={home.account.isError ? "alert" : "status"}
        className="space-y-3 py-12 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {home.account.isError
            ? "Account unavailable"
            : publicToken
              ? "Invalid or expired share link"
              : "Log in to view your listening activity"}
        </p>
        {home.account.isError && (
          <Button variant="outline" onClick={() => void home.account.refetch()}>
            Retry
          </Button>
        )}
      </div>
    );
  return (
    <PlaylistActions>
      <div className="@container/home space-y-5">
        {publicToken && <SongRecommendationBanner publicToken={publicToken} />}
        <HomeOverview home={home} publicToken={publicToken} />
        <div className="grid items-start gap-5 @min-[56rem]/home:grid-cols-2">
          <div className="contents @min-[56rem]/home:flex @min-[56rem]/home:min-w-0 @min-[56rem]/home:flex-col @min-[56rem]/home:gap-5">
            <div className="order-1 min-w-0 @min-[56rem]/home:order-none @min-[56rem]/home:w-full">
              <RecentPlays query={home.history} publicToken={publicToken} />
            </div>
            <div className="order-3 min-w-0 space-y-5 @min-[56rem]/home:order-none @min-[56rem]/home:w-full">
              <MetricChart
                title="Listening time"
                action={
                  <HomeSectionLink
                    href="/stats"
                    label="View listening time stats"
                    publicToken={publicToken}
                  />
                }
                metric="Minutes"
                line={home.historyLine}
                data={getHomeTimeSeries(home.activity.data ?? [], home.split)}
                pending={home.activity.isPending}
                error={home.activity.isError}
                onRetry={() => void home.activity.refetch()}
              />
              <MetricChart
                title="Listening distribution over day"
                action={
                  <HomeSectionLink
                    href="/stats"
                    label="View hourly listening stats"
                    publicToken={publicToken}
                  />
                }
                metric="Share"
                percent
                data={getHomeHourlyShares(home.hours.data ?? [])}
                pending={home.hours.isPending}
                error={home.hours.isError}
                onRetry={() => void home.hours.refetch()}
              />
            </div>
          </div>
          <div className="contents @min-[56rem]/home:flex @min-[56rem]/home:min-w-0 @min-[56rem]/home:flex-col @min-[56rem]/home:gap-5">
            <div className="order-2 min-w-0 @min-[56rem]/home:order-none @min-[56rem]/home:w-full">
              <HomeTop home={home} publicToken={publicToken} />
            </div>
            <div className="order-4 min-w-0 space-y-5 @min-[56rem]/home:order-none @min-[56rem]/home:w-full">
              <HomeHighlight
                home={home}
                type="artists"
                publicToken={publicToken}
              />
              <HomeHighlight
                home={home}
                type="songs"
                publicToken={publicToken}
              />
            </div>
          </div>
        </div>
      </div>
    </PlaylistActions>
  );
}

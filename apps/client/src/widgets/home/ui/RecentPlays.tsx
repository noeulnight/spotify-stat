import { PlaylistActionsEnd } from "../../../features/save-to-playlist";
import { HomeSectionLink } from "./HomeSectionLink";
import { useDateFormat } from "../../../entities/account";
import { ArtistLink, MediaInfo } from "../../../entities/listening";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import type { useHome } from "../model/use-home";
import { HomeSection } from "./HomeSection";

export function RecentPlays({
  query,
  publicToken,
}: {
  query: ReturnType<typeof useHome>["history"];
  publicToken?: string;
}) {
  const dateFormat = useDateFormat(publicToken);
  return (
    <Card className="@container/recent min-w-0" aria-label="Recent plays">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>
          <h2>Recent plays</h2>
        </CardTitle>
        <HomeSectionLink
          href="/recent"
          label="View recent plays"
          publicToken={publicToken}
        />
      </CardHeader>
      <CardContent>
        <HomeSection
          pending={query.isPending}
          error={query.isError}
          empty={!query.data?.length}
          onRetry={() => void query.refetch()}
        >
          <ul className="divide-y">
            {query.data?.map((play) => (
              <li
                key={play._id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 @min-[30rem]/recent:grid-cols-[minmax(0,1fr)_auto_auto] [&>[data-slot=dropdown-menu-trigger]]:col-start-2 [&>[data-slot=dropdown-menu-trigger]]:row-span-2 [&>[data-slot=dropdown-menu-trigger]]:row-start-1 @min-[30rem]/recent:[&>[data-slot=dropdown-menu-trigger]]:col-start-3 @min-[30rem]/recent:[&>[data-slot=dropdown-menu-trigger]]:row-span-1"
              >
                <PlaylistActionsEnd
                  id={play.track.id}
                  title={play.track.name}
                  publicToken={publicToken}
                >
                  <div className="min-w-0 flex-1">
                    <MediaInfo
                      truncate
                      trackId={play.track.id}
                      albumId={play.track.full_album?.id}
                      title={play.track.name}
                      imageUrl={play.track.full_album?.images?.[0]?.url}
                      publicToken={publicToken}
                      subTitle={play.track.full_artists?.map(
                        (artist, index) => (
                          <span key={artist.id}>
                            {index > 0 && ", "}
                            <ArtistLink
                              artist={artist}
                              publicToken={publicToken}
                            />
                          </span>
                        ),
                      )}
                    />
                  </div>
                  <time
                    dateTime={play.played_at}
                    className="col-start-1 row-start-2 pl-13 text-xs text-muted-foreground @min-[30rem]/recent:col-start-2 @min-[30rem]/recent:row-start-1 @min-[30rem]/recent:pl-0"
                  >
                    {dateFormat.format(new Date(play.played_at))}
                  </time>
                </PlaylistActionsEnd>
              </li>
            ))}
          </ul>
        </HomeSection>
      </CardContent>
    </Card>
  );
}

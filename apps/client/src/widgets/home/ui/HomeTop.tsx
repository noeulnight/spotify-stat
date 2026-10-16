import { PlaylistActionsEnd } from "../../../features/save-to-playlist";
import { HomeSectionLink } from "./HomeSectionLink";
import { MediaInfo } from "../../../entities/listening";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../shared/ui/tabs";
import { formatHomeDuration } from "../model/home-periods";
import type { useHome } from "../model/use-home";
import { HomeSection } from "./HomeSection";

export function HomeTop({
  home,
  publicToken,
}: {
  home: ReturnType<typeof useHome>;
  publicToken?: string;
}) {
  return (
    <Card className="min-w-0" aria-label={`Top ${home.itemCount}`}>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>
          <h2>Top {home.itemCount}</h2>
        </CardTitle>
        <HomeSectionLink
          href={`/top/${home.tab}`}
          label={`View top ${home.tab}`}
          publicToken={publicToken}
        />
      </CardHeader>
      <CardContent>
        <Tabs
          value={home.tab}
          onValueChange={(value) => home.setTab(String(value))}
        >
          <TabsList aria-label="Ranking type">
            <TabsTrigger value="songs">Songs</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
          </TabsList>
          {(["songs", "artists"] as const).map((type) => {
            const query = type === "songs" ? home.topSongs : home.topArtists;
            return (
              <TabsContent key={type} value={type} className="space-y-4 pt-2">
                <HomeSection
                  pending={query.isPending}
                  error={query.isError}
                  empty={!query.data?.length}
                  onRetry={() => void query.refetch()}
                >
                  <ol className="divide-y">
                    {query.data?.map((row, index) => {
                      const song =
                        type === "songs" && "track" in row ? row.track : null;
                      const image =
                        song && "album" in row
                          ? row.album?.images?.[0]?.url
                          : row.artist.images?.[0]?.url;
                      return (
                        <li
                          key={song?.id ?? row.artist.id}
                          className="flex min-w-0 items-center gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <PlaylistActionsEnd
                            id={song?.id}
                            title={song?.name ?? row.artist.name}
                            publicToken={publicToken}
                          >
                            <span
                              aria-hidden="true"
                              className="w-4 shrink-0 text-sm text-muted-foreground tabular-nums"
                            >
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <MediaInfo
                                truncate
                                trackId={song?.id}
                                albumId={
                                  song && "album" in row
                                    ? row.album?.id
                                    : undefined
                                }
                                artistId={row.artist.id}
                                title={song?.name ?? row.artist.name}
                                subTitle={song ? row.artist.name : undefined}
                                imageUrl={image}
                                publicToken={publicToken}
                              />
                            </div>
                            <span className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                              {home.duration
                                ? formatHomeDuration(row.duration_ms)
                                : `${row.count.toLocaleString("en-US")} plays`}
                            </span>
                          </PlaylistActionsEnd>
                        </li>
                      );
                    })}
                  </ol>
                </HomeSection>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

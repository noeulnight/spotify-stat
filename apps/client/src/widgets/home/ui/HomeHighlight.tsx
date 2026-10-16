import { HomeSectionLink } from "./HomeSectionLink";
import { MediaInfo } from "../../../entities/listening";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { formatHomeDuration } from "../model/home-periods";
import type { useHome } from "../model/use-home";
import { HomeSection } from "./HomeSection";

export function HomeHighlight({
  home,
  type,
  publicToken,
}: {
  home: ReturnType<typeof useHome>;
  type: "songs" | "artists";
  publicToken?: string;
}) {
  const query = type === "songs" ? home.topSongs : home.topArtists;
  const row = query.data?.[0];
  const song =
    type === "songs" && row && "track" in row ? row.track : undefined;
  const image =
    song && row && "album" in row
      ? row.album?.images?.[0]?.url
      : row?.artist.images?.[0]?.url;
  const title = type === "songs" ? "Best song" : "Best artist";
  return (
    <Card className="min-w-0" aria-label={title}>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {row && (
          <HomeSectionLink
            href={
              song
                ? `/songs/${encodeURIComponent(song.id)}`
                : `/artists/${encodeURIComponent(row.artist.id)}`
            }
            label={type === "songs" ? "View best song" : "View best artist"}
            publicToken={publicToken}
          />
        )}
      </CardHeader>
      <CardContent>
        <HomeSection
          pending={query.isPending}
          error={query.isError}
          empty={!row}
          onRetry={() => void query.refetch()}
        >
          {row && (
            <div className="space-y-5">
              <MediaInfo
                truncate
                trackId={song?.id}
                albumId={song && "album" in row ? row.album?.id : undefined}
                artistId={row.artist.id}
                title={song?.name ?? row.artist.name}
                subTitle={song ? row.artist.name : undefined}
                imageUrl={image}
                publicToken={publicToken}
              />
              <dl className="grid auto-cols-fr grid-flow-col gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Plays</dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {row.count.toLocaleString("en-US")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Listening time
                  </dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {formatHomeDuration(row.duration_ms)}
                  </dd>
                </div>
                {type === "artists" && "differents" in row && (
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Unique songs
                    </dt>
                    <dd className="mt-1 font-medium tabular-nums">
                      {row.differents.toLocaleString("en-US")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </HomeSection>
      </CardContent>
    </Card>
  );
}

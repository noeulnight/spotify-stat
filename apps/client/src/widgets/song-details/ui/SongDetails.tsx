import { PlaylistActions } from "../../../features/save-to-playlist";
import { SaveToPlaylist } from "../../../features/save-to-playlist";
import { useDateFormat } from "../../../entities/account";
import { PageSkeleton } from "../../../shared/ui/page-skeleton";
import { Skeleton } from "../../../shared/ui/skeleton";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MusicIcon,
} from "lucide-react";
import {
  AlbumLink,
  ArtistLink,
  ListeningOverview,
} from "../../../entities/listening";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/ui/table";
import { TableStatus } from "../../../shared/ui/table-status";
import { useSongDetails } from "../model/use-song-details";

export function SongDetails({
  id,
  publicToken,
}: {
  id: string;
  publicToken?: string;
}) {
  const dateFormat = useDateFormat(publicToken);
  const {
    track,
    stats,
    album,
    artists,
    isPending,
    message,
    error,
    retry,
    metadataError,
    retryMetadata,
    neighbors,
    rankPending,
    rankError,
    retryRank,
  } = useSongDetails(id, publicToken);
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  if (isPending) return <PageSkeleton layout="detail" columns={2} />;
  if (message)
    return (
      <div className="space-y-3 py-12 text-center">
        <h1 className="text-2xl font-semibold">Song</h1>
        <p
          role={error ? "alert" : "status"}
          className="text-sm text-muted-foreground"
        >
          {message}
        </p>
        {error && (
          <Button variant="outline" onClick={retry}>
            Retry
          </Button>
        )}
      </div>
    );
  if (!track) return null;
  return (
    <PlaylistActions>
      <div className="space-y-6">
        <header className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:pr-20">
          <Avatar className="size-24 rounded-md after:rounded-md sm:size-32">
            <AvatarImage
              src={album?.images?.[0]?.url}
              alt=""
              className="rounded-md"
            />
            <AvatarFallback className="rounded-md">
              <MusicIcon aria-hidden="true" className="size-10" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-1">
              <h1 className="min-w-0 text-3xl font-semibold tracking-tight break-words">
                {track.name}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                nativeButton={false}
                render={
                  <a
                    href={`https://open.spotify.com/track/${encodeURIComponent(track.id)}`}
                    aria-label="Open in Spotify"
                    title="Open in Spotify"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ArrowUpRightIcon aria-hidden="true" />
              </Button>
              <SaveToPlaylist
                songIds={[track.id]}
                publicToken={publicToken}
                variant="icon"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {artists.map((artist, index) => (
                <span key={artist.id}>
                  {index > 0 && ", "}
                  <ArtistLink artist={artist} publicToken={publicToken} />
                </span>
              ))}
              {album && (
                <span>
                  {artists.length > 0 && " · "}
                  <AlbumLink album={album} publicToken={publicToken} />
                </span>
              )}
            </p>
            {metadataError && (
              <Button variant="ghost" size="sm" onClick={retryMetadata}>
                Retry song info
              </Button>
            )}
            <div className="text-sm text-muted-foreground" aria-live="polite">
              {rankError ? (
                <Button variant="ghost" size="sm" onClick={retryRank}>
                  Retry ranking
                </Button>
              ) : neighbors.position ? (
                <span title="Rank by play count">
                  All time · #{neighbors.position}
                </span>
              ) : rankPending && stats ? (
                <Skeleton className="h-4 w-24" aria-label="Loading ranking" />
              ) : (
                "Unranked"
              )}
            </div>
          </div>
          <nav
            aria-label="Song ranking"
            className="absolute top-0 right-0 flex items-center gap-0.5"
          >
            {[
              {
                label: "Previous song",
                target: neighbors.previous,
                Icon: ChevronLeftIcon,
              },
              {
                label: "Next song",
                target: neighbors.next,
                Icon: ChevronRightIcon,
              },
            ].map(({ label, target, Icon }) =>
              target ? (
                <Button
                  key={label}
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                  render={
                    <a
                      href={`${prefix}/songs/${encodeURIComponent(target)}`}
                      aria-label={label}
                    />
                  }
                >
                  <Icon aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  key={label}
                  variant="ghost"
                  size="icon"
                  disabled
                  aria-label={label}
                >
                  <Icon aria-hidden="true" />
                </Button>
              ),
            )}
          </nav>
        </header>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ListeningOverview
            dateFormat={dateFormat}
            stats={stats}
            publicToken={publicToken}
          />
          {stats ? (
            <Card
              role="region"
              aria-labelledby="song-history-title"
              className="min-w-0"
            >
              <CardHeader>
                <CardTitle>
                  <h2 id="song-history-title">Recent plays</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table aria-label="Recent song plays">
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" className="w-12">
                        #
                      </TableHead>
                      <TableHead scope="col">Played at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentHistory?.length ? (
                      stats.recentHistory.map((play, index) => (
                        <TableRow key={play._id}>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <time dateTime={play.played_at}>
                              {dateFormat.format(new Date(play.played_at))}
                            </time>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableStatus colSpan={2} message="No data" />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              No listening history
            </p>
          )}
        </div>
      </div>
    </PlaylistActions>
  );
}

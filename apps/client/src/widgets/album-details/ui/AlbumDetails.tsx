import {
  PlaylistSongRow,
  PlaylistActionsHead,
} from "../../../features/save-to-playlist";
import { PlaylistActions } from "../../../features/save-to-playlist";
import {
  PlaylistSelection,
  PlaylistSelectionHead,
  PlaylistSelectionCell,
  PlaylistSelectionStatus,
} from "../../../features/save-to-playlist";
import { useDateFormat } from "../../../entities/account";
import { MediaInfo } from "../../../entities/listening";
import { PageSkeleton } from "../../../shared/ui/page-skeleton";
import { Skeleton } from "../../../shared/ui/skeleton";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MusicIcon,
} from "lucide-react";
import { ArtistLink, ListeningOverview } from "../../../entities/listening";
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

import { useAlbumDetails } from "../model/use-album-details";

export function AlbumDetails({
  id,
  publicToken,
}: {
  id: string;
  publicToken?: string;
}) {
  const dateFormat = useDateFormat(publicToken);
  const {
    album,
    stats,
    overview,
    isPending,
    message,
    error,
    retry,
    neighbors,
    rankPending,
    rankError,
    retryRank,
  } = useAlbumDetails(id, publicToken);
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  if (isPending) return <PageSkeleton layout="detail" columns={3} />;
  if (message)
    return (
      <div className="space-y-3 py-12 text-center">
        <h1 className="text-2xl font-semibold">Album</h1>
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
  if (!album || !stats) return null;
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
                {album.name}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                nativeButton={false}
                render={
                  <a
                    href={`https://open.spotify.com/album/${encodeURIComponent(album.id)}`}
                    aria-label="Open in Spotify"
                    title="Open in Spotify"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ArrowUpRightIcon aria-hidden="true" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.artists.map((artist, index) => (
                <span key={artist.id}>
                  {index > 0 && ", "}
                  <ArtistLink artist={artist} publicToken={publicToken} />
                </span>
              ))}
            </p>
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
            aria-label="Album ranking"
            className="absolute top-0 right-0 flex items-center gap-0.5"
          >
            {[
              {
                label: "Previous album",
                target: neighbors.previous,
                Icon: ChevronLeftIcon,
              },
              {
                label: "Next album",
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
                      href={`${prefix}/albums/${encodeURIComponent(target)}`}
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
            stats={overview}
            publicToken={publicToken}
          />
          <Card
            role="region"
            aria-labelledby="album-tracks-title"
            className="min-w-0"
          >
            <CardHeader>
              <CardTitle>
                <h2 id="album-tracks-title">Songs</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlaylistSelection
                key={id}
                songIds={stats.tracks.map((row) => row.track.id)}
                publicToken={publicToken}
              >
                <Table aria-label="Album songs">
                  <TableHeader>
                    <TableRow>
                      <PlaylistSelectionHead />
                      <TableHead scope="col" className="w-12">
                        #
                      </TableHead>
                      <TableHead scope="col">Song</TableHead>
                      <TableHead scope="col" className="text-right">
                        Plays
                      </TableHead>
                      <PlaylistActionsHead publicToken={publicToken} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.tracks.length ? (
                      stats.tracks.map((row, index) => (
                        <PlaylistSongRow
                          key={row._id}
                          id={row.track.id}
                          title={row.track.name}
                          publicToken={publicToken}
                        >
                          <PlaylistSelectionCell
                            id={row.track.id}
                            title={row.track.name}
                          />
                          <TableCell className="text-muted-foreground tabular-nums">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <MediaInfo
                              trackId={row.track.id}
                              albumId={album.id}
                              title={row.track.name}
                              imageUrl={album.images?.[0]?.url}
                              publicToken={publicToken}
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.count.toLocaleString("en-US")}
                          </TableCell>
                        </PlaylistSongRow>
                      ))
                    ) : (
                      <PlaylistSelectionStatus
                        colSpan={3}
                        message="No listening history"
                      />
                    )}
                  </TableBody>
                </Table>
              </PlaylistSelection>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlaylistActions>
  );
}

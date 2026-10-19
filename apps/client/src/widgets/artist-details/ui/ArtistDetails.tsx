import { ArtistSongShare } from "./ArtistSongShare";
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
import { ExcludeArtistButton } from "../../../features/exclude-artist";
import { useDateFormat } from "../../../entities/account";
import { MediaInfo } from "../../../entities/listening";
import { PageSkeleton } from "../../../shared/ui/page-skeleton";
import { Skeleton } from "../../../shared/ui/skeleton";
import { ArtistActivity } from "./ArtistActivity";
import {
  ListeningOverview,
  ListeningActivity,
} from "../../../entities/listening";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpRightIcon,
  UserIcon,
} from "lucide-react";
import { useArtistDetails } from "../model/use-artist-details";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { Button } from "../../../shared/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/ui/table";
import { TableStatus } from "../../../shared/ui/table-status";

export function ArtistDetails({
  id,
  publicToken,
}: {
  id: string;
  publicToken?: string;
}) {
  const dateFormat = useDateFormat(publicToken);
  const {
    artist,
    stats,
    isPending,
    message,
    error,
    retry,
    neighbors,
    rankPending,
    rankError,
    retryRank,
  } = useArtistDetails(id, publicToken);
  if (isPending) return <PageSkeleton layout="detail" columns={3} round />;
  if (message)
    return (
      <div className="space-y-3 py-12 text-center">
        <h1 className="text-2xl font-semibold">Artist</h1>
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
  if (!artist) return null;
  return (
    <PlaylistActions>
      <div className="space-y-6">
        <header className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:pr-20">
          <Avatar className="size-24 sm:size-32">
            <AvatarImage src={artist.images?.[0]?.url} alt="" />
            <AvatarFallback>
              <UserIcon aria-hidden="true" className="size-10" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-1">
              <h1 className="min-w-0 text-3xl font-semibold tracking-tight break-words">
                {artist.name}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                nativeButton={false}
                render={
                  <a
                    href={`https://open.spotify.com/artist/${encodeURIComponent(artist.id)}`}
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
            <ExcludeArtistButton id={id} publicToken={publicToken} />
            {!!artist.genres?.length && (
              <p className="text-sm text-muted-foreground">
                {artist.genres.join(", ")}
              </p>
            )}
          </div>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <nav
              aria-label="Artist ranking"
              className="flex items-center gap-0.5"
            >
              {neighbors.previous ? (
                <Button
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                  render={
                    <a
                      href={`${publicToken ? `/share/${encodeURIComponent(publicToken)}` : ""}/artists/${encodeURIComponent(neighbors.previous)}`}
                      aria-label="Previous artist"
                    />
                  }
                >
                  <ChevronLeftIcon aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled
                  aria-label="Previous artist"
                >
                  <ChevronLeftIcon aria-hidden="true" />
                </Button>
              )}

              {neighbors.next ? (
                <Button
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                  render={
                    <a
                      href={`${publicToken ? `/share/${encodeURIComponent(publicToken)}` : ""}/artists/${encodeURIComponent(neighbors.next)}`}
                      aria-label="Next artist"
                    />
                  }
                >
                  <ChevronRightIcon aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled
                  aria-label="Next artist"
                >
                  <ChevronRightIcon aria-hidden="true" />
                </Button>
              )}
            </nav>
          </div>
        </header>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-5">
            <ListeningOverview
              dateFormat={dateFormat}
              stats={stats}
              publicToken={publicToken}
            />
            {stats?.activity && <ListeningActivity activity={stats.activity} />}
            {stats && <ArtistSongShare stats={stats} />}
            {stats && <ArtistActivity stats={stats} />}
          </div>
          {!stats ? (
            <p className="text-sm text-muted-foreground">
              No listening history
            </p>
          ) : (
            <div className="min-w-0 space-y-5">
              <Card
                role="region"
                aria-labelledby="artist-songs-title"
                className="min-w-0"
              >
                <CardHeader>
                  <CardTitle>
                    <h2 id="artist-songs-title">Top songs</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PlaylistSelection
                    key={id}
                    songIds={stats.mostListened.map((row) => row._id)}
                    publicToken={publicToken}
                  >
                    <Table aria-label="Artist top songs">
                      <TableHeader>
                        <TableRow>
                          <PlaylistSelectionHead />
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Song</TableHead>
                          <TableHead className="text-right">Plays</TableHead>
                          <PlaylistActionsHead publicToken={publicToken} />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.mostListened.length ? (
                          stats.mostListened.map((row, index) => (
                            <PlaylistSongRow
                              key={row._id}
                              id={row._id}
                              title={row.track.name}
                              publicToken={publicToken}
                            >
                              <PlaylistSelectionCell
                                id={row._id}
                                title={row.track.name}
                              />
                              <TableCell className="text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <MediaInfo
                                  trackId={row._id}
                                  albumId={row.track.album?.id}
                                  title={row.track.name}
                                  imageUrl={row.track.album?.images?.[0]?.url}
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
                            message="No data"
                          />
                        )}
                      </TableBody>
                    </Table>
                  </PlaylistSelection>
                </CardContent>
              </Card>
              <Card
                role="region"
                aria-labelledby="artist-albums-title"
                className="min-w-0"
              >
                <CardHeader>
                  <CardTitle>
                    <h2 id="artist-albums-title">Top albums</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table aria-label="Artist top albums">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Album</TableHead>
                        <TableHead className="text-right">Plays</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.albumMostListened.length ? (
                        stats.albumMostListened.map((row, index) => (
                          <TableRow key={row._id}>
                            <TableCell className="text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <MediaInfo
                                albumId={row.album.id}
                                title={row.album.name}
                                imageUrl={row.album.images?.[0]?.url}
                                publicToken={publicToken}
                              />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.count.toLocaleString("en-US")}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableStatus colSpan={3} message="No data" />
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PlaylistActions>
  );
}

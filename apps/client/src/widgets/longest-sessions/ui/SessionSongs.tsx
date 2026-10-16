import {
  PlaylistSongRow,
  PlaylistActionsHead,
} from "../../../features/save-to-playlist";
import { useDateFormat } from "../../../entities/account";
import { MediaInfo } from "../../../entities/listening";
import { AlbumLink, type ListeningSession } from "../../../entities/listening";

import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/ui/table";
import { useSessionAlbums } from "../model/use-session-albums";

export function SessionSongs({
  session,
  index,
  publicToken,
}: {
  session: ListeningSession;
  index: number;
  publicToken?: string;
}) {
  const dateFormat = useDateFormat(publicToken);
  const { albums, pending, error, retry } = useSessionAlbums(
    session,
    publicToken,
  );
  return (
    <>
      {error && (
        <Button variant="ghost" size="sm" onClick={retry}>
          Retry albums
        </Button>
      )}
      <Table aria-label={`Session ${index + 1} songs`}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-12">
              #
            </TableHead>
            <TableHead scope="col">Song</TableHead>
            <TableHead scope="col">Album</TableHead>
            <TableHead scope="col" className="text-right">
              Played at
            </TableHead>
            <PlaylistActionsHead publicToken={publicToken} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {session.distanceToLast.distance.map(({ info }, playIndex) => {
            const track = session.full_tracks[info.id];
            const album = albums.get(info.albumId || track?.album);
            return (
              <PlaylistSongRow
                key={info._id}
                id={info.id}
                title={track?.name ?? "Unknown song"}
                publicToken={publicToken}
              >
                <TableCell className="text-muted-foreground tabular-nums">
                  {playIndex + 1}
                </TableCell>
                <TableCell>
                  <MediaInfo
                    trackId={info.id}
                    albumId={album?.id}
                    title={track?.name ?? "Unknown song"}
                    imageUrl={album?.images?.[0]?.url}
                    publicToken={publicToken}
                  />
                </TableCell>
                <TableCell>
                  {album ? (
                    <AlbumLink album={album} publicToken={publicToken} />
                  ) : pending ? (
                    <Skeleton className="h-4 w-32" aria-label="Loading album" />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  <time dateTime={info.played_at}>
                    {dateFormat.format(new Date(info.played_at))}
                  </time>
                </TableCell>
              </PlaylistSongRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

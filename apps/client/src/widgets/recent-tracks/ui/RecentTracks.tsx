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
import { InfiniteScroll } from "../../../shared/ui/infinite-scroll";
import { TableSkeleton } from "../../../shared/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/ui/table";
import { useRecentTracks } from "../model/use-recent-tracks";

export function RecentTracks({ publicToken }: { publicToken?: string }) {
  const dateFormat = useDateFormat(publicToken);
  const {
    rows,
    isPending,
    message,
    error,
    retry,
    hasMore,
    isFetchingNextPage,
    isFetchNextPageError,
    loadMore,
  } = useRecentTracks(publicToken);

  return (
    <PlaylistActions>
      <PlaylistSelection
        songIds={rows.map((row) => row.track.id)}
        publicToken={publicToken}
      >
        <div className="space-y-4">
          {isPending && (
            <span role="status" className="sr-only">
              Loading
            </span>
          )}
          <Table aria-label="Recent plays" aria-busy={isPending}>
            <TableHeader>
              <TableRow>
                <PlaylistSelectionHead />
                <TableHead scope="col">Song</TableHead>
                <TableHead scope="col" className="text-right">
                  Last played
                </TableHead>
                <PlaylistActionsHead publicToken={publicToken} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableSkeleton columns={2} />
              ) : message ? (
                <PlaylistSelectionStatus
                  colSpan={2}
                  message={message}
                  onRetry={error ? retry : undefined}
                />
              ) : (
                rows.map((row) => {
                  const album = row.track.full_album;
                  return (
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
                      <TableCell>
                        <MediaInfo
                          trackId={row.track.id}
                          albumId={album?.id}
                          title={row.track.name}
                          imageUrl={album?.images?.[0]?.url}
                          publicToken={publicToken}
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                        <time dateTime={row.played_at}>
                          {dateFormat.format(new Date(row.played_at))}
                        </time>
                      </TableCell>
                    </PlaylistSongRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <InfiniteScroll
            hasMore={hasMore}
            pending={isFetchingNextPage}
            error={isFetchNextPageError}
            onLoad={loadMore}
          />
        </div>
      </PlaylistSelection>
    </PlaylistActions>
  );
}

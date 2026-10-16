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
import { MediaInfo } from "../../../entities/listening";
import { TableSkeleton } from "../../../shared/ui/table-skeleton";
import { AlbumLink, ArtistLink } from "../../../entities/listening";
import { PeriodFilter } from "../../../features/filter-period";
import { InfiniteScroll } from "../../../shared/ui/infinite-scroll";
import { useTopSongsTable } from "../model/use-top-songs-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/ui/table";

export function TopSongsTable({ publicToken }: { publicToken?: string }) {
  const {
    rows,
    message,
    error,
    retry,
    isPending,
    period,
    setPeriod,
    hasMore,
    isFetchingNextPage,
    isFetchNextPageError,
    loadMore,
  } = useTopSongsTable(publicToken);

  return (
    <PlaylistActions>
      <div className="space-y-4">
        <PlaylistSelection
          key={`${period.start.toISOString()}:${period.end.toISOString()}`}
          songIds={rows.map((row) => row.track.id)}
          publicToken={publicToken}
          toolbar={<PeriodFilter value={period.value} onChange={setPeriod} />}
        >
          {isPending && (
            <span role="status" className="sr-only">
              Loading
            </span>
          )}
          <Table aria-label="Top songs" aria-busy={isPending}>
            <TableHeader>
              <TableRow>
                <PlaylistSelectionHead />
                <TableHead scope="col" className="w-12">
                  #
                </TableHead>
                <TableHead scope="col">Song</TableHead>
                <TableHead scope="col">Artist</TableHead>
                <TableHead scope="col">Album</TableHead>
                <TableHead scope="col" className="text-right">
                  Plays
                </TableHead>
                <PlaylistActionsHead publicToken={publicToken} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableSkeleton columns={5} />
              ) : message ? (
                <PlaylistSelectionStatus
                  colSpan={5}
                  message={message}
                  onRetry={error ? retry : undefined}
                />
              ) : (
                rows?.map((row, index) => (
                  <PlaylistSongRow
                    key={row.track.id}
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
                        albumId={row.album?.id}
                        artistId={row.artist?.id}
                        title={row.track.name}
                        imageUrl={row.album?.images?.[0]?.url}
                        publicToken={publicToken}
                      />
                    </TableCell>
                    <TableCell>
                      {row.artist ? (
                        <ArtistLink
                          artist={row.artist}
                          publicToken={publicToken}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {row.album ? (
                        <AlbumLink
                          album={row.album}
                          publicToken={publicToken}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.count.toLocaleString("en-US")}
                    </TableCell>
                  </PlaylistSongRow>
                ))
              )}
            </TableBody>
          </Table>
          <InfiniteScroll
            hasMore={hasMore}
            pending={isFetchingNextPage}
            error={isFetchNextPageError}
            onLoad={loadMore}
          />
        </PlaylistSelection>
      </div>
    </PlaylistActions>
  );
}

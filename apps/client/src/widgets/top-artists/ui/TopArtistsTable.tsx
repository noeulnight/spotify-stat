import { MediaInfo } from "../../../entities/listening";
import { TableSkeleton } from "../../../shared/ui/table-skeleton";
import { PeriodFilter } from "../../../features/filter-period";
import { InfiniteScroll } from "../../../shared/ui/infinite-scroll";
import { useTopArtistsTable } from "../model/use-top-artists-table";

import { TableStatus } from "../../../shared/ui/table-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/ui/table";

export function TopArtistsTable({ publicToken }: { publicToken?: string }) {
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
  } = useTopArtistsTable(publicToken);

  return (
    <div className="space-y-4">
      <PeriodFilter value={period.value} onChange={setPeriod} />
      {isPending && (
        <span role="status" className="sr-only">
          Loading
        </span>
      )}
      <Table aria-label="Top artists" aria-busy={isPending}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-12">
              #
            </TableHead>
            <TableHead scope="col">Artist</TableHead>
            <TableHead scope="col" className="text-right">
              Plays
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableSkeleton columns={3} />
          ) : message ? (
            <TableStatus
              colSpan={3}
              message={message}
              onRetry={error ? retry : undefined}
            />
          ) : (
            rows?.map((row, index) => (
              <TableRow key={row.artist.id}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <MediaInfo
                    artistId={row.artist.id}
                    title={row.artist.name}
                    imageUrl={row.artist?.images?.[0]?.url}
                    publicToken={publicToken}
                  />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.count.toLocaleString("en-US")}
                </TableCell>
              </TableRow>
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
    </div>
  );
}

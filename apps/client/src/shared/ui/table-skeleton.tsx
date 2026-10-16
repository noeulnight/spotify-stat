import { Skeleton } from "./skeleton";
import { TableCell, TableRow } from "./table";

export function TableSkeleton({
  columns,
  rows = 8,
}: {
  columns: number;
  rows?: number;
}) {
  return Array.from({ length: rows }, (_, row) => (
    <TableRow key={row} aria-hidden="true">
      {Array.from({ length: columns }, (_, column) => (
        <TableCell key={column}>
          {column === 1 ? (
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <Skeleton className="h-4 w-32 max-w-full" />
            </div>
          ) : (
            <Skeleton
              className={
                column === 0
                  ? "h-4 w-5"
                  : column === columns - 1
                    ? "ml-auto h-4 w-12"
                    : "h-4 w-24"
              }
            />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
}

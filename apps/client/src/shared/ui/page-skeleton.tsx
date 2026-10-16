import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";
import { Table, TableBody } from "./table";
import { TableSkeleton } from "./table-skeleton";

export function PageSkeleton({
  layout = "table",
  columns = 4,
  round = false,
}: {
  layout?: "table" | "detail" | "list";
  columns?: number;
  round?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="space-y-6"
    >
      <span className="sr-only">Loading</span>
      <div aria-hidden="true" className="space-y-6">
        {layout === "detail" ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Skeleton
                className={`size-24 shrink-0 sm:size-32 ${round ? "rounded-full" : "rounded-md"}`}
              />
              <div className="w-full space-y-3">
                <Skeleton className="h-9 w-72 max-w-full" />
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Card>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {[0, 1].map((key) => (
                      <div key={key} className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-px w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardContent className="space-y-4">
                  <Skeleton className="h-5 w-28" />
                  <Table>
                    <TableBody>
                      <TableSkeleton columns={columns} rows={5} />
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-9 w-40" />
            {layout === "list" ? (
              <ListSkeleton />
            ) : (
              <Table>
                <TableBody>
                  <TableSkeleton columns={columns} />
                </TableBody>
              </Table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy="true"
      className="divide-y"
    >
      <span className="sr-only">Loading</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-center gap-3 py-4"
        >
          <Skeleton className="h-4 w-6" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

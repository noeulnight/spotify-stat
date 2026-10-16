import { Button } from "./button";
import { TableCell, TableRow } from "./table";

export function TableStatus({
  colSpan,
  message,
  onRetry,
}: {
  colSpan: number;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-32 text-center text-muted-foreground"
      >
        <div className="space-y-2 py-4">
          <p role={onRetry ? "alert" : "status"}>{message}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import { useHourlyItems } from "../model/use-hourly-items";
import { StackedStatsChart } from "./StackedStatsChart";

const kinds = [
  { value: "artists", label: "Artists" },
  { value: "albums", label: "Albums" },
  { value: "songs", label: "Songs" },
];
export function HourlyItemsChart({
  period,
  enabled,
  publicToken,
}: {
  period: { start: Date; end: Date };
  enabled: boolean;
  publicToken?: string;
}) {
  const { kind, setKind, query, distribution } = useHourlyItems(
    period,
    enabled,
    publicToken,
  );
  return (
    <StackedStatsChart
      title="Best by hour"
      distribution={distribution}
      pending={query.isPending}
      error={query.isError}
      onRetry={() => void query.refetch()}
      bars
      action={
        <Select
          items={kinds}
          value={kind}
          onValueChange={(value) => {
            if (value) setKind(value);
          }}
        >
          <SelectTrigger size="sm" aria-label="Hourly ranking type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kinds.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}

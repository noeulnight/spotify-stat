import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ListeningActivityData } from "../api/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../shared/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../shared/ui/chart";

const config = { count: { label: "Plays", color: "var(--primary)" } };
const monthFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

export function ListeningActivity({
  activity,
}: {
  activity: ListeningActivityData;
}) {
  const { count, previousCount, through } = activity.recent;
  const change =
    previousCount > 0
      ? Math.round(((count - previousCount) / previousCount) * 100)
      : null;
  return (
    <>
      <Card className="min-w-0" aria-label="Recent listening">
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
          <CardDescription>Includes today · through {through}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-3xl font-semibold tabular-nums">
            {count.toLocaleString("en-US")}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              plays
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {change === null
              ? count > 0
                ? "No plays in the previous 30 days"
                : "No plays in either period"
              : `${change > 0 ? "+" : ""}${change}% vs. previous 30 days`}
            {" · "}
            {previousCount.toLocaleString("en-US")} previously
          </p>
        </CardContent>
      </Card>
      <Card className="min-w-0" aria-label="Monthly listening">
        <CardHeader>
          <CardTitle>Monthly listening</CardTitle>
          <CardDescription>
            Last 12 months · current month in progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={config}
            className="aspect-auto h-48 w-full"
            aria-label="Monthly play counts"
          >
            <BarChart
              accessibilityLayer
              data={activity.months}
              margin={{ left: -20, right: 4 }}
            >
              <CartesianGrid vertical={false} strokeOpacity={0.4} />
              <XAxis
                dataKey="month"
                tickFormatter={(month: string) =>
                  monthFormat.format(new Date(`${month}-01T00:00:00Z`))
                }
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <details className="mt-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer">View monthly counts</summary>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
              {activity.months.map(({ month, count }) => (
                <div key={month} className="flex justify-between gap-2">
                  <dt>{month}</dt>
                  <dd>{count.toLocaleString("en-US")}</dd>
                </div>
              ))}
            </dl>
          </details>
        </CardContent>
      </Card>
    </>
  );
}

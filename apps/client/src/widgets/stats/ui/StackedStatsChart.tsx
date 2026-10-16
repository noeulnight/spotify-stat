import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../shared/ui/chart";
import { ChartCard as StatsChartFrame } from "../../../shared/ui/chart-card";

export function StackedStatsChart({
  title,
  distribution,
  pending,
  error,
  onRetry,
  bars = false,
  action,
}: {
  title: string;
  distribution: {
    series: { key: string; label: string; color: string }[];
    data: ({ label: string } & Record<string, string | number>)[];
  };
  pending: boolean;
  error: boolean;
  onRetry: () => void;
  bars?: boolean;
  action?: ReactNode;
}) {
  const Chart = bars ? BarChart : AreaChart;
  const config = Object.fromEntries(
    distribution.series.map((series) => [
      series.key,
      { label: series.label, color: series.color },
    ]),
  );
  return (
    <StatsChartFrame
      title={title}
      pending={pending}
      error={error}
      empty={!distribution.data.length}
      onRetry={onRetry}
      action={action}
    >
      <ChartContainer
        config={config}
        className="aspect-auto h-56 w-full"
        aria-label={title}
      >
        <Chart
          accessibilityLayer
          data={distribution.data}
          margin={{ left: -8, right: 4 }}
        >
          <CartesianGrid vertical={false} strokeOpacity={0.4} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            allowDataOverflow
            tickFormatter={(value) => `${Number(Number(value).toFixed(1))}%`}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <ChartTooltip
            wrapperStyle={{ zIndex: 50 }}
            content={({ active, payload }) => (
              <ChartTooltipContent
                active={active}
                payload={[...(payload ?? [])].sort(
                  (a, b) => Number(b.value) - Number(a.value),
                )}
                labelFormatter={(_label, payload) => payload[0]?.payload.label}
                formatter={(value, name) => (
                  <>
                    <span className="text-muted-foreground">
                      {config[String(name)]?.label}
                    </span>
                    <span className="ml-auto font-medium tabular-nums">
                      {Number(value).toFixed(1)}%
                    </span>
                  </>
                )}
              />
            )}
          />
          {distribution.series.map((series) =>
            bars ? (
              <Bar
                key={series.key}
                dataKey={series.key}
                stackId="share"
                fill={`var(--color-${series.key})`}
              />
            ) : (
              <Area
                key={series.key}
                type="monotoneX"
                dataKey={series.key}
                stackId="share"
                stroke={`var(--color-${series.key})`}
                fill={`var(--color-${series.key})`}
                fillOpacity={0.8}
              />
            ),
          )}
        </Chart>
      </ChartContainer>
    </StatsChartFrame>
  );
}

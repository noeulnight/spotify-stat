import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";
import { ChartCard } from "./chart-card";

export function MetricChart({
  title,
  metric,
  data,
  pending,
  error,
  onRetry,
  line = false,
  percent = false,
  year = false,
  decimals = false,
  action,
}: {
  title: string;
  metric: string;
  data: { label: string; value: number | null }[];
  pending: boolean;
  error: boolean;
  onRetry: () => void;
  line?: boolean;
  percent?: boolean;
  year?: boolean;
  decimals?: boolean;
  action?: ReactNode;
}) {
  const Chart = line ? LineChart : BarChart;
  const format = (value: number) =>
    `${value.toLocaleString("en-US", { maximumFractionDigits: year ? 0 : 1 })}${percent ? "%" : ""}`;
  return (
    <ChartCard
      title={title}
      pending={pending}
      error={error}
      empty={!data.length}
      onRetry={onRetry}
      action={action}
    >
      <ChartContainer
        config={{ value: { label: metric, color: "var(--primary)" } }}
        className="aspect-auto h-56 w-full"
        aria-label={`${title} (${metric.toLowerCase()})`}
      >
        <Chart accessibilityLayer data={data} margin={{ left: -8, right: 4 }}>
          <CartesianGrid vertical={false} strokeOpacity={0.4} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={decimals || metric === "Minutes" || percent}
            tickLine={false}
            axisLine={false}
            width={56}
            domain={year ? ["dataMin - 1", "dataMax + 1"] : [0, "auto"]}
            tickFormatter={
              percent
                ? (value) => `${value}%`
                : year
                  ? (value) => String(Math.round(value))
                  : undefined
            }
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_label, payload) => payload[0]?.payload.label}
                formatter={(value) => (
                  <>
                    <span className="text-muted-foreground">{metric}</span>
                    <span className="ml-auto font-medium tabular-nums">
                      {format(Number(value))}
                    </span>
                  </>
                )}
              />
            }
          />
          {line ? (
            <Line
              type="monotoneX"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={data.length === 1 || year || decimals ? { r: 2 } : false}
              connectNulls={false}
            />
          ) : (
            <Bar dataKey="value" fill="var(--color-value)" />
          )}
        </Chart>
      </ChartContainer>
    </ChartCard>
  );
}

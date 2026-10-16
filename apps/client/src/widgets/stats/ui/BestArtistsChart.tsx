import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArtistLink, type Artist } from "../../../entities/listening";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../shared/ui/chart";
import type { useStats } from "../model/use-stats";
import { ChartCard as StatsChartFrame } from "../../../shared/ui/chart-card";

function ArtistTick({
  x = 0,
  y = 0,
  payload,
  artists,
  publicToken,
}: {
  x?: number;
  y?: number;
  payload?: { value: number };
  artists: Artist[];
  publicToken?: string;
}) {
  const rank = Number(payload?.value);
  const artist = artists[rank - 1];
  if (!artist) return null;
  return (
    <foreignObject x={x - 12} y={y + 4} width={24} height={28}>
      <ArtistLink artist={artist} publicToken={publicToken}>
        <span className="sr-only">{artist.name}</span>
        <Avatar className="size-6" title={artist.name} aria-hidden="true">
          <AvatarImage src={artist.images?.[0]?.url} alt="" />
          <AvatarFallback>{rank}</AvatarFallback>
        </Avatar>
      </ArtistLink>
    </foreignObject>
  );
}

export function BestArtistsChart({
  stats,
  publicToken,
}: {
  stats: ReturnType<typeof useStats>;
  publicToken?: string;
}) {
  const { bestArtists: query, duration } = stats;
  const rows = query.data ?? [];
  const metric = duration ? "Minutes" : "Plays";
  const data = rows.map((row, index) => ({
    rank: index + 1,
    label: row.artist.name,
    value: duration ? row.duration_ms / 60_000 : row.count,
  }));
  return (
    <StatsChartFrame
      title="Best artists"
      pending={query.isPending}
      error={query.isError}
      empty={!rows.length}
      onRetry={() => void query.refetch()}
    >
      <ChartContainer
        config={{ value: { label: metric, color: "var(--primary)" } }}
        className="aspect-auto h-56 w-full"
        aria-label={`Best artists (${metric.toLowerCase()})`}
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ left: -8, right: 4, bottom: 8 }}
        >
          <CartesianGrid vertical={false} strokeOpacity={0.4} />
          <XAxis
            dataKey="rank"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
            tick={
              <ArtistTick
                artists={rows.map((row) => row.artist)}
                publicToken={publicToken}
              />
            }
            height={36}
          />
          <YAxis
            allowDecimals={duration}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_label, payload) => payload[0]?.payload.label}
                formatter={(value) => (
                  <>
                    <span>{metric}</span>
                    <span className="ml-auto tabular-nums">
                      {Number(value).toLocaleString("en-US", {
                        maximumFractionDigits: 1,
                      })}
                    </span>
                  </>
                )}
              />
            }
          />
          <Bar dataKey="value" fill="var(--color-value)" maxBarSize={32} />
        </BarChart>
      </ChartContainer>
    </StatsChartFrame>
  );
}

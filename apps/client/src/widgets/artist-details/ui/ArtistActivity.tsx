import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ArtistStatsResponse } from "../../../entities/listening";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../shared/ui/chart";
import { getArtistActivity } from "../model/artist-activity";

const chartConfig = { plays: { label: "Plays", color: "var(--primary)" } };

export function ArtistActivity({ stats }: { stats: ArtistStatsResponse }) {
  const { hours } = getArtistActivity(stats);
  return (
    <Card aria-labelledby="artist-hours-title" className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 id="artist-hours-title">Listening by hour</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.dayRepartition?.length ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-40 w-full"
            aria-label="Hourly play counts"
          >
            <BarChart
              accessibilityLayer
              data={hours}
              margin={{ left: -20, right: 4 }}
            >
              <CartesianGrid vertical={false} strokeOpacity={0.4} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) =>
                      `${String(payload[0]?.payload.hour).padStart(2, "0")}:00`
                    }
                  />
                }
              />
              <Bar dataKey="plays" fill="var(--color-plays)" />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No data</p>
        )}
      </CardContent>
    </Card>
  );
}

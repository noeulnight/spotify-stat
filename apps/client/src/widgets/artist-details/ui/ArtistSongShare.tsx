import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ArtistStatsResponse } from "../../../entities/listening";
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
import { getArtistSongShare } from "../model/artist-song-share";

const config = { count: { label: "Plays", color: "var(--primary)" } };
export function ArtistSongShare({ stats }: { stats: ArtistStatsResponse }) {
  const { topThreeShare, rows } = getArtistSongShare(stats);
  return (
    <Card aria-label="Favorite song concentration" className="min-w-0">
      <CardHeader>
        <CardTitle>Favorite songs</CardTitle>
        <CardDescription>
          Top 3 songs account for {topThreeShare}% of your plays
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartContainer
          config={config}
          className="aspect-auto h-48 w-full"
          aria-label="Top three songs and other plays"
        >
          <BarChart
            accessibilityLayer
            data={rows}
            layout="vertical"
            margin={{ left: 0, right: 8 }}
          >
            <CartesianGrid horizontal={false} strokeOpacity={0.4} />
            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={90}
              tickFormatter={(name: string) =>
                name.length > 13 ? `${name.slice(0, 12)}…` : name
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ChartContainer>
        <dl className="space-y-2 text-sm">
          {rows.map(({ id, name, count, share }) => (
            <div key={id} className="flex justify-between gap-3">
              <dt className="min-w-0 truncate" title={name}>
                {name}
              </dt>
              <dd className="shrink-0 text-muted-foreground tabular-nums">
                {count.toLocaleString("en-US")} · {share}%
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

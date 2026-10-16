import type { DateId, HourlyRanking } from "../../../entities/listening";
import { getActivitySeries } from "./stats-series";

type Series = { key: string; label: string; color: string };
type Point = { label: string } & Record<string, string | number>;
type Item = { id: string; name: string };

function selectSeries(
  totals: Map<string, number>,
  names: Map<string, string>,
  limit = 10,
) {
  const ids = [...totals.keys()]
    .sort((a, b) => totals.get(b)! - totals.get(a)! || a.localeCompare(b))
    .slice(0, limit);
  const series: Series[] = ids.map((id, index) => {
    let hue = 0;
    for (const char of id) hue = (hue * 31 + char.charCodeAt(0)) % 360;
    return {
      key: `item${index}`,
      label: names.get(id) ?? "Unknown",
      color: `oklch(0.65 0.15 ${(hue * 137.508) % 360})`,
    };
  });
  series.push({
    key: "other",
    label: "Other",
    color: "oklch(0.8 0 0)",
  });
  return { ids, series };
}

function percentagePoint(
  label: string,
  total: number,
  values: Map<string, number>,
  ids: string[],
): Point {
  const point: Point = { label };
  let shown = 0;
  ids.forEach((id, index) => {
    const value = values.get(id) ?? 0;
    shown += value;
    point[`item${index}`] = total > 0 ? (value / total) * 100 : 0;
  });
  point.other = total > 0 ? (Math.max(0, total - shown) / total) * 100 : 0;
  return point;
}

export function getArtistDistribution(
  rows: { _id?: DateId | null; artists: Item[]; counts: number[] }[],
  totals: { _id: DateId | null; count: number }[],
  monthly: boolean,
  limit = 10,
) {
  const amounts = new Map<string, number>();
  const names = new Map<string, string>();
  const buckets = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const label = getActivitySeries(
      [{ _id: row._id ?? null, count: 0 }],
      monthly,
    )[0]?.label;
    if (!label) continue;
    const values = new Map<string, number>();
    row.artists.forEach((artist, index) => {
      const count = row.counts[index] ?? 0;
      values.set(artist.id, count);
      names.set(artist.id, artist.name);
      amounts.set(artist.id, (amounts.get(artist.id) ?? 0) + count);
    });
    buckets.set(label, values);
  }
  const { ids, series } = selectSeries(amounts, names, limit);
  return {
    series,
    data: rows.length
      ? getActivitySeries(totals, monthly).map(({ label, value }) =>
          percentagePoint(
            label,
            value ?? 0,
            buckets.get(label) ?? new Map(),
            ids,
          ),
        )
      : [],
  };
}

export function getHourlyDistribution(rows: HourlyRanking[], limit = 10) {
  const amounts = new Map<string, number>();
  const names = new Map<string, string>();
  for (const row of rows) {
    for (const item of row.items) {
      amounts.set(item.itemId, (amounts.get(item.itemId) ?? 0) + item.total);
      names.set(item.itemId, row.full_items[item.itemId]?.name ?? "Unknown");
    }
  }
  const { ids, series } = selectSeries(amounts, names, limit);
  const hours = new Map(rows.map((row) => [row.hour, row]));
  return {
    series,
    data: rows.length
      ? Array.from({ length: 24 }, (_, hour) => {
          const row = hours.get(hour);
          return percentagePoint(
            `${String(hour).padStart(2, "0")}:00`,
            row?.total ?? 0,
            new Map(row?.items.map((item) => [item.itemId, item.total])),
            ids,
          );
        })
      : [],
  };
}

export function getHourlyShares(rows: { _id: number; count: number }[]) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return rows.length
    ? Array.from({ length: 24 }, (_, hour) => ({
        label: `${String(hour).padStart(2, "0")}:00`,
        value: total > 0 ? ((counts.get(hour) ?? 0) / total) * 100 : 0,
      }))
    : [];
}

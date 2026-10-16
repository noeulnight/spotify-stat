import type { DateId } from "../../../entities/listening";

export function getActivitySeries(
  rows: { _id: DateId | null; count: number }[],
  monthly: boolean,
  missing: number | null = 0,
) {
  const counts = new Map<number, number>();
  for (const row of rows) {
    if (!row._id?.month || (!monthly && !row._id.day)) continue;
    const { year, month, day } = row._id;
    counts.set(Date.UTC(year, month - 1, monthly ? 1 : day), row.count);
  }
  if (!counts.size) return [];
  const dates = [...counts.keys()];
  const last = Math.max(...dates);
  const cursor = new Date(Math.min(...dates));
  const format = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: monthly ? undefined : "numeric",
    timeZone: "UTC",
  });
  const series = [];
  while (cursor.getTime() <= last) {
    series.push({
      label: format.format(cursor),
      value: counts.get(cursor.getTime()) ?? missing,
    });
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return series;
}

export function formatListeningTime(ms: number) {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  return `${Math.floor(minutes / 60).toLocaleString("en-US")}h ${minutes % 60}m`;
}

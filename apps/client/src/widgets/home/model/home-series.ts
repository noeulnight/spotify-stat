import type { DateId } from "../../../entities/listening";

export function getHomeTimeSeries(
  rows: { _id: DateId | null; count: number }[],
  split: "hour" | "day" | "month",
) {
  const values = new Map<number, number>();
  for (const { _id: date, count } of rows) {
    if (!date?.month || (split !== "month" && !date.day)) continue;
    const timestamp = Date.UTC(
      date.year,
      date.month - 1,
      split === "month" ? 1 : date.day,
      split === "hour" ? (date.hour ?? 0) : 0,
    );
    values.set(timestamp, (values.get(timestamp) ?? 0) + count / 60_000);
  }
  if (!values.size) return [];
  const dates = [...values.keys()];
  const cursor = new Date(Math.min(...dates));
  const last = Math.max(...dates);
  const format = new Intl.DateTimeFormat(
    "en-US",
    split === "hour"
      ? { hour: "2-digit", hour12: false, timeZone: "UTC" }
      : {
          month: "short",
          day: split === "day" ? "numeric" : undefined,
          year: split === "month" ? "numeric" : undefined,
          timeZone: "UTC",
        },
  );
  const result = [];
  while (cursor.getTime() <= last) {
    result.push({
      label: `${format.format(cursor)}${split === "hour" ? ":00" : ""}`,
      value: values.get(cursor.getTime()) ?? 0,
    });
    if (split === "month") cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else if (split === "hour") cursor.setUTCHours(cursor.getUTCHours() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

export function getHomeHourlyShares(rows: { _id: number; count: number }[]) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const hours = new Map(rows.map((row) => [row._id, row.count]));
  return rows.length
    ? Array.from({ length: 24 }, (_, hour) => ({
        label: `${String(hour).padStart(2, "0")}:00`,
        value: total > 0 ? ((hours.get(hour) ?? 0) / total) * 100 : 0,
      }))
    : [];
}

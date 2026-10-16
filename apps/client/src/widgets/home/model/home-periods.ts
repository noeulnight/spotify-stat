export const homePeriods = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

export function getHomePeriods(now: Date, value = "week") {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (value === "week")
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  if (value === "month") start.setDate(1);
  if (value === "year") start.setMonth(0, 1);
  if (value === "all") start.setTime(0);
  const previousStart = new Date(start);
  if (value === "today") previousStart.setDate(previousStart.getDate() - 1);
  if (value === "week") previousStart.setDate(previousStart.getDate() - 7);
  if (value === "month") previousStart.setMonth(previousStart.getMonth() - 1);
  if (value === "year")
    previousStart.setFullYear(previousStart.getFullYear() - 1);
  return {
    value,
    label:
      homePeriods.find((period) => period.value === value)?.label ??
      "This week",
    start,
    end: now,
    previousStart,
    previousEnd: new Date(
      Math.min(
        start.getTime(),
        previousStart.getTime() + now.getTime() - start.getTime(),
      ),
    ),
  };
}

export function getHomeChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "New" : "No change";
  const percent = ((current - previous) / previous) * 100;
  return `${percent > 0 ? "+" : ""}${percent.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

export function formatHomeDuration(ms: number) {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  return `${Math.floor(minutes / 60).toLocaleString("en-US")}h ${minutes % 60}m`;
}

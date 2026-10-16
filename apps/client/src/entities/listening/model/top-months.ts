import type { DateId } from "../api/types";

export function getTopMonths(
  periods: { _id: DateId; count: number; total: number }[] = [],
) {
  return (periods ?? []).slice(0, 2).map((period) => ({
    label: new Intl.DateTimeFormat("en", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(period._id.year, (period._id.month ?? 1) - 1))),
    count: period.count,
    share:
      period.total > 0 ? Math.round((period.count / period.total) * 100) : 0,
  }));
}

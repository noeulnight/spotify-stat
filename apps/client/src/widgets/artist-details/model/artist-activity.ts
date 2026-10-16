import { getTopMonths } from "../../../entities/listening";
import type { ArtistStatsResponse } from "../../../entities/listening";

export function getArtistActivity(stats: ArtistStatsResponse) {
  const months = getTopMonths(stats.bestPeriod);
  const counts = new Map(
    (stats.dayRepartition ?? []).map((row) => [row._id, row.count]),
  );
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    plays: counts.get(hour) ?? 0,
  }));
  return { months, hours };
}

import type { AlbumStatsResponse } from "../api/types";

export function getAlbumOverview(stats: AlbumStatsResponse) {
  const listen = (
    value: NonNullable<AlbumStatsResponse["firstLast"]>["first"],
  ) => ({
    ...value,
    track: { ...value.track, album: stats.album },
  });
  return {
    total: { count: stats.tracks.reduce((sum, row) => sum + row.count, 0) },
    firstLast: stats.firstLast
      ? {
          first: listen(stats.firstLast.first),
          last: listen(stats.firstLast.last),
        }
      : undefined,
  };
}

import type { ArtistStatsResponse } from "../../../entities/listening";

export function getArtistSongShare(stats: ArtistStatsResponse) {
  const total = stats.total.count;
  const top = stats.mostListened.slice(0, 3);
  const count = top.reduce((sum, song) => sum + song.count, 0);
  const percent = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;
  const rows = top.map((song) => ({
    id: song._id,
    name: song.track.name,
    count: song.count,
    share: percent(song.count),
  }));
  if (total > count)
    rows.push({
      id: "other",
      name: "Other songs",
      count: total - count,
      share: percent(total - count),
    });
  return { rows, topThreeShare: percent(count) };
}

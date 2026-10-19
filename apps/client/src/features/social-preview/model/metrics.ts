import { formatListeningTime } from "../../../entities/listening";
import type {
  AlbumStatsResponse,
  ArtistStatsResponse,
  TrackStatsResponse,
} from "../../../entities/listening";
import type { Preview } from "./preview";

function dateValue(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
}

function metrics(
  entries: [string, string | undefined][],
): NonNullable<Preview["metrics"]> {
  return entries.flatMap(([label, value]) =>
    value === undefined ? [] : [{ label, value }],
  );
}

export function getSongMetrics(stats: TrackStatsResponse) {
  return metrics([
    ["Plays", stats.total.count.toLocaleString("en-US")],
    ["Listening time", formatListeningTime(stats.total.durationMs)],
    ["First played", dateValue(stats.firstLast?.first?.played_at)],
    ["Last played", dateValue(stats.firstLast?.last?.played_at)],
  ]);
}

export function getAlbumMetrics(stats: AlbumStatsResponse) {
  return metrics([
    [
      "Plays",
      (
        stats.total?.count ??
        stats.tracks.reduce((total, track) => total + track.count, 0)
      ).toLocaleString("en-US"),
    ],
    ["Listening time", formatListeningTime(stats.total?.durationMs)],
    [
      "Songs",
      (stats.total?.differents ?? stats.tracks.length).toLocaleString("en-US"),
    ],
    ["First played", dateValue(stats.firstLast?.first?.played_at)],
  ]);
}

export function getArtistMetrics(stats: ArtistStatsResponse) {
  return metrics([
    ["Plays", stats.total.count.toLocaleString("en-US")],
    ["Listening time", formatListeningTime(stats.total.durationMs)],
    ["Songs", stats.total.differents?.toLocaleString("en-US")],
    ["Albums", stats.total.albums?.toLocaleString("en-US")],
  ]);
}

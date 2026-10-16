import type { CurrentlyPlayingResponse } from "../api/types";

export function getPlaybackProgress(
  playback: CurrentlyPlayingResponse,
  now: number,
) {
  const durationMs = Math.max(0, playback.track.durationMs);
  const elapsedMs = playback.isPlaying
    ? Math.max(0, now - playback.fetchedAt)
    : 0;
  return {
    positionMs: Math.min(
      durationMs,
      Math.max(0, playback.progressMs + elapsedMs),
    ),
    durationMs,
  };
}

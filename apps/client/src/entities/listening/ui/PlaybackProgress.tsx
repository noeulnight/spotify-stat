import { useEffect, useState } from "react";
import { Progress } from "../../../shared/ui/progress";
import type { CurrentlyPlayingResponse } from "../api/types";
import { getPlaybackProgress } from "../model/playback-progress";

function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PlaybackProgress({
  playback,
}: {
  playback: CurrentlyPlayingResponse;
}) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!playback.isPlaying) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [playback.isPlaying]);

  const { positionMs, durationMs } = getPlaybackProgress(playback, now);
  const position = formatTime(positionMs);
  const duration = formatTime(durationMs);

  return (
    <div className="space-y-1">
      <Progress
        aria-label="Playback progress"
        aria-valuetext={`${position} / ${duration}`}
        value={durationMs > 0 ? (positionMs / durationMs) * 100 : 0}
        className="w-full"
      />
      <div
        aria-hidden="true"
        className="flex justify-between text-[10px] leading-none text-muted-foreground tabular-nums"
      >
        <span>{position}</span>
        <span>{duration}</span>
      </div>
    </div>
  );
}

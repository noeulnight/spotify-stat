import { isAxiosError } from "axios";
import { LoaderCircle, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { usePlaybackControl } from "../api/use-playback-control";
import type { PlaybackAction } from "../api/types";

export function PlaybackControls({ isPlaying }: { isPlaying: boolean }) {
  const { client, queryClient } = useApiRuntime();
  const control = usePlaybackControl(client, queryClient);
  const perform = (action: PlaybackAction) =>
    control.mutate(action, {
      onError: (error) =>
        toast.error(
          isAxiosError(error) &&
            error.response?.data?.reason === "NO_ACTIVE_DEVICE"
            ? "Open Spotify on a device, then try again."
            : "Could not update playback. Try again.",
        ),
    });

  return (
    <div
      role="group"
      aria-label="Playback controls"
      aria-busy={control.isPending}
      className="flex items-center justify-center gap-3"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous track"
        disabled={control.isPending}
        onClick={() => perform("previous")}
      >
        <SkipBack aria-hidden="true" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        aria-label={isPlaying ? "Pause playback" : "Resume playback"}
        disabled={control.isPending}
        onClick={() => perform(isPlaying ? "pause" : "resume")}
      >
        {control.isPending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : isPlaying ? (
          <Pause aria-hidden="true" />
        ) : (
          <Play aria-hidden="true" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next track"
        disabled={control.isPending}
        onClick={() => perform("next")}
      >
        <SkipForward aria-hidden="true" />
      </Button>
    </div>
  );
}

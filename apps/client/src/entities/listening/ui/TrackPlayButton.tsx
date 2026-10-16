import { isAxiosError } from "axios";
import { LoaderCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { usePlayTrack } from "../api/use-play-track";

export function TrackPlayButton({
  trackId,
  title,
}: {
  trackId: string;
  title: string;
}) {
  const { client, queryClient } = useApiRuntime();
  const play = usePlayTrack(client, queryClient);
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      aria-label={`Play ${title}`}
      aria-busy={play.isPending}
      disabled={play.isPending}
      className="absolute inset-0 z-10 size-full rounded-md bg-black/60 text-white opacity-0 transition-opacity group-focus-within/media-cover:opacity-100 group-hover/media-cover:opacity-100 hover:bg-black/70 hover:text-white focus-visible:opacity-100 disabled:opacity-100 [@media(hover:none)]:opacity-100"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        play.mutate(trackId, {
          onError: (error) => {
            const reason = isAxiosError(error)
              ? error.response?.data?.reason
              : undefined;
            toast.error(
              reason === "NO_ACTIVE_DEVICE"
                ? "Open Spotify on a device, then try again."
                : "Could not play this track. Try again.",
            );
          },
        });
      }}
    >
      {play.isPending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Play aria-hidden="true" className="size-4 fill-current" />
      )}
    </Button>
  );
}

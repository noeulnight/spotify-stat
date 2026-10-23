import { useAccount } from "../../../entities/account";
import { TrackPlayButton } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";
import type { RecommendedSong } from "../api/recommendations";

export function RecommendationCover({
  song,
}: {
  song: Pick<RecommendedSong, "trackId" | "title" | "imageUrl">;
}) {
  const { client, queryClient } = useApiRuntime();
  const viewer = useAccount(client, queryClient);
  return (
    <div className="group/media-cover relative size-10 shrink-0 rounded bg-muted">
      {song.imageUrl && (
        <img
          src={song.imageUrl}
          alt=""
          className="size-full rounded object-cover"
        />
      )}
      {viewer.data?.status && (
        <TrackPlayButton
          trackId={song.trackId}
          title={song.title ?? "Spotify track"}
        />
      )}
    </div>
  );
}

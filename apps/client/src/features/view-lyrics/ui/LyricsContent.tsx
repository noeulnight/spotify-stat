import "./lyrics-text.css";
import { useQuery } from "@tanstack/react-query";
import {
  createListeningQueries,
  type CurrentlyPlayingResponse,
} from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";
import { getLyricsText } from "../model/lyrics";
import { LyricsText } from "./LyricsText";

export function LyricsContent({
  trackId,
  playback,
  publicToken,
  mode = "panel",
}: {
  trackId: string;
  playback?: CurrentlyPlayingResponse | null;
  publicToken?: string;
  mode?: "panel" | "preview" | "full" | "floating";
}) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const lyrics = useQuery(
    createListeningQueries(client).getLyrics(trackId),
    queryClient,
  );

  if (lyrics.isPending) {
    return (
      <div role="status" aria-label="Loading lyrics" className="space-y-6 py-2">
        {[0, 1, 2].map((line) => (
          <Skeleton key={line} className="h-5 w-4/5" />
        ))}
      </div>
    );
  }
  if (lyrics.isError) {
    return (
      <div role="alert" className="space-y-4">
        <p>Could not load lyrics</p>
        <Button
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            void lyrics.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }
  if (!lyrics.data || lyrics.data.instrumental || !getLyricsText(lyrics.data)) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-center text-muted-foreground">
        {lyrics.data?.instrumental ? "Instrumental" : "Lyrics unavailable"}
      </div>
    );
  }
  return (
    <LyricsText
      lyrics={lyrics.data}
      trackId={trackId}
      playback={playback}
      mode={mode}
      className={mode === "panel" || mode === "floating" ? "flex-1" : ""}
    />
  );
}

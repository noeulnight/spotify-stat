import { useQuery } from "@tanstack/react-query";
import { useAccount } from "../../../entities/account";
import { createListeningQueries } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { Skeleton } from "../../../shared/ui/skeleton";
import { LyricsBody, PlaybackInfo } from "./LyricsViewer";

export function NowPlayingPage({
  publicToken,
  floating = false,
}: {
  publicToken?: string;
  floating?: boolean;
}) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const playback = useQuery(
    {
      ...createListeningQueries(client).currentlyPlaying(),
      enabled: account.data?.status === true,
      refetchIntervalInBackground: floating,
    },
    queryClient,
  );

  const error = account.isError || playback.isError;
  const loading =
    account.isPending || (account.data?.status && playback.isPending);
  const current = account.data?.status ? playback.data : undefined;
  const playbackInfo = current ? (
    <PlaybackInfo
      playback={current}
      publicToken={publicToken}
      floating={floating}
    />
  ) : null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {loading ? (
        <div
          role="status"
          aria-label="Loading playback"
          className="space-y-4 px-4"
        >
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-2 w-full" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-3"
        >
          <p className="text-muted-foreground">Playback unavailable</p>
          <Button
            variant="outline"
            onClick={() =>
              void (account.isError ? account.refetch() : playback.refetch())
            }
          >
            Retry
          </Button>
        </div>
      ) : !account.data?.status ? (
        <p className="flex flex-1 items-center justify-center text-muted-foreground">
          {publicToken ? "Share unavailable" : "Log in to view playback"}
        </p>
      ) : current ? (
        <>
          {!floating && playbackInfo}
          <LyricsBody
            key={current.track.id}
            playback={current}
            publicToken={publicToken}
            floating={floating}
          />
          {floating && playbackInfo}
        </>
      ) : (
        <p className="flex flex-1 items-center justify-center text-muted-foreground">
          Nothing playing
        </p>
      )}
    </div>
  );
}

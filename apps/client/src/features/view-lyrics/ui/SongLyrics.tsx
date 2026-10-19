import { useId, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "../../../entities/account";
import { createListeningQueries } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { Card } from "../../../shared/ui/card";
import { LyricsContent } from "./LyricsContent";

export function SongLyrics({
  trackId,
  publicToken,
}: {
  trackId: string;
  publicToken?: string;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const playback = useQuery(
    {
      ...createListeningQueries(client).currentlyPlaying(),
      enabled: account.data?.status === true,
      refetchIntervalInBackground: false,
    },
    queryClient,
  );
  const current = playback.isError ? null : playback.data;
  return (
    <Card
      className={`min-w-0 gap-0 py-0 ${open ? "" : "cursor-pointer"}`}
      onClick={() => {
        if (!open) setOpen(true);
      }}
    >
      <Button
        variant="ghost"
        aria-label={open ? "Collapse lyrics" : "Expand lyrics"}
        aria-expanded={open}
        aria-controls={contentId}
        className="h-auto w-full cursor-pointer justify-between rounded-b-none px-6 pt-6 pb-0 text-left font-normal hover:bg-transparent active:translate-y-0 aria-expanded:bg-transparent dark:hover:bg-transparent"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        Lyrics
        {open ? (
          <ChevronUpIcon aria-hidden="true" />
        ) : (
          <ChevronDownIcon aria-hidden="true" />
        )}
      </Button>
      <div id={contentId} className="px-6 pt-4 pb-6">
        <LyricsContent
          trackId={trackId}
          publicToken={publicToken}
          playback={current}
          mode={open ? "full" : "preview"}
        />
      </div>
    </Card>
  );
}

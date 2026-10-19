import { useState } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { createPortal } from "react-dom";
import { ImageIcon, X } from "lucide-react";
import {
  MediaInfo,
  PlaybackProgress,
  PlaybackControls,
  ArtistLink,
  type CurrentlyPlayingResponse,
} from "../../../entities/listening";
import { Button, buttonVariants } from "../../../shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { useIsMobile } from "../../../shared/lib/use-mobile";
import { useSidebar } from "../../../shared/ui/sidebar";
import { ResizablePlaybackPanel } from "./ResizablePlaybackPanel";
import { LyricsContent } from "./LyricsContent";

export function LyricsViewer({
  playback,
  publicToken,
}: {
  playback: CurrentlyPlayingResponse;
  publicToken?: string;
}) {
  const { setOpenMobile } = useSidebar();
  const [open, setOpen] = useState(playback.isPlaying);
  const [wasPlaying, setWasPlaying] = useState(playback.isPlaying);
  if (wasPlaying !== playback.isPlaying) {
    setWasPlaying(playback.isPlaying);
    if (playback.isPlaying) setOpen(true);
  }
  const trigger = (
    <div className="w-full min-w-0 space-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="lg" className="rounded-md after:rounded-md">
          <AvatarImage
            src={playback.album.imageUrl ?? undefined}
            alt=""
            className="rounded-md"
          />
          <AvatarFallback className="rounded-md">
            <ImageIcon aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="marquee">
            <p className="text-sm font-medium">{playback.track.name}</p>
          </div>
          <div className="marquee">
            <p className="text-xs text-muted-foreground">
              {playback.artists.map((artist) => artist.name).join(", ")}
            </p>
          </div>
        </div>
      </div>
      <PlaybackProgress playback={playback} />
    </div>
  );
  const isMobile = useIsMobile();
  if (!isMobile) {
    const target =
      typeof document !== "undefined"
        ? document.getElementById("lyrics-panel-slot")
        : null;
    return (
      <Collapsible.Root open={open} onOpenChange={setOpen} className="contents">
        <Collapsible.Trigger
          aria-label="Open now playing"
          render={
            <Button
              variant="ghost"
              className="h-auto w-full cursor-pointer justify-start bg-transparent p-0 text-left whitespace-normal hover:bg-sidebar-accent/60 aria-expanded:bg-transparent aria-expanded:hover:bg-sidebar-accent/60 dark:hover:bg-sidebar-accent/60"
            />
          }
        >
          {trigger}
        </Collapsible.Trigger>
        {target &&
          createPortal(
            <ResizablePlaybackPanel>
              <header className="flex shrink-0 items-start gap-2 p-4">
                <h2 className="min-w-0 flex-1 text-sm font-medium">
                  Now playing
                </h2>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close now playing"
                  onClick={() => setOpen(false)}
                >
                  <X aria-hidden="true" />
                </Button>
              </header>
              <PlaybackInfo playback={playback} publicToken={publicToken} />
              <LyricsBody
                key={playback.track.id}
                playback={playback}
                publicToken={publicToken}
              />
            </ResizablePlaybackPanel>,
            target,
          )}
      </Collapsible.Root>
    );
  }
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  return (
    <a
      href={`${prefix}/now-playing`}
      aria-label="Open now playing"
      className={buttonVariants({
        variant: "ghost",
        className:
          "h-auto w-full cursor-pointer justify-start bg-transparent p-0 text-left whitespace-normal hover:bg-sidebar-accent/60 dark:hover:bg-sidebar-accent/60",
      })}
      onClick={() => setOpenMobile(false)}
    >
      {trigger}
    </a>
  );
}

export function PlaybackInfo({
  playback,
  publicToken,
}: {
  playback: CurrentlyPlayingResponse;
  publicToken?: string;
}) {
  return (
    <div className="shrink-0 space-y-3 px-4 pb-4">
      <MediaInfo
        marquee
        trackId={playback.track.id}
        albumId={playback.album.id}
        title={playback.track.name}
        imageUrl={playback.album.imageUrl ?? undefined}
        publicToken={publicToken}
        subTitle={playback.artists.map((artist, index) => (
          <span key={artist.id}>
            {index > 0 && ", "}
            <ArtistLink artist={artist} publicToken={publicToken} />
          </span>
        ))}
      />
      <PlaybackProgress playback={playback} />
      {!publicToken && <PlaybackControls isPlaying={playback.isPlaying} />}
    </div>
  );
}

export function LyricsBody({
  playback,
  publicToken,
}: {
  playback: CurrentlyPlayingResponse;
  publicToken?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
      <LyricsContent
        trackId={playback.track.id}
        playback={playback}
        publicToken={publicToken}
      />
    </div>
  );
}

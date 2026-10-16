import { useEffect, useMemo, useRef, useState } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, X } from "lucide-react";
import {
  createListeningQueries,
  getPlaybackProgress,
  MediaInfo,
  PlaybackProgress,
  PlaybackControls,
  ArtistLink,
  type CurrentlyPlayingResponse,
} from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";
import { Button, buttonVariants } from "../../../shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { Skeleton } from "../../../shared/ui/skeleton";
import { useIsMobile } from "../../../shared/lib/use-mobile";
import { useSidebar } from "../../../shared/ui/sidebar";
import { ResizablePlaybackPanel } from "./ResizablePlaybackPanel";
import { activeLyricIndex, parseLyrics } from "../model/lyrics";

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
  const { client, queryClient } = useApiRuntime(publicToken);
  const lyrics = useQuery(
    createListeningQueries(client).getLyrics(playback.track.id),
    queryClient,
  );
  const lines = useMemo(
    () => parseLyrics(lyrics.data?.syncedLyrics),
    [lyrics.data?.syncedLyrics],
  );
  const [now, setNow] = useState(Date.now);
  const activeRef = useRef<HTMLLIElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const position = getPlaybackProgress(playback, now).positionMs;
  const active = activeLyricIndex(lines, position);
  const showMessage =
    !lyrics.isPending &&
    (lyrics.isError ||
      lyrics.data?.instrumental ||
      (lines.length === 0 && !lyrics.data?.plainLyrics?.trim()));

  useEffect(() => {
    let scrollTop = 0;
    const saveScroll = () => {
      scrollTop = viewportRef.current?.scrollTop ?? 0;
    };
    const restoreScroll = () => {
      if (viewportRef.current) viewportRef.current.scrollTop = scrollTop;
    };
    document.addEventListener("astro:before-swap", saveScroll);
    document.addEventListener("astro:after-swap", restoreScroll);
    return () => {
      document.removeEventListener("astro:before-swap", saveScroll);
      document.removeEventListener("astro:after-swap", restoreScroll);
    };
  }, []);

  useEffect(() => {
    if (!playback.isPlaying) return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [playback.isPlaying]);

  useEffect(() => {
    const row = activeRef.current;
    const viewport = viewportRef.current;
    if (!row || !viewport) return;
    const scrollToActive = () => {
      const top =
        viewport.scrollTop +
        row.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top -
        parseFloat(getComputedStyle(viewport).paddingTop) -
        48;
      viewport.scrollTo({
        top,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };
    scrollToActive();
    const observer = new ResizeObserver(scrollToActive);
    observer.observe(viewport);
    observer.observe(row);
    return () => observer.disconnect();
  }, [active]);

  return (
    <>
      <div
        ref={viewportRef}
        tabIndex={0}
        aria-label="Lyrics text"
        className={`min-h-0 flex-1 overflow-y-auto px-6 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring ${showMessage ? "flex items-center justify-center text-center" : ""}`}
      >
        {lyrics.isPending ? (
          <div role="status" aria-label="Loading lyrics" className="space-y-6">
            {[0, 1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-6 w-4/5" />
            ))}
          </div>
        ) : lyrics.isError ? (
          <div role="alert" className="space-y-3">
            <p>Could not load lyrics</p>
            <Button variant="outline" onClick={() => void lyrics.refetch()}>
              Retry
            </Button>
          </div>
        ) : lyrics.data?.instrumental ? (
          <p className="text-muted-foreground">Instrumental</p>
        ) : lines.length > 0 ? (
          <ol className="pb-[100dvh]">
            {lines.map((line, index) => (
              <li
                key={line.timeMs}
                ref={index === active ? activeRef : undefined}
                aria-current={index === active ? "true" : undefined}
                className={`origin-left leading-relaxed font-semibold wrap-break-word break-keep whitespace-pre-line transition-[color,font-size,transform] duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none ${index === active ? "scale-100 text-2xl text-foreground" : "scale-[0.96] text-xl text-muted-foreground/60"}`}
              >
                {line.text || "♪"}
              </li>
            ))}
          </ol>
        ) : lyrics.data?.plainLyrics?.trim() ? (
          <p className="text-lg leading-loose wrap-break-word break-keep whitespace-pre-line">
            {lyrics.data.plainLyrics}
          </p>
        ) : (
          <p className="text-muted-foreground">Lyrics unavailable</p>
        )}
      </div>
    </>
  );
}

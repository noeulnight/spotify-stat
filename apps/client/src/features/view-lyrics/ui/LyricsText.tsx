import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { getPlaybackProgress } from "../../../entities/listening";
import type {
  CurrentlyPlayingResponse,
  TrackLyrics,
} from "../../../entities/listening";
import {
  activeSongLyricIndex,
  getLyricsText,
  parseLyrics,
} from "../model/lyrics";

export function LyricsText({
  lyrics,
  trackId,
  playback,
  mode = "panel",
  className = "",
}: {
  lyrics: TrackLyrics;
  trackId: string;
  playback?: CurrentlyPlayingResponse | null;
  mode?: "panel" | "preview" | "full" | "floating";
  className?: string;
}) {
  const lines = useMemo(
    () => parseLyrics(lyrics.syncedLyrics),
    [lyrics.syncedLyrics],
  );
  const [now, setNow] = useState(Date.now);
  const viewportRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);
  const previousMode = useRef(mode);
  const userScrollUntil = useRef(0);
  const userScrolling = useRef(false);
  const pauseFollowing = () => {
    userScrolling.current = true;
    userScrollUntil.current = Date.now() + 750;
  };
  const current = playback?.track.id === trackId ? playback : null;
  const active = activeSongLyricIndex(lines, trackId, current, now);
  const position = current ? getPlaybackProgress(current, now).positionMs : 0;
  const start = lines[active]?.timeMs ?? 0;
  const end = lines[active + 1]?.timeMs ?? current?.track.durationMs ?? start;
  const progress =
    end > start
      ? Math.min(1, Math.max(0, (position - start) / (end - start)))
      : 1;

  useEffect(() => {
    if (!current?.isPlaying || lines.length === 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [current?.isPlaying, lines.length]);

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
    const row = activeRef.current;
    const viewport = viewportRef.current;
    if (!row || !viewport) return;
    if (previousMode.current !== mode) {
      userScrolling.current = false;
      userScrollUntil.current = 0;
      previousMode.current = mode;
    }
    const scrollToActive = (behavior: ScrollBehavior = "smooth") => {
      const offset = Math.max(
        0,
        viewport.clientHeight * (mode === "panel" ? 1 / 5 : 1 / 2) -
          row.clientHeight / 2,
      );
      viewport.style.setProperty(
        "--lyrics-follow-end-space",
        `${Math.max(0, viewport.clientHeight - offset - row.clientHeight)}px`,
      );
      const rowBounds = row.getBoundingClientRect();
      const viewportBounds = viewport.getBoundingClientRect();
      if (userScrolling.current) {
        if (
          Date.now() < userScrollUntil.current ||
          rowBounds.bottom <= viewportBounds.top ||
          rowBounds.top >= viewportBounds.bottom
        )
          return;
        userScrolling.current = false;
      }
      viewport.scrollTo({
        top: viewport.scrollTop + rowBounds.top - viewportBounds.top - offset,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : behavior,
      });
    };
    scrollToActive();
    let viewportHeight = viewport.clientHeight;
    let rowHeight = row.clientHeight;
    const observer = new ResizeObserver(() => {
      if (
        viewportHeight === viewport.clientHeight &&
        rowHeight === row.clientHeight
      )
        return;
      viewportHeight = viewport.clientHeight;
      rowHeight = row.clientHeight;
      scrollToActive("instant");
    });
    observer.observe(viewport);
    observer.observe(row);
    return () => observer.disconnect();
  }, [active, mode]);

  return (
    <span
      ref={viewportRef}
      tabIndex={0}
      aria-label="Lyrics text"
      onWheel={pauseFollowing}
      onTouchMove={pauseFollowing}
      onKeyDown={(event) => {
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "PageUp",
            "PageDown",
            "Home",
            "End",
            " ",
          ].includes(event.key)
        )
          pauseFollowing();
      }}
      data-mode={mode}
      data-synced={active >= 0 ? "true" : undefined}
      className={`lyrics-text block min-h-0 text-left text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white ${className}`}
    >
      {lines.length > 0 ? (
        <span role="list" className="lyrics-text__list">
          {lines.map((line, index) => (
            <span
              role="listitem"
              key={line.timeMs}
              ref={index === active ? activeRef : undefined}
              aria-current={index === active ? "true" : undefined}
              data-state={
                active < 0
                  ? current
                    ? "upcoming"
                    : "static"
                  : index === active
                    ? "active"
                    : index < active
                      ? "sung"
                      : "upcoming"
              }
              className={`lyrics-text__line ${index === active ? "font-bold" : "font-normal"}`}
              style={
                index === active
                  ? ({
                      "--lyrics-progress": `${progress * 100}%`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <span className="lyrics-text__words">{line.text}</span>
            </span>
          ))}
        </span>
      ) : (
        <span className="lyrics-text__list lyrics-text__plain">
          {getLyricsText(lyrics)}
        </span>
      )}
    </span>
  );
}

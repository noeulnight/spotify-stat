import { z } from "zod";

const lyricsSchema = z.object({
  id: z.number(),
  instrumental: z.boolean(),
  plainLyrics: z.string().nullable(),
  syncedLyrics: z.string().nullable(),
});

export interface LyricsSignature {
  trackName: string;
  artistName: string;
  albumName: string;
  durationMs: number;
}

export async function resolveLyricsSignature(
  trackId: string,
  stored: LyricsSignature | null,
  getPlayback: () => Promise<{
    currently_playing_type: string;
    item: {
      id: string;
      name: string;
      duration_ms: number;
      artists: { name: string }[];
      album: { name: string };
    } | null;
  } | null>,
): Promise<LyricsSignature | null> {
  if (stored) return stored;
  const playback = await getPlayback();
  const track = playback?.item;
  if (playback?.currently_playing_type !== "track" || track?.id !== trackId)
    return null;
  const artist = track.artists[0];
  if (!artist) return null;
  return {
    trackName: track.name,
    artistName: artist.name,
    albumName: track.album.name,
    durationMs: track.duration_ms,
  };
}

export class LyricsUnavailable extends Error {
  constructor(public readonly retryAfter = 1) {
    super("Lyrics service unavailable");
  }
}

export function createLyricsLookup(fetcher: typeof fetch = fetch) {
  const cache = new Map<
    string,
    { expires: number; value: Promise<z.infer<typeof lyricsSchema> | null> }
  >();
  let queue = Promise.resolve();
  let nextRequestAt = 0;
  let blockedUntil = 0;
  return (signature: LyricsSignature) => {
    const key = JSON.stringify(signature);
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = queue.then(async () => {
      if (blockedUntil > Date.now())
        throw new LyricsUnavailable(
          Math.ceil((blockedUntil - Date.now()) / 1000),
        );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, nextRequestAt - Date.now())),
      );
      const url = new URL("https://lrclib.net/api/get");
      url.searchParams.set("track_name", signature.trackName);
      url.searchParams.set("artist_name", signature.artistName);
      if (signature.albumName)
        url.searchParams.set("album_name", signature.albumName);
      const duration = signature.durationMs / 1000;
      if (duration >= 1 && duration <= 3600)
        url.searchParams.set("duration", String(duration));
      try {
        const response = await fetcher(url, {
          headers: {
            "User-Agent":
              "Spotistat/0.0.1 (https://github.com/noeulnight/spotify-stat)",
          },
          signal: AbortSignal.timeout(8000),
        });
        if (response.status === 429 || response.status === 503) {
          const header = response.headers.get("Retry-After");
          const seconds =
            header && /^\d+$/.test(header)
              ? Number(header)
              : header
                ? Math.ceil((Date.parse(header) - Date.now()) / 1000)
                : 1;
          const retryAfter = Number.isFinite(seconds)
            ? Math.max(1, seconds)
            : 1;
          blockedUntil = Date.now() + retryAfter * 1000;
          throw new LyricsUnavailable(retryAfter);
        }
        if (response.status === 404) return null;
        if (!response.ok) throw new LyricsUnavailable();
        return lyricsSchema.parse(await response.json());
      } finally {
        nextRequestAt = Date.now() + 300;
      }
    });
    queue = value.then(
      () => undefined,
      () => undefined,
    );
    const entry = { expires: Date.now() + 3_600_000, value };
    cache.set(key, entry);
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
    void value.catch(() => {
      if (cache.get(key) === entry) cache.delete(key);
    });
    return value;
  };
}

export const getLyrics = createLyricsLookup();

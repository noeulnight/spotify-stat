import { z } from "zod";

const lyricsSchema = z.object({
  id: z.number(),
  instrumental: z.boolean(),
  plainLyrics: z.string().nullable(),
  syncedLyrics: z.string().nullable(),
});
export type Lyrics = z.infer<typeof lyricsSchema>;

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
  constructor(
    public readonly retryAfter = 1,
    public readonly reason = "UPSTREAM_UNAVAILABLE",
  ) {
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
  const request = async (url: URL) => {
    if (blockedUntil > Date.now())
      throw new LyricsUnavailable(
        Math.ceil((blockedUntil - Date.now()) / 1000),
      );
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, nextRequestAt - Date.now())),
    );
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
        const retryAfter = Number.isFinite(seconds) ? Math.max(1, seconds) : 1;
        blockedUntil = Date.now() + retryAfter * 1000;
        throw new LyricsUnavailable(retryAfter, `HTTP_${response.status}`);
      }
      if (response.status === 404) return null;
      if (!response.ok)
        throw new LyricsUnavailable(1, `HTTP_${response.status}`);
      return await response.json();
    } finally {
      nextRequestAt = Date.now() + 300;
    }
  };
  const lookup = (signature: LyricsSignature) => {
    const key = JSON.stringify(signature);
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = queue.then(async () => {
      const url = new URL("https://lrclib.net/api/get");
      url.searchParams.set("track_name", signature.trackName);
      url.searchParams.set("artist_name", signature.artistName);
      if (signature.albumName)
        url.searchParams.set("album_name", signature.albumName);
      const duration = signature.durationMs / 1000;
      const validDuration = duration >= 1 && duration <= 3600;
      if (validDuration) url.searchParams.set("duration", String(duration));
      const result = await request(url);
      if (result !== null) return lyricsSchema.parse(result);
      // Search only after a genuine miss, and retain version names when matching.
      if (!validDuration) return null;
      url.pathname = "/api/search";
      url.searchParams.delete("album_name");
      url.searchParams.delete("duration");
      const normalize = (text: string) =>
        text.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
      const candidates = z
        .array(
          lyricsSchema.extend({
            trackName: z.string(),
            artistName: z.string(),
            albumName: z.string(),
            duration: z.number().finite(),
          }),
        )
        .parse((await request(url)) ?? []);
      const matches = candidates.filter(
        (candidate) =>
          normalize(candidate.trackName) === normalize(signature.trackName) &&
          normalize(candidate.artistName) === normalize(signature.artistName) &&
          Math.abs(candidate.duration - duration) <= 2 &&
          (candidate.instrumental ||
            candidate.syncedLyrics?.trim() ||
            candidate.plainLyrics?.trim()),
      );
      matches.sort(
        (a, b) =>
          Number(normalize(b.albumName) === normalize(signature.albumName)) -
            Number(normalize(a.albumName) === normalize(signature.albumName)) ||
          Math.abs(a.duration - duration) - Math.abs(b.duration - duration),
      );
      return matches[0] ? lyricsSchema.parse(matches[0]) : null;
    });
    queue = value.then(
      () => undefined,
      () => undefined,
    );
    const entry = { expires: Date.now() + 3_600_000, value };
    cache.set(key, entry);
    void value.then(
      (lyrics) => {
        if (lyrics === null) entry.expires = Date.now() + 300_000;
      },
      () => undefined,
    );
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
    void value.catch(() => {
      if (cache.get(key) === entry) cache.delete(key);
    });
    return value;
  };
  return Object.assign(lookup, { clear: () => cache.clear() });
}

export const getLyrics = createLyricsLookup();

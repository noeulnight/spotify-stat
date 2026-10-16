import { getLyrics, type Lyrics, type LyricsSignature } from "./lyrics";

export interface LyricsCacheStore {
  get(trackId: string): Promise<Lyrics | null | undefined>;
  set(trackId: string, lyrics: Lyrics | null): Promise<unknown>;
  clear(): Promise<unknown>;
}

export function createLyricsCache(store: LyricsCacheStore, lookup = getLyrics) {
  let generation = 0;
  let writes = Promise.resolve<unknown>(undefined);
  const pending = new Map<string, Promise<Lyrics | null>>();
  const mutate = (operation: () => Promise<unknown>) => {
    const result = writes.then(operation);
    writes = result.catch(() => undefined);
    return result;
  };
  return {
    async get(
      trackId: string,
      loadSignature: () => Promise<LyricsSignature | null>,
    ) {
      const cached = await store.get(trackId);
      if (cached !== undefined) return cached;
      const existing = pending.get(trackId);
      if (existing) return existing;
      const version = generation;
      const result = (async () => {
        const signature = await loadSignature();
        // Missing playback metadata is temporary, not a cached lyrics miss.
        if (!signature) return null;
        const lyrics = await lookup(signature);
        await mutate(async () => {
          if (version === generation) await store.set(trackId, lyrics);
        }).catch(() => console.warn("Could not write lyrics cache"));
        return lyrics;
      })();
      pending.set(trackId, result);
      try {
        return await result;
      } finally {
        if (pending.get(trackId) === result) pending.delete(trackId);
      }
    },
    async clear() {
      generation++;
      pending.clear();
      lookup.clear();
      // Finish earlier writes before deleting so cleared data cannot reappear.
      await mutate(() => store.clear());
    },
  };
}

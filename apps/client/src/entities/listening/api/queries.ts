import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { ApiClient } from "../../../shared/api";
import { createListeningApi } from "./api";

type Api = ReturnType<typeof createListeningApi>;

export function createListeningQueries(client: ApiClient) {
  return {
    getLyrics: (id: string) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "lyrics", id],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getLyrics(id),
        staleTime: 3_600_000,
        retry: (failureCount, error) =>
          failureCount < 2 &&
          isAxiosError(error) &&
          error.code !== "ERR_CANCELED" &&
          (!error.response ||
            [429, 502, 503, 504].includes(error.response.status)),
        retryDelay: (attempt, error) => {
          const header = isAxiosError(error)
            ? error.response?.headers["retry-after"]
            : undefined;
          if (header != null) {
            const value = String(header);
            const delay = /^\d+$/.test(value)
              ? Number(value) * 1000
              : Date.parse(value) - Date.now();
            if (Number.isFinite(delay)) return Math.max(1000, delay);
          }
          return Math.min(1000 * 2 ** attempt, 10_000);
        },
      }),
    currentlyPlaying: (...args: Parameters<Api["currentlyPlaying"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "currentlyPlaying",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).currentlyPlaying(...args),
        refetchInterval: 5_000,
      }),
    getTracks: (...args: Parameters<Api["getTracks"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getTracks", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getTracks(...args),
      }),
    mostListened: (...args: Parameters<Api["mostListened"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "mostListened", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).mostListened(...args),
      }),
    mostListenedArtist: (...args: Parameters<Api["mostListenedArtist"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "mostListenedArtist",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).mostListenedArtist(...args),
      }),
    songsPer: (...args: Parameters<Api["songsPer"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "songsPer", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).songsPer(...args),
      }),
    timePer: (...args: Parameters<Api["timePer"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "timePer", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).timePer(...args),
      }),
    featRatio: (...args: Parameters<Api["featRatio"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "featRatio", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).featRatio(...args),
      }),
    albumDateRatio: (...args: Parameters<Api["albumDateRatio"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "albumDateRatio", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).albumDateRatio(...args),
      }),
    bestArtistsPer: (...args: Parameters<Api["bestArtistsPer"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "bestArtistsPer", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).bestArtistsPer(...args),
      }),
    differentArtistsPer: (...args: Parameters<Api["differentArtistsPer"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "differentArtistsPer",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).differentArtistsPer(...args),
      }),
    timePerHourOfDay: (...args: Parameters<Api["timePerHourOfDay"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "timePerHourOfDay",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).timePerHourOfDay(...args),
      }),
    getAlbums: (...args: Parameters<Api["getAlbums"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getAlbums", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getAlbums(...args),
      }),
    getAlbumStats: (...args: Parameters<Api["getAlbumStats"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getAlbumStats", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getAlbumStats(...args),
      }),
    getAlbumRank: (...args: Parameters<Api["getAlbumRank"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getAlbumRank", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getAlbumRank(...args),
      }),
    getArtists: (...args: Parameters<Api["getArtists"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getArtists", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getArtists(...args),
      }),
    getArtistStats: (...args: Parameters<Api["getArtistStats"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getArtistStats", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getArtistStats(...args),
      }),
    getArtistRank: (...args: Parameters<Api["getArtistRank"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getArtistRank", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getArtistRank(...args),
      }),
    search: (...args: Parameters<Api["search"]>) =>
      queryOptions({
        enabled: args[0].length >= 3 && args[0].length <= 64,
        queryKey: [...client.queryKey, "listening", "search", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).search(...args),
      }),
    getBestSongs: (...args: Parameters<Api["getBestSongs"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getBestSongs", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getBestSongs(...args),
      }),
    getBestArtists: (...args: Parameters<Api["getBestArtists"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getBestArtists", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getBestArtists(...args),
      }),
    getBestAlbums: (...args: Parameters<Api["getBestAlbums"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getBestAlbums", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getBestAlbums(...args),
      }),
    collaborativeBestSongs: (
      ...args: Parameters<Api["collaborativeBestSongs"]>
    ) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "collaborativeBestSongs",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).collaborativeBestSongs(...args),
      }),
    collaborativeBestAlbums: (
      ...args: Parameters<Api["collaborativeBestAlbums"]>
    ) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "collaborativeBestAlbums",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).collaborativeBestAlbums(...args),
      }),
    collaborativeBestArtists: (
      ...args: Parameters<Api["collaborativeBestArtists"]>
    ) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "collaborativeBestArtists",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).collaborativeBestArtists(...args),
      }),
    getBestSongsOfHour: (...args: Parameters<Api["getBestSongsOfHour"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getBestSongsOfHour",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getBestSongsOfHour(...args),
      }),
    getBestAlbumsOfHour: (...args: Parameters<Api["getBestAlbumsOfHour"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getBestAlbumsOfHour",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getBestAlbumsOfHour(...args),
      }),
    getBestArtistsOfHour: (...args: Parameters<Api["getBestArtistsOfHour"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getBestArtistsOfHour",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getBestArtistsOfHour(...args),
      }),
    getTrackDetails: (...args: Parameters<Api["getTrackDetails"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getTrackDetails", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getTrackDetails(...args),
      }),
    getTrackStats: (...args: Parameters<Api["getTrackStats"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getTrackStats", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getTrackStats(...args),
      }),
    getTrackRank: (...args: Parameters<Api["getTrackRank"]>) =>
      queryOptions({
        queryKey: [...client.queryKey, "listening", "getTrackRank", ...args],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getTrackRank(...args),
      }),
    getLongestSessions: (...args: Parameters<Api["getLongestSessions"]>) =>
      queryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getLongestSessions",
          ...args,
        ],
        queryFn: ({ signal }) =>
          createListeningApi(client, signal).getLongestSessions(...args),
      }),
    getTracksInfinite: (start: Date, end: Date, pageSize = 20) => {
      if (!Number.isInteger(pageSize) || pageSize < 1)
        throw new Error("pageSize must be a positive integer.");
      return infiniteQueryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getTracks",
          "infinite",
          start,
          end,
          pageSize,
        ],
        initialPageParam: 0,
        queryFn: ({ signal, pageParam }) =>
          createListeningApi(client, signal).getTracks(
            start,
            end,
            pageSize,
            pageParam,
          ),
        getNextPageParam: (lastPage, _pages, offset) =>
          lastPage.length < pageSize ? undefined : offset + lastPage.length,
      });
    },
    getBestSongsInfinite: (start: Date, end: Date, pageSize = 20) => {
      if (!Number.isInteger(pageSize) || pageSize < 1)
        throw new Error("pageSize must be a positive integer.");
      return infiniteQueryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getBestSongs",
          "infinite",
          start,
          end,
          pageSize,
        ],
        initialPageParam: 0,
        queryFn: ({ signal, pageParam }) =>
          createListeningApi(client, signal).getBestSongs(
            start,
            end,
            pageSize,
            pageParam,
          ),
        getNextPageParam: (lastPage, _pages, offset) =>
          lastPage.length < pageSize ? undefined : offset + lastPage.length,
      });
    },
    getBestArtistsInfinite: (start: Date, end: Date, pageSize = 20) => {
      if (!Number.isInteger(pageSize) || pageSize < 1)
        throw new Error("pageSize must be a positive integer.");
      return infiniteQueryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getBestArtists",
          "infinite",
          start,
          end,
          pageSize,
        ],
        initialPageParam: 0,
        queryFn: ({ signal, pageParam }) =>
          createListeningApi(client, signal).getBestArtists(
            start,
            end,
            pageSize,
            pageParam,
          ),
        getNextPageParam: (lastPage, _pages, offset) =>
          lastPage.length < pageSize ? undefined : offset + lastPage.length,
      });
    },
    getBestAlbumsInfinite: (start: Date, end: Date, pageSize = 20) => {
      if (!Number.isInteger(pageSize) || pageSize < 1)
        throw new Error("pageSize must be a positive integer.");
      return infiniteQueryOptions({
        queryKey: [
          ...client.queryKey,
          "listening",
          "getBestAlbums",
          "infinite",
          start,
          end,
          pageSize,
        ],
        initialPageParam: 0,
        queryFn: ({ signal, pageParam }) =>
          createListeningApi(client, signal).getBestAlbums(
            start,
            end,
            pageSize,
            pageParam,
          ),
        getNextPageParam: (lastPage, _pages, offset) =>
          lastPage.length < pageSize ? undefined : offset + lastPage.length,
      });
    },
  };
}

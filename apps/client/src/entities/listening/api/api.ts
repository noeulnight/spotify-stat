import type { ApiClient } from "../../../shared/api";
import type { PlaybackAction, TrackLyrics } from "./types";
import type {
  Timesplit,
  Artist,
  Album,
  AlbumWithFullArtist,
  Track,
  TrackWithAlbum,
  TrackWithFullArtistAlbum,
  TrackInfoWithFullArtistAlbum,
  DateId,
  CollaborativeMode,
  ArtistStatsResponse,
  TrackStatsResponse,
  AlbumStatsResponse,
  CurrentlyPlayingResponse,
  ListeningSession,
  HourlyRanking,
} from "./types";

export function createListeningApi(client: ApiClient, signal?: AbortSignal) {
  const get = async <T>(
    url: string,
    params: Record<string, unknown> = {},
  ): Promise<T> => (await client.http.get<T>(url, { params, signal })).data;
  const ranking = async <T>(
    url: string,
    params: { start: Date; end: Date; nb: number; offset: number },
  ): Promise<T[]> => {
    if (!Number.isInteger(params.nb) || params.nb < 1 || params.nb > 50)
      throw new Error("Ranking count must be from 1 to 50");
    const first = await get<T[]>(url, {
      ...params,
      nb: Math.min(params.nb, 30),
    });
    if (params.nb <= 30 || first.length < 30) return first;
    const next = await get<T[]>(url, {
      ...params,
      nb: params.nb - 30,
      offset: params.offset + 30,
    });
    return [...first, ...next];
  };
  return {
    getLyrics: (id: string) =>
      get<TrackLyrics | null>(`/lyrics/${encodeURIComponent(id)}`),
    playTrack: async (id: string) => {
      await client.http.post("/spotify/play", { id }, { signal });
    },
    controlPlayback: async (action: PlaybackAction) => {
      await client.http.post(`/spotify/playback/${action}`, undefined, {
        signal,
      });
    },
    currentlyPlaying: () =>
      get<CurrentlyPlayingResponse | null>("/spotify/currently-playing"),
    getTracks: (start: Date, end: Date, number: number, offset: number) =>
      get<TrackInfoWithFullArtistAlbum[]>("/spotify/gethistory", {
        number,
        offset,
        start,
        end,
      }),
    mostListened: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<{ tracks: TrackWithAlbum[]; counts: number[] }[]>(
        "/spotify/most_listened",
        { start, end, timeSplit },
      ),
    mostListenedArtist: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<{ _id: DateId | undefined; artists: Artist[]; counts: number[] }[]>(
        "/spotify/most_listened_artist",
        { start, end, timeSplit },
      ),
    songsPer: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<{ count: number; _id: DateId | null; differents: number }[]>(
        "/spotify/songs_per",
        { start, end, timeSplit },
      ),
    timePer: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<{ count: number; _id: DateId | null }[]>("/spotify/time_per", {
        start,
        end,
        timeSplit,
      }),
    featRatio: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<
        {
          0: number;
          1: number;
          2: number;
          3: number;
          4: number;
          5: number;
          average: number;
          count: number;
          totalPeople: number;
          _id: DateId | null;
        }[]
      >("/spotify/feat_ratio", { start, end, timeSplit }),
    albumDateRatio: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<{ count: number; totalYear: number; _id: DateId | null }[]>(
        "/spotify/album_date_ratio",
        { start, end, timeSplit },
      ),
    bestArtistsPer: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<{ artists: Artist[]; counts: number[]; _id: DateId | null }[]>(
        "/spotify/best_artists_per",
        { start, end, timeSplit },
      ),
    differentArtistsPer: (start: Date, end: Date, timeSplit: Timesplit) =>
      get<{ differents: number; _id: DateId | null }[]>(
        "/spotify/different_artists_per",
        { start, end, timeSplit },
      ),
    timePerHourOfDay: (start: Date, end: Date) =>
      get<
        {
          // _id is the hour of the day
          _id: number;
          count: number;
        }[]
      >("/spotify/time_per_hour_of_day", { start, end }),
    getAlbums: (ids: string[]) =>
      get<Album[]>(`/album/${ids.map(encodeURIComponent).join(",")}`),
    getAlbumStats: (id: string) =>
      get<AlbumStatsResponse>(`/album/${encodeURIComponent(id)}/stats`),
    getAlbumRank: (id: string) =>
      get<{
        index: number;
        isMax: boolean;
        isMin: boolean;
        results: { id: string; count: number }[];
      }>(`/album/${encodeURIComponent(id)}/rank`),
    getArtists: (ids: string[]) =>
      get<Artist[]>(`/artist/${ids.map(encodeURIComponent).join(",")}`),
    getArtistStats: (id: string) =>
      get<ArtistStatsResponse | { code: "NEVER_LISTENED" }>(
        `/artist/${encodeURIComponent(id)}/stats`,
      ),
    getArtistRank: (id: string) =>
      get<{
        index: number;
        isMax: boolean;
        isMin: boolean;
        results: { id: string; count: number }[];
      }>(`/artist/${encodeURIComponent(id)}/rank`),
    search: (str: string) =>
      get<{
        artists: Artist[];
        tracks: TrackWithFullArtistAlbum[];
        albums: AlbumWithFullArtist[];
      }>(`/search/${encodeURIComponent(str)}`),
    getBestSongs: (start: Date, end: Date, nb: number, offset: number) =>
      ranking<{
        count: number;
        duration_ms: number;
        total_count: number;
        total_duration_ms: number;
        album: Album;
        artist: Artist;
        track: Track;
      }>("/spotify/top/songs", { start, end, nb, offset }),
    getBestArtists: (start: Date, end: Date, nb: number, offset: number) =>
      ranking<{
        count: number;
        duration_ms: number;
        total_count: number;
        total_duration_ms: number;
        artist: Artist;
        differents: number;
      }>("/spotify/top/artists", { start, end, nb, offset }),
    getBestAlbums: (start: Date, end: Date, nb: number, offset: number) =>
      ranking<{
        count: number;
        duration_ms: number;
        total_count: number;
        total_duration_ms: number;
        artist: Artist;
        album: Album;
      }>("/spotify/top/albums", { start, end, nb, offset }),
    collaborativeBestSongs: (
      ids: string[],
      start: Date,
      end: Date,
      mode: CollaborativeMode,
    ) =>
      get<
        ({ track: Track; album: Album; artist: Artist } & Record<
          string,
          number
        >)[]
      >("/spotify/collaborative/top/songs", {
        otherIds: ids,
        start,
        end,
        mode,
      }),
    collaborativeBestAlbums: (
      ids: string[],
      start: Date,
      end: Date,
      mode: CollaborativeMode,
    ) =>
      get<({ album: Album; artist: Artist } & Record<string, number>)[]>(
        "/spotify/collaborative/top/albums",
        { otherIds: ids, start, end, mode },
      ),
    collaborativeBestArtists: (
      ids: string[],
      start: Date,
      end: Date,
      mode: CollaborativeMode,
    ) =>
      get<({ artist: Artist } & Record<string, number>)[]>(
        "/spotify/collaborative/top/artists",
        { otherIds: ids, start, end, mode },
      ),
    getBestSongsOfHour: (start: Date, end: Date) =>
      get<HourlyRanking[]>("/spotify/top/hour-repartition/songs", {
        start,
        end,
      }),
    getBestAlbumsOfHour: (start: Date, end: Date) =>
      get<HourlyRanking[]>("/spotify/top/hour-repartition/albums", {
        start,
        end,
      }),
    getBestArtistsOfHour: (start: Date, end: Date) =>
      get<HourlyRanking[]>("/spotify/top/hour-repartition/artists", {
        start,
        end,
      }),
    getTrackDetails: (ids: string[]) =>
      get<Track[]>(`/track/${ids.map(encodeURIComponent).join(",")}`),
    getTrackStats: (id: string) =>
      get<TrackStatsResponse | { code: "NEVER_LISTENED" }>(
        `/track/${encodeURIComponent(id)}/stats`,
      ),
    getTrackRank: (id: string) =>
      get<{
        index: number;
        isMax: boolean;
        isMin: boolean;
        results: { id: string; count: number }[];
      }>(`/track/${encodeURIComponent(id)}/rank`),
    getLongestSessions: (start: Date, end: Date, nb = 30) =>
      get<ListeningSession[]>("/spotify/top/sessions", { start, end, nb }),
  };
}

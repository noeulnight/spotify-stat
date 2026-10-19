export enum Timesplit {
  all = "all",
  hour = "hour",
  day = "day",
  week = "week",
  month = "month",
  year = "year",
}
export const isTimesplit = (str: string | null): str is Timesplit => {
  if (!str) {
    return false;
  }
  return Object.values(Timesplit).includes(str as Timesplit);
};

export enum Precision {
  hour = "hour",
  day = "day",
  week = "week",
  month = "month",
  year = "year",
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Artist {
  _id: string;
  external_urls: Record<string, string>;
  genres: string[];
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  type: string;
  uri: string;
}

export interface Album {
  _id: string;
  album_type: string;
  artists: string[];
  copyrights: unknown[];
  external_urls: Record<string, string>;
  genres: string[];
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  release_date_precision: string;
  //  "tracks": ,
  type: string;
  uri: string;
}

export type AlbumWithFullArtist = Album & { full_artists: Array<Artist> };

export interface Track {
  _id: string;
  album: string; // Id of the album
  artists: string[]; // Ids of artists
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_urls: object;
  href: string;
  id: string;
  is_local: boolean;
  name: string;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
}

export type TrackWithAlbum = Omit<Track, "album"> & { album: Album };

export type TrackWithFullAlbum = Track & { full_album: Album };

export type TrackWithFullArtistAlbum = TrackWithFullAlbum & {
  full_artists: Array<Artist>;
};

export interface TrackInfo {
  _id: string;
  owner: string;
  id: string;
  played_at: string;
  durationMs: number;
  albumId: string;
  primaryArtistId: string;
  artists: string[];
}

export type TrackInfoWithFullArtistAlbum = TrackInfo & {
  track: Track & { full_album: Album; full_artists: Artist[] };
};

export interface DateId {
  year: number;
  month?: number;
  day?: number;
  hour?: number;
}

export enum CollaborativeMode {
  AVERAGE = "average",
  MINIMA = "minima",
}

export interface ListeningActivityData {
  months: { month: string; count: number }[];
  recent: { count: number; previousCount: number; through: string };
  listeningDays: number;
  longestStreak: number;
  peakDay: { date: string; count: number } | null;
}

export type ArtistStatsResponse = {
  activity?: ListeningActivityData;
  artist: Artist;
  bestPeriod: {
    _id: DateId;
    artist: {
      _id: string;
      artistInfos: { _id: string; trackId: string; artistId: string };
      year: number;
      month: number;
      day: number;
      week: number;
      hour: number;
    };
    count: number;
    total: number;
  }[];
  firstLast: {
    first: TrackInfo & {
      artistInfos: { _id: string; trackId: string; artistId: string };
      track: TrackWithAlbum;
    };
    last: TrackInfo & {
      artistInfos: { _id: string; trackId: string; artistId: string };
      track: TrackWithAlbum;
    };
  };
  mostListened: { _id: string; count: number; track: TrackWithAlbum }[];
  albumMostListened: { _id: string; count: number; album: Album }[];
  total: {
    count: number;
    durationMs?: number;
    differents?: number;
    albums?: number;
  };
  dayRepartition: { _id: number; count: number; duration: number }[];
};

export type TrackStatsResponse = {
  activity?: ListeningActivityData;
  artistPlayCount?: number;
  track: Track;
  artist: Artist;
  album: Album;
  bestPeriod: { _id: DateId; count: number; total: number }[];
  firstLast: { first: TrackInfo; last: TrackInfo };
  recentHistory: TrackInfo[];
  total: { count: number; durationMs?: number };
};

export type AlbumStatsResponse = {
  total?: { count: number; durationMs?: number; differents?: number };
  album: Album;
  artists: Artist[];
  tracks: { _id: string; track: Track; count: number }[];
  firstLast?: {
    first: TrackInfo & { track: Track };
    last: TrackInfo & { track: Track };
  };
};

export interface CurrentlyPlayingResponse {
  isPlaying: boolean;
  progressMs: number;
  fetchedAt: number;
  track: { id: string; name: string; uri: string; durationMs: number };
  album: { id: string; name: string; imageUrl: string | null };
  artists: { id: string; name: string }[];
}

export interface TrackLyrics {
  id: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export interface ListeningSession {
  sessionLength: number;
  startedAt: string;
  endedAt: string;
  full_tracks: Record<string, Track>;
  distanceToLast: {
    distance: {
      subtract: number;
      info: Pick<
        TrackInfo,
        "_id" | "id" | "albumId" | "played_at" | "durationMs"
      >;
    }[];
  };
}

export interface HourlyRanking {
  hour: number;
  total: number;
  items: { itemId: string; total: number }[];
  full_items: Record<string, { id: string; name: string }>;
}
export type PlaybackAction = "resume" | "pause" | "next" | "previous";

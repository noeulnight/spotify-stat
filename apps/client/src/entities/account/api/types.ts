export type DarkModeType = "light" | "dark" | "follow";
export interface User {
  username: string;
  admin: boolean;
  _id: string;
  id: string;
  expiresIn: number;
  accessToken: string | null;
  refreshToken: string | null;
  lastTimestamp: number;
  tracks?: string[];
  settings: {
    historyLine: boolean;
    preferredStatsPeriod: string;
    nbElements: number;
    metricUsed: "number" | "duration";
    darkMode: DarkModeType;
    timezone: string | null | undefined;
    dateFormat: string;
    blacklistedArtists: string[] | undefined;
  };
  publicToken: string | null;
  firstListenedAt: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  admin: boolean;
  firstListenedAt: string;
}

export interface GlobalPreferences {
  allowRegistrations: boolean;
  allowAffinity: boolean;
}
export interface SpotifyMe {
  country: string;
  display_name: string;
  email: string;
  href: string;
  id: string;
  images: { url: string; height: number; width: number }[];
  product: string;
  type: string;
  uri: string;
}

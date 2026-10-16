export const previewKinds = {
  songs: { label: "Song", spotifyType: "track" },
  albums: { label: "Album", spotifyType: "album" },
  artists: { label: "Artist", spotifyType: "artist" },
} as const;

export type PreviewKind = keyof typeof previewKinds;
export interface Preview {
  title: string;
  subtitle: string;
  image?: string;
  available: boolean;
  tags?: string[];
  metrics?: { label: string; value: string }[];
}

export function isPreviewKind(kind: string | undefined): kind is PreviewKind {
  return !!kind && Object.hasOwn(previewKinds, kind);
}

export function previewImageUrl(
  origin: URL,
  kind: PreviewKind,
  id: string,
  publicToken?: string,
) {
  const url = new URL(`/og/${kind}/${encodeURIComponent(id)}.png`, origin);
  if (publicToken) url.searchParams.set("token", publicToken);
  return url.href;
}

export function isSpotifyImage(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      ["scdn.co", "spotifycdn.com"].some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}

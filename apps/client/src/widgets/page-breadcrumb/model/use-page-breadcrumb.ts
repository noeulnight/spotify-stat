import { useAccount } from "../../../entities/account";
import { useAlbums, useArtists, useTracks } from "../../../entities/listening";
import { useApiRuntime } from "../../../shared/api";

export function usePageBreadcrumb(activePath: string, publicToken?: string) {
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  const path =
    (prefix ? activePath.slice(prefix.length) : activePath).replace(
      /\/$/,
      "",
    ) || "/";
  const match = /^\/artists\/([^/]+)$/.exec(path);
  const id = match ? decodeURIComponent(match[1]!) : undefined;
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const artist = useArtists(
    client,
    id ? [id] : [],
    Boolean(id && account.data?.status),
    queryClient,
  );

  const songMatch = /^\/songs\/([^/]+)$/.exec(path);
  const songId = songMatch ? decodeURIComponent(songMatch[1]!) : undefined;
  const song = useTracks(
    client,
    songId ? [songId] : [],
    Boolean(songId && account.data?.status),
    queryClient,
  );
  const albumMatch = /^\/albums\/([^/]+)$/.exec(path);
  const albumId = albumMatch ? decodeURIComponent(albumMatch[1]!) : undefined;
  const album = useAlbums(
    client,
    albumId ? [albumId] : [],
    Boolean(albumId && account.data?.status),
    queryClient,
  );
  if (albumId)
    return [
      { label: "Albums", href: `${prefix}/top/albums` },
      { label: album.data?.[0]?.name ?? "Album" },
    ];

  if (songId)
    return [
      { label: "Songs", href: `${prefix}/top/songs` },
      { label: song.data?.[0]?.name ?? "Song" },
    ];

  if (id)
    return [
      { label: "Artists", href: `${prefix}/top/artists` },
      { label: artist.data?.[0]?.name ?? "Artist" },
    ];

  if (path === "/stats") return [{ label: "Stats" }];
  if (path === "/recent") return [{ label: "Recent" }];
  if (path === "/now-playing") return [{ label: "Now playing" }];
  if (path === "/recommendations") return [{ label: "Recommendations" }];
  if (path === "/settings") return [{ label: "Settings" }];
  if (path === "/registrations-disabled")
    return [{ label: "Registrations closed" }];

  if (path === "/longest-session") return [{ label: "Longest session" }];

  const labels: Record<string, string> = {
    "/top/songs": "Songs",
    "/top/albums": "Albums",
    "/top/artists": "Artists",
  };
  return labels[path]
    ? [{ label: "Top" }, { label: labels[path] }]
    : [{ label: "Home" }];
}

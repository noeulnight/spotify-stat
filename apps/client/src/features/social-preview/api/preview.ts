import axios from "axios";
import { createApiClient } from "../../../shared/api/client";
import { createListeningApi } from "../../../entities/listening";
import { previewKinds, type Preview, type PreviewKind } from "../model/preview";

import {
  getAlbumMetrics,
  getArtistMetrics,
  getSongMetrics,
} from "../model/metrics";

export async function loadPreview(
  kind: PreviewKind,
  id: string,
  origin: URL,
  publicToken?: string,
): Promise<Preview> {
  const fallback = {
    title: previewKinds[kind].label,
    subtitle: "",
    available: false,
  };
  if (!/^[a-zA-Z0-9]{22}$/.test(id)) return fallback;

  try {
    if (!publicToken) {
      const { data } = await axios.get("https://open.spotify.com/oembed", {
        params: {
          url: `https://open.spotify.com/${previewKinds[kind].spotifyType}/${id}`,
        },
        timeout: 4000,
        maxContentLength: 100_000,
      });
      if (typeof data.title !== "string" || !data.title) return fallback;
      return {
        title: data.title,
        subtitle: "",
        image:
          typeof data.thumbnail_url === "string"
            ? data.thumbnail_url
            : undefined,
        available: true,
      };
    }

    const configuredBase =
      process.env.API_BASE_URL ||
      import.meta.env?.API_BASE_URL ||
      (import.meta.env?.DEV
        ? "http://127.0.0.1:8080"
        : import.meta.env?.PUBLIC_API_BASE_URL);
    if (!configuredBase) return fallback;
    const client = createApiClient({
      baseURL: new URL(configuredBase, origin).href,
      publicToken,
    });
    client.http.defaults.timeout = 4000;
    const api = createListeningApi(client, AbortSignal.timeout(5000));

    if (kind === "artists") {
      const [[artist], stats] = await Promise.all([
        api.getArtists([id]),
        api.getArtistStats(id).catch(() => undefined),
      ]);
      return artist
        ? {
            title: artist.name,
            subtitle: "",
            image: artist.images?.[0]?.url,
            available: true,
            tags: artist.genres?.slice(0, 4),
            metrics:
              stats && !("code" in stats) ? getArtistMetrics(stats) : undefined,
          }
        : fallback;
    }

    const [item] =
      kind === "songs"
        ? await api.getTrackDetails([id])
        : await api.getAlbums([id]);
    if (!item) return fallback;
    const [artists, albums, stats] = await Promise.all([
      item.artists.length ? api.getArtists(item.artists) : [],
      "album" in item ? api.getAlbums([item.album]) : [],
      (kind === "songs" ? api.getTrackStats(id) : api.getAlbumStats(id)).catch(
        () => undefined,
      ),
    ]);
    return {
      title: item.name,
      subtitle: artists.map((artist) => artist.name).join(", "),
      image: ("images" in item ? item.images : albums[0]?.images)?.[0]?.url,
      available: true,
      tags:
        "album" in item
          ? [albums[0]?.name, albums[0]?.release_date].filter(
              (value): value is string => !!value,
            )
          : [item.release_date].filter(Boolean),
      metrics:
        stats && !("code" in stats)
          ? "tracks" in stats
            ? getAlbumMetrics(stats)
            : getSongMetrics(stats)
          : undefined,
    };
  } catch {
    return fallback;
  }
}

import { Router } from "express";
import { z } from "zod";

import { getArtists, getTracks } from "../database";
import { getAlbums } from "../database/queries/album";
import { lyricsCache } from "../database/queries/lyrics";
import {
  LyricsUnavailable,
  resolveLyricsSignature,
} from "../tools/apis/lyrics";
import { logger } from "../tools/logger";
import {
  admin,
  logged,
  isLoggedOrGuest,
  validate,
  withHttpClient,
} from "../tools/middleware";
import type { SpotifyRequest } from "../tools/types";

export const router = Router();
const params = z.object({ id: z.string().min(1).max(128) });

router.delete("/cache", logged, admin, async (_req, res) => {
  await lyricsCache.clear();
  res.status(204).end();
});

router.get("/:id", isLoggedOrGuest, withHttpClient, async (req, res) => {
  const { id } = validate(req.params, params);
  try {
    const lyrics = await lyricsCache.get(id, async () => {
      const [track] = await getTracks([id]);
      const [[artist], [album]] = track
        ? await Promise.all([
            getArtists(track.artists.slice(0, 1)),
            getAlbums([track.album]),
          ])
        : [[], []];
      return resolveLyricsSignature(
        id,
        track && artist
          ? {
              trackName: track.name,
              artistName: artist.name,
              albumName: album?.name ?? "",
              durationMs: track.duration_ms,
            }
          : null,
        () => (req as SpotifyRequest).client.currentlyPlaying(),
      );
    });
    res.json(lyrics);
  } catch (error) {
    logger.warn("Lyrics lookup failed", {
      trackId: id,
      reason:
        error instanceof LyricsUnavailable
          ? error.reason
          : error instanceof Error
            ? error.name
            : "UNKNOWN",
    });
    res.setHeader(
      "Retry-After",
      error instanceof LyricsUnavailable ? error.retryAfter : 1,
    );
    res.status(503).json({ code: "LYRICS_UNAVAILABLE" });
  }
});

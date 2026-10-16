import { Router } from "express";
import { z } from "zod";

import { getArtists, getTracks } from "../database";
import { getAlbums } from "../database/queries/album";
import {
  getLyrics,
  LyricsUnavailable,
  resolveLyricsSignature,
} from "../tools/apis/lyrics";
import { isLoggedOrGuest, validate, withHttpClient } from "../tools/middleware";
import type { SpotifyRequest } from "../tools/types";

export const router = Router();
const params = z.object({ id: z.string().min(1).max(128) });

router.get("/:id", isLoggedOrGuest, withHttpClient, async (req, res) => {
  const { id } = validate(req.params, params);
  const [track] = await getTracks([id]);
  const [[artist], [album]] = track
    ? await Promise.all([
        getArtists(track.artists.slice(0, 1)),
        getAlbums([track.album]),
      ])
    : [[], []];
  try {
    const signature = await resolveLyricsSignature(
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
    if (!signature) {
      res.json(null);
      return;
    }
    const lyrics = await getLyrics(signature);
    res.json(lyrics);
  } catch (error) {
    res.setHeader(
      "Retry-After",
      error instanceof LyricsUnavailable ? error.retryAfter : 1,
    );
    res.status(503).json({ code: "LYRICS_UNAVAILABLE" });
  }
});

import { Router } from "express";
import { z } from "zod";

import { getArtists, getTracks } from "../database";
import { getAlbums } from "../database/queries/album";
import { getLyrics, LyricsUnavailable } from "../tools/apis/lyrics";
import { isLoggedOrGuest, validate } from "../tools/middleware";

export const router = Router();
const params = z.object({ id: z.string().min(1).max(128) });

router.get("/:id", isLoggedOrGuest, async (req, res) => {
  const { id } = validate(req.params, params);
  const [track] = await getTracks([id]);
  if (!track) {
    res.status(404).end();
    return;
  }
  const [[artist], [album]] = await Promise.all([
    getArtists(track.artists.slice(0, 1)),
    getAlbums([track.album]),
  ]);
  if (!artist) {
    res.json(null);
    return;
  }
  try {
    const lyrics = await getLyrics({
      trackName: track.name,
      artistName: artist.name,
      albumName: album?.name ?? "",
      durationMs: track.duration_ms,
    });
    res.json(lyrics);
  } catch (error) {
    res.setHeader(
      "Retry-After",
      error instanceof LyricsUnavailable ? error.retryAfter : 1,
    );
    res.status(503).json({ code: "LYRICS_UNAVAILABLE" });
  }
});

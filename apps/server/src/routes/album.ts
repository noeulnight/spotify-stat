import { Router } from "express";
import { z } from "zod";

import { getArtists, getRankOf, ItemType } from "../database";
import { getAlbums, getAlbumStatsData } from "../database/queries/album";
import { isLoggedOrGuest, validate } from "../tools/middleware";
import { LoggedRequest } from "../tools/types";

export const router = Router();

const getAlbumsSchema = z.object({ ids: z.string() });

router.get("/:ids", isLoggedOrGuest, async (req, res) => {
  const { ids } = validate(req.params, getAlbumsSchema);
  const albums = await getAlbums(ids.split(","));
  if (!albums || albums.length === 0) {
    res.status(404).end();
    return;
  }
  res.status(200).send(albums);
});

const getAlbumStats = z.object({ id: z.string() });

router.get("/:id/stats", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { id } = validate(req.params, getAlbumStats);
  const [album] = await getAlbums([id]);
  if (!album) {
    res.status(404).end();
    return;
  }
  const [stats, artists] = await Promise.all([
    getAlbumStatsData(user, id),
    getArtists(album.artists),
  ]);
  res.status(200).send({ album, artists, ...stats });
});

router.get("/:id/rank", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { id } = validate(req.params, getAlbumStats);
  const [album] = await getAlbums([id]);
  if (!album) {
    res.status(404).end();
    return;
  }
  const rank = await getRankOf(ItemType.album, user, id);
  res.status(200).send(rank);
});

import { Router, type Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import {
  RecommendationModel,
  RecommendationRateModel,
  UserModel,
} from "../database/Models";
import type { SpotifyTrack } from "../database/schemas/track";
import { HttpError } from "../tools/apis/queueHttpClient";
import { SpotifyAPI } from "../tools/apis/spotifyApi";
import { logged, validate } from "../tools/middleware";
import { LoggedRequest } from "../tools/types";

export const router = Router();
let uniqueIndex: Promise<string> | undefined;
const bodySchema = z.object({
  trackId: z.string().regex(/^[A-Za-z0-9]{22}$/),
  name: z.string().trim().max(40).default(""),
  message: z.string().trim().max(300).default(""),
});
const pageSchema = z.object({
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

// Resolve the recipient from the path, never from a visitor's login cookie.
router.param("recipient", async (req, res, next, recipient) => {
  const value = validate(
    { recipient },
    z.object({ recipient: z.string().min(1).max(128) }),
  );
  const user = await UserModel.findOne({ publicToken: value.recipient })
    .select("_id settings.recommendationsEnabled")
    .lean();
  if (!user) {
    res.status(404).send({ code: "SHARE_UNAVAILABLE" });
    return;
  }
  if (user.settings?.recommendationsEnabled === false) {
    res.setHeader("Cache-Control", "private, no-store");
    res.status(403).send({ code: "RECOMMENDATIONS_DISABLED" });
    return;
  }
  res.locals.recipientId = user._id;
  next();
});

async function allowRequest(
  owner: Types.ObjectId,
  action: "send" | "search",
  res: Response,
) {
  const period = action === "send" ? 3_600_000 : 60_000;
  const bucket = Math.floor(Date.now() / period);
  const id =
    action === "send" ? `${owner}:${bucket}` : `search:${owner}:${bucket}`;
  const limit = await RecommendationRateModel.findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * period) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (limit.count <= (action === "send" ? 30 : 60)) return true;
  res.setHeader(
    "Retry-After",
    Math.max(1, Math.ceil(((bucket + 1) * period - Date.now()) / 1000)),
  );
  res.status(429).send({ code: "RECOMMENDATION_LIMIT" });
  return false;
}

function spotifyError(error: unknown, res: Response) {
  if (error instanceof HttpError && error.status === 429) {
    res.setHeader("Retry-After", 60);
    res.status(429).send({ code: "SPOTIFY_LIMIT" });
  } else {
    res.status(503).send({ code: "SPOTIFY_UNAVAILABLE" });
  }
}

router.get("/:recipient/search", async (req, res) => {
  const { q } = validate(
    req.query,
    z.object({ q: z.string().trim().min(1).max(100) }),
  );
  const owner = res.locals.recipientId as Types.ObjectId;
  if (!(await allowRequest(owner, "search", res))) return;
  let tracks: SpotifyTrack[];
  try {
    tracks = await new SpotifyAPI(owner.toString()).searchTracks(q);
  } catch (error) {
    spotifyError(error, res);
    return;
  }
  const existing = await RecommendationModel.find({
    owner,
    trackId: { $in: tracks.map((track) => track.id) },
  })
    .select("trackId")
    .lean();
  const recommended = new Set(existing.map((row) => row.trackId));
  res.setHeader("Cache-Control", "private, no-store");
  res.send(
    tracks.map((track) => ({
      id: track.id,
      title: track.name,
      artists: track.artists.map((artist) => artist.name),
      imageUrl: track.album.images[0]?.url ?? null,
      recommended: recommended.has(track.id),
    })),
  );
});

router.post("/:recipient", async (req, res) => {
  const body = validate(req.body, bodySchema);
  const owner = res.locals.recipientId as Types.ObjectId;
  if (!(await allowRequest(owner, "send", res))) return;
  if (await RecommendationModel.exists({ owner, trackId: body.trackId })) {
    res.status(409).send({ code: "ALREADY_RECOMMENDED" });
    return;
  }
  let track: SpotifyTrack;
  try {
    track = (
      await new SpotifyAPI(owner.toString()).raw(`/tracks/${body.trackId}`)
    ).data as SpotifyTrack;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404)
      res.status(400).send({ code: "INVALID_TRACK" });
    else spotifyError(error, res);
    return;
  }
  try {
    // Enforce uniqueness before writes, including when automatic indexing is disabled.
    uniqueIndex ??= RecommendationModel.collection
      .createIndex({ owner: 1, trackId: 1 }, { unique: true })
      .catch((error: unknown) => {
        uniqueIndex = undefined;
        throw error;
      });
    await uniqueIndex;
    await RecommendationModel.create({
      ...body,
      owner,
      title: track.name,
      artists: track.artists.map((artist) => artist.name),
      imageUrl: track.album.images[0]?.url ?? null,
    });
    res.status(201).send({ status: true });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    res.status(409).send({ code: "ALREADY_RECOMMENDED" });
  }
});

async function listRecommendations(owner: Types.ObjectId, offset: number) {
  const rows = await RecommendationModel.aggregate([
    { $match: { owner } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: offset },
    { $limit: 20 },
    {
      $lookup: {
        from: "tracks",
        localField: "trackId",
        foreignField: "id",
        as: "tracks",
      },
    },
    { $project: { owner: 0 } },
  ]);
  return rows.map(({ tracks, ...row }) => ({
    ...row,
    title: row.title ?? tracks[0]?.name ?? null,
    artists: row.artists ?? [],
    imageUrl: row.imageUrl ?? null,
  }));
}

router.get("/", logged, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { offset } = validate(req.query, pageSchema);
  res.setHeader("Cache-Control", "private, no-store");
  res.send(await listRecommendations(user._id, offset));
});

router.get("/:recipient", async (req, res) => {
  const { offset } = validate(req.query, pageSchema);
  const rows = await listRecommendations(
    res.locals.recipientId as Types.ObjectId,
    offset,
  );
  res.setHeader("Cache-Control", "private, no-store");
  // Visitor lists contain songs only; names and messages stay in the owner inbox.
  res.send(
    rows.map(({ trackId, title, artists, imageUrl, createdAt }) => ({
      trackId,
      title,
      artists,
      imageUrl,
      createdAt,
    })),
  );
});

router.delete("/:id", logged, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { id } = validate(
    req.params,
    z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }),
  );
  const result = await RecommendationModel.deleteOne({
    _id: new Types.ObjectId(id),
    owner: user._id,
  });
  res.status(result.deletedCount ? 204 : 404).end();
});

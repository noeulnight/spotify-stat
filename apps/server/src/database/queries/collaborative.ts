import mongoose, { PipelineStage } from "mongoose";

import { InfosModel } from "../Models";
import {
  basicMatchUsers,
  lightAlbumLookupPipeline,
  lightArtistLookupPipeline,
  lightTrackLookupPipeline,
} from "./statsTools";

export enum CollaborativeMode {
  AVERAGE = "average",
  MINIMA = "minima",
}

function valueForUser(objectField: string, userId: string) {
  return {
    $ifNull: [{ $getField: { field: userId, input: `$${objectField}` } }, 0],
  };
}

function collaborativePipeline(
  userIds: string[],
  start: Date,
  end: Date,
  itemField: string,
  mode: CollaborativeMode,
  limit: number,
): PipelineStage[] {
  const users = userIds.map((id) => new mongoose.Types.ObjectId(id));
  const dynamicFields = userIds.flatMap((userId) => [
    { k: userId, v: valueForUser("counts", userId) },
    { k: `total_${userId}`, v: valueForUser("totals", userId) },
    { k: `percent_${userId}`, v: valueForUser("percents", userId) },
  ]);
  const percentValues = userIds.map((userId) =>
    valueForUser("percents", userId),
  );

  return [
    { $match: basicMatchUsers(users, start, end) },
    {
      $group: {
        _id: { owner: "$owner", itemId: itemField },
        count: { $sum: 1 },
      },
    },
    {
      $setWindowFields: {
        partitionBy: "$_id.owner",
        output: { total: { $sum: "$count" } },
      },
    },
    {
      $addFields: {
        percent: {
          $cond: [{ $gt: ["$total", 0] }, { $divide: ["$count", "$total"] }, 0],
        },
      },
    },
    {
      $group: {
        _id: "$_id.itemId",
        stats: {
          $push: {
            owner: "$_id.owner",
            count: "$count",
            total: "$total",
            percent: "$percent",
          },
        },
      },
    },
    {
      $addFields: {
        counts: {
          $arrayToObject: {
            $map: {
              input: "$stats",
              as: "stat",
              in: { k: { $toString: "$$stat.owner" }, v: "$$stat.count" },
            },
          },
        },
        totals: {
          $arrayToObject: {
            $map: {
              input: "$stats",
              as: "stat",
              in: { k: { $toString: "$$stat.owner" }, v: "$$stat.total" },
            },
          },
        },
        percents: {
          $arrayToObject: {
            $map: {
              input: "$stats",
              as: "stat",
              in: { k: { $toString: "$$stat.owner" }, v: "$$stat.percent" },
            },
          },
        },
      },
    },
    {
      $addFields: {
        average_percents: { $divide: [{ $sum: percentValues }, users.length] },
        minima: { $min: percentValues },
      },
    },
    {
      $replaceWith: {
        $mergeObjects: [
          "$$ROOT",
          { $arrayToObject: { $concatArrays: [dynamicFields] } },
        ],
      },
    },
    { $unset: ["stats", "counts", "totals", "percents"] },
    {
      $sort: {
        [mode === CollaborativeMode.AVERAGE ? "average_percents" : "minima"]:
          -1,
        _id: 1,
      },
    },
    { $limit: limit },
  ];
}

export const getCollaborativeBestSongs = (
  users: string[],
  start: Date,
  end: Date,
  mode: CollaborativeMode,
  limit: number,
) =>
  InfosModel.aggregate([
    ...collaborativePipeline(users, start, end, "$id", mode, limit),
    { $lookup: lightTrackLookupPipeline("_id") },
    { $unwind: "$track" },
    { $lookup: lightAlbumLookupPipeline() },
    { $unwind: "$album" },
    { $lookup: lightArtistLookupPipeline() },
    { $unwind: "$artist" },
  ]);

export const getCollaborativeBestAlbums = (
  users: string[],
  start: Date,
  end: Date,
  mode: CollaborativeMode,
) =>
  InfosModel.aggregate([
    ...collaborativePipeline(users, start, end, "$albumId", mode, 50),
    { $lookup: lightAlbumLookupPipeline("_id") },
    { $unwind: "$album" },
    { $lookup: lightArtistLookupPipeline("album.artists") },
    { $unwind: "$artist" },
  ]);

export const getCollaborativeBestArtists = (
  users: string[],
  start: Date,
  end: Date,
  mode: CollaborativeMode,
) =>
  InfosModel.aggregate([
    ...collaborativePipeline(users, start, end, "$primaryArtistId", mode, 50),
    { $lookup: lightArtistLookupPipeline("_id", false) },
    { $unwind: "$artist" },
  ]);

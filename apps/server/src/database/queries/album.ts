import { AlbumModel, InfosModel } from "../Models";
import { User } from "../schemas/user";
import { searchCatalogIds } from "./catalogSearch";

export const getAlbums = (albumsId: string[]) =>
  AlbumModel.find({ id: { $in: albumsId } });

export const searchAlbum = async (str: string, limit = 20) => {
  const ids = await searchCatalogIds("album", str, limit);
  return AlbumModel.find({ id: { $in: ids } }).populate("full_artists");
};

export const getAlbumInfos = (albumId: string) => [
  {
    $lookup: {
      from: "tracks",
      let: { targetId: "$id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$album", albumId] },
                { $eq: ["$id", "$$targetId"] },
              ],
            },
          },
        },
        { $project: { trackId: "$id", albumId: "$album" } },
      ],
      as: "albumInfos",
    },
  },
  { $match: { "albumInfos.albumId": { $exists: true } } },
  { $unwind: "$albumInfos" },
];

export const getFirstAndLastListenedAlbum = async (
  user: User,
  albumId: string,
) => {
  const res = await InfosModel.aggregate([
    { $match: { owner: user._id, albumId: albumId } },
    ...getAlbumInfos(albumId),
    { $sort: { played_at: 1, _id: 1 } },
    {
      $group: {
        _id: null,
        first: { $first: "$$ROOT" },
        last: { $last: "$$ROOT" },
      },
    },
    ...["first", "last"]
      .map((e) => [
        {
          $lookup: {
            from: "tracks",
            localField: `${e}.albumInfos.trackId`,
            foreignField: "id",
            as: `${e}.track`,
          },
        },
        { $unwind: `$${e}.track` },
      ])
      .flat(1),
  ]);
  return res[0];
};

export const getAlbumSongs = async (user: User, albumId: string) => {
  const res = await InfosModel.aggregate([
    { $match: { owner: user._id, albumId: albumId } },
    ...getAlbumInfos(albumId),
    { $group: { _id: "$id", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    {
      $lookup: {
        from: "tracks",
        localField: "_id",
        foreignField: "id",
        as: "track",
      },
    },
    { $unwind: "$track" },
  ]);
  return res;
};

export const getAlbumStatsData = async (user: User, albumId: string) => {
  const [result] = await InfosModel.aggregate([
    { $match: { owner: user._id, albumId } },
    {
      $facet: {
        total: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              durationMs: { $sum: "$durationMs" },
              trackIds: { $addToSet: "$id" },
            },
          },
          {
            $project: {
              _id: 0,
              count: 1,
              durationMs: 1,
              differents: { $size: "$trackIds" },
            },
          },
        ],
        firstLast: [
          { $sort: { played_at: 1, _id: 1 } },
          {
            $group: {
              _id: null,
              first: { $first: "$$ROOT" },
              last: { $last: "$$ROOT" },
            },
          },
          ...["first", "last"].flatMap((field) => [
            {
              $lookup: {
                from: "tracks",
                localField: `${field}.id`,
                foreignField: "id",
                as: `${field}.track`,
              },
            },
            { $unwind: `$${field}.track` },
          ]),
        ],
        tracks: [
          { $group: { _id: "$id", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          {
            $lookup: {
              from: "tracks",
              localField: "_id",
              foreignField: "id",
              as: "track",
            },
          },
          { $unwind: "$track" },
        ],
      },
    },
    {
      $project: {
        firstLast: { $arrayElemAt: ["$firstLast", 0] },
        tracks: 1,
        total: {
          $ifNull: [
            { $arrayElemAt: ["$total", 0] },
            { count: 0, durationMs: 0, differents: 0 },
          ],
        },
      },
    },
  ]);
  return result;
};

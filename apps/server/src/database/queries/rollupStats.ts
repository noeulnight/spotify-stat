import { PipelineStage } from "mongoose";

import { Timesplit } from "../../tools/types";
import {
  InfosModel,
  StatsHourlyEntityModel,
  StatsHourlySummaryModel,
  StatsLifetimeEntityModel,
  StatsYearlyEntityModel,
} from "../Models";
import { statsRollupsReady } from "../rollups";
import { User } from "../schemas/user";
import {
  bestArtistLookupStages,
  getGroupingByTimeSplit,
  getTrackSortType,
  lightAlbumLookupPipeline,
  lightTrackLookupPipeline,
  sortByTimeSplit,
} from "./statsTools";

function localTimeParts(date: Date, timezone: string) {
  const parts: Record<string, number> = {};
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts;
}

function localDateToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  timezone: string,
) {
  const target = Date.UTC(year, month - 1, day, hour);
  let instant = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = localTimeParts(new Date(instant), timezone);
    const actualAsUtc = Date.UTC(
      actual.year!,
      actual.month! - 1,
      actual.day!,
      actual.hour!,
    );
    instant += target - actualAsUtc;
  }
  return new Date(instant);
}

function bucketOf(date: Date, timezone: string) {
  const parts = localTimeParts(date, timezone);
  return {
    day: localDateToUtc(parts.year!, parts.month!, parts.day!, 0, timezone),
    hour: parts.hour!,
  };
}

function bucketRangeStage(
  start: Date,
  end: Date,
  timezone: string,
): PipelineStage.Match {
  const startBucket = bucketOf(start, timezone);
  const endBucket = bucketOf(end, timezone);
  const endHourExclusive = isHourBoundary(end, timezone)
    ? endBucket.hour
    : endBucket.hour + 1;

  if (startBucket.day.getTime() === endBucket.day.getTime()) {
    return {
      $match: {
        day: startBucket.day,
        hour: { $gte: startBucket.hour, $lt: endHourExclusive },
      },
    };
  }

  return {
    $match: {
      $or: [
        { day: startBucket.day, hour: { $gte: startBucket.hour } },
        { day: { $gt: startBucket.day, $lt: endBucket.day } },
        { day: endBucket.day, hour: { $lt: endHourExclusive } },
      ],
    },
  };
}

function bucketDateProjection(timezone: string | undefined) {
  const timeZone = timezone ?? process.env.TIMEZONE ?? "Europe/Paris";
  return {
    year: { $year: { date: "$day", timezone: timeZone } },
    month: { $month: { date: "$day", timezone: timeZone } },
    day: { $dayOfMonth: { date: "$day", timezone: timeZone } },
    week: { $week: { date: "$day", timezone: timeZone } },
    hour: "$hour",
  };
}

function isHourBoundary(date: Date, timezone: string) {
  const parts = localTimeParts(date, timezone);
  return (
    parts.minute === 0 && parts.second === 0 && date.getMilliseconds() === 0
  );
}

// MongoDB 8.1+ supports $setUnion as a group accumulator, but the Mongoose
// pipeline types bundled with this project do not include it yet.
function setUnionAccumulator(field: string) {
  return { $setUnion: field } as unknown as { $addToSet: string };
}

async function canUseRollups(user: User, start: Date, end: Date) {
  const timezone =
    user.settings.timezone ?? process.env.TIMEZONE ?? "Europe/Paris";
  const endIsCurrent = end.getTime() >= Date.now() - 5 * 60 * 1000;
  if (!(await statsRollupsReady(user._id, user.settings.timezone))) {
    return false;
  }
  if (
    isHourBoundary(start, timezone) &&
    (isHourBoundary(end, timezone) || endIsCurrent)
  ) {
    return true;
  }
  return coversLifetime(user, start, end);
}

async function coversLifetime(user: User, start: Date, end: Date) {
  if (end.getTime() < Date.now() - 5 * 60 * 1000) return false;
  const firstInfo = await InfosModel.findOne(
    { owner: user._id, blacklistedBy: { $exists: false } },
    { played_at: 1 },
  )
    .sort({ played_at: 1, _id: 1 })
    .lean();
  return Boolean(firstInfo && start.getTime() <= firstInfo.played_at.getTime());
}

function bucketStages(user: User, start: Date, end: Date): PipelineStage[] {
  const timezone =
    user.settings.timezone ?? process.env.TIMEZONE ?? "Europe/Paris";
  return [
    { $match: { owner: user._id } },
    bucketRangeStage(start, end, timezone),
  ];
}

export async function getRollupSongsPer(
  user: User,
  start: Date,
  end: Date,
  timeSplit: Timesplit,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  return StatsHourlySummaryModel.aggregate([
    ...bucketStages(user, start, end),
    {
      $project: {
        ...bucketDateProjection(user.settings.timezone),
        count: 1,
        trackIds: 1,
      },
    },
    {
      $group: {
        _id: getGroupingByTimeSplit(timeSplit),
        count: { $sum: "$count" },
        uniqueTrackIds: setUnionAccumulator("$trackIds"),
      },
    },
    {
      $project: { _id: 1, count: 1, differents: { $size: "$uniqueTrackIds" } },
    },
    ...sortByTimeSplit(timeSplit, "_id"),
  ]);
}

export async function getRollupTimePer(
  user: User,
  start: Date,
  end: Date,
  timeSplit: Timesplit,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  return StatsHourlySummaryModel.aggregate([
    ...bucketStages(user, start, end),
    {
      $project: {
        ...bucketDateProjection(user.settings.timezone),
        durationMs: 1,
      },
    },
    {
      $group: {
        _id: getGroupingByTimeSplit(timeSplit),
        count: { $sum: "$durationMs" },
      },
    },
    ...sortByTimeSplit(timeSplit, "_id"),
  ]);
}

export async function getRollupDayRepartition(
  user: User,
  start: Date,
  end: Date,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  return StatsHourlySummaryModel.aggregate([
    ...bucketStages(user, start, end),
    {
      $group: {
        _id: "$hour",
        count: {
          $sum:
            user.settings.metricUsed === "duration" ? "$durationMs" : "$count",
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function getRollupDifferentArtistsPer(
  user: User,
  start: Date,
  end: Date,
  timeSplit: Timesplit,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  if (
    timeSplit === Timesplit.year &&
    (await coversLifetime(user, start, end))
  ) {
    return StatsYearlyEntityModel.aggregate([
      { $match: { owner: user._id, type: "artist" } },
      { $group: { _id: { year: "$year" }, differents: { $sum: 1 } } },
      { $sort: { "_id.year": 1 } },
    ]);
  }
  return StatsHourlyEntityModel.aggregate([
    { $match: { owner: user._id, type: "artist" } },
    ...bucketStages(user, start, end).slice(1),
    {
      $project: {
        ...bucketDateProjection(user.settings.timezone),
        itemId: 1,
        count: 1,
      },
    },
    {
      $group: {
        _id: { ...getGroupingByTimeSplit(timeSplit), artistId: "$itemId" },
      },
    },
    {
      $group: {
        _id: getGroupingByTimeSplit(timeSplit, "_id"),
        differents: { $sum: 1 },
      },
    },
    ...sortByTimeSplit(timeSplit, "_id"),
  ]);
}

export async function getRollupMostListenedArtist(
  user: User,
  start: Date,
  end: Date,
  timeSplit: Timesplit,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  const metricField =
    user.settings.metricUsed === "number" ? "$count" : "$durationMs";
  const useYearly =
    timeSplit === Timesplit.year && (await coversLifetime(user, start, end));
  const model = useYearly ? StatsYearlyEntityModel : StatsHourlyEntityModel;
  const sourceStages: PipelineStage[] = useYearly
    ? [{ $match: { owner: user._id, type: "artist" } }]
    : [
        { $match: { owner: user._id, type: "artist" } },
        ...bucketStages(user, start, end).slice(1),
        {
          $project: {
            ...bucketDateProjection(user.settings.timezone),
            itemId: 1,
            count: 1,
            durationMs: 1,
          },
        },
      ];
  return model.aggregate([
    ...sourceStages,
    {
      $group: {
        _id: { ...getGroupingByTimeSplit(timeSplit), artistId: "$itemId" },
        count: { $sum: metricField },
      },
    },
    { $sort: { count: -1, "_id.artistId": 1 } },
    {
      $group: {
        _id: getGroupingByTimeSplit(timeSplit, "_id"),
        artists: { $push: "$_id.artistId" },
        counts: { $push: "$count" },
      },
    },
    {
      $project: {
        _id: 1,
        artists: { $slice: ["$artists", user.settings.nbElements] },
        counts: { $slice: ["$counts", user.settings.nbElements] },
      },
    },
    { $unwind: { path: "$artists", includeArrayIndex: "artistIndex" } },
    {
      $lookup: {
        from: "artists",
        localField: "artists",
        foreignField: "id",
        as: "artists",
        pipeline: [{ $project: { _id: 1, id: 1, name: 1 } }],
      },
    },
    { $unwind: "$artists" },
    {
      $group: {
        _id: getGroupingByTimeSplit(timeSplit, "_id"),
        artists: { $push: "$artists" },
        counts: { $push: { $arrayElemAt: ["$counts", "$artistIndex"] } },
      },
    },
    ...sortByTimeSplit(timeSplit, "_id"),
  ]);
}

export async function getRollupAlbumDateRatio(
  user: User,
  start: Date,
  end: Date,
  timeSplit: Timesplit,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  const useYearly =
    timeSplit === Timesplit.year && (await coversLifetime(user, start, end));
  const model = useYearly ? StatsYearlyEntityModel : StatsHourlyEntityModel;
  const sourceStages: PipelineStage[] = useYearly
    ? [{ $match: { owner: user._id, type: "album" } }]
    : [
        { $match: { owner: user._id, type: "album" } },
        ...bucketStages(user, start, end).slice(1),
        {
          $project: {
            ...bucketDateProjection(user.settings.timezone),
            itemId: 1,
            count: 1,
            albumReleaseYear: 1,
          },
        },
      ];
  return model.aggregate([
    ...sourceStages,
    { $match: { albumReleaseYear: { $gt: 0 } } },
    {
      $group: {
        _id: { ...getGroupingByTimeSplit(timeSplit), albumId: "$itemId" },
        plays: { $sum: "$count" },
        releaseYear: { $first: "$albumReleaseYear" },
      },
    },
    {
      $group: {
        _id: getGroupingByTimeSplit(timeSplit, "_id"),
        totalYear: { $sum: { $multiply: ["$plays", "$releaseYear"] } },
        count: { $sum: "$plays" },
      },
    },
    {
      $project: {
        _id: 1,
        totalYear: { $divide: ["$totalYear", "$count"] },
        count: 1,
      },
    },
    ...sortByTimeSplit(timeSplit, "_id"),
  ]);
}

export async function getRollupFeatRatio(
  user: User,
  start: Date,
  end: Date,
  timeSplit: Timesplit,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  return StatsHourlySummaryModel.aggregate([
    ...bucketStages(user, start, end),
    {
      $project: {
        ...bucketDateProjection(user.settings.timezone),
        count: 1,
        artistCount1: 1,
        artistCount2: 1,
        artistCount3: 1,
        artistCount4: 1,
        artistCount5: 1,
        totalPeople: 1,
      },
    },
    {
      $group: {
        _id: getGroupingByTimeSplit(timeSplit),
        1: { $sum: "$artistCount1" },
        2: { $sum: "$artistCount2" },
        3: { $sum: "$artistCount3" },
        4: { $sum: "$artistCount4" },
        5: { $sum: "$artistCount5" },
        count: { $sum: "$count" },
        totalPeople: { $sum: "$totalPeople" },
      },
    },
    {
      $project: {
        _id: 1,
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        count: 1,
        totalPeople: 1,
        average: { $divide: ["$totalPeople", "$count"] },
      },
    },
    ...sortByTimeSplit(timeSplit, "_id"),
  ]);
}

export async function getRollupBestOfHour(
  collection: string,
  user: User,
  start: Date,
  end: Date,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  const type = collection.slice(0, -1);
  return StatsHourlyEntityModel.aggregate([
    { $match: { owner: user._id, type } },
    ...bucketStages(user, start, end).slice(1),
    {
      $group: {
        _id: { hour: "$hour", itemId: "$itemId" },
        total: { $sum: "$count" },
      },
    },
    { $sort: { total: -1, "_id.itemId": 1 } },
    {
      $group: {
        _id: "$_id.hour",
        items: { $push: { itemId: "$_id.itemId", total: "$total" } },
        total: { $sum: "$total" },
      },
    },
    { $project: { hour: "$_id", total: 1, items: { $slice: ["$items", 20] } } },
    {
      $lookup: {
        from: collection,
        localField: "items.itemId",
        foreignField: "id",
        as: "full_items",
        pipeline: [{ $project: { _id: 0, id: 1, name: 1 } }],
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function getRollupBest(
  collection: string,
  user: User,
  start: Date,
  end: Date,
  nb: number,
  offset: number,
) {
  if (!(await canUseRollups(user, start, end))) return null;
  const type = collection.slice(0, -1);
  if (await coversLifetime(user, start, end)) {
    return StatsLifetimeEntityModel.aggregate([
      { $match: { owner: user._id, type } },
      {
        $facet: {
          infos: [
            {
              $sort: {
                [getTrackSortType(user) === "count" ? "count" : "durationMs"]:
                  -1,
                itemId: 1,
              },
            },
            { $skip: offset },
            { $limit: nb },
          ],
          computations: [
            {
              $group: {
                _id: null,
                total_duration_ms: { $sum: "$durationMs" },
                total_count: { $sum: "$count" },
              },
            },
          ],
        },
      },
      { $unwind: "$infos" },
      { $unwind: "$computations" },
      {
        $project: {
          _id: "$infos.itemId",
          duration_ms: "$infos.durationMs",
          count: "$infos.count",
          differents: { $size: "$infos.trackIds" },
          trackIds: "$infos.trackIds",
          trackId: "$infos.trackId",
          albumId: "$infos.albumId",
          primaryArtistId: "$infos.primaryArtistId",
          total_duration_ms: "$computations.total_duration_ms",
          total_count: "$computations.total_count",
        },
      },
      { $lookup: lightTrackLookupPipeline("trackId") },
      { $unwind: "$track" },
      { $lookup: lightAlbumLookupPipeline("albumId") },
      { $unwind: "$album" },
      ...bestArtistLookupStages(collection),
    ]);
  }
  return StatsHourlyEntityModel.aggregate([
    { $match: { owner: user._id, type } },
    bucketStages(user, start, end)[1]!,
    {
      $group: {
        _id: "$itemId",
        duration_ms: { $sum: "$durationMs" },
        count: { $sum: "$count" },
        trackIds: setUnionAccumulator("$trackIds"),
        trackId: { $first: "$trackId" },
        albumId: { $first: "$albumId" },
        primaryArtistId: { $first: "$primaryArtistId" },
      },
    },
    { $addFields: { differents: { $size: "$trackIds" } } },
    {
      $facet: {
        infos: [
          { $sort: { [getTrackSortType(user)]: -1, _id: 1 } },
          { $skip: offset },
          { $limit: nb },
        ],
        computations: [
          {
            $group: {
              _id: null,
              total_duration_ms: { $sum: "$duration_ms" },
              total_count: { $sum: "$count" },
            },
          },
        ],
      },
    },
    { $unwind: "$infos" },
    { $unwind: "$computations" },
    {
      $project: {
        _id: "$infos._id",
        result: { $mergeObjects: ["$infos", "$computations"] },
      },
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ["$result", { _id: "$_id" }] },
      },
    },
    { $lookup: lightTrackLookupPipeline("trackId") },
    { $unwind: "$track" },
    { $lookup: lightAlbumLookupPipeline("albumId") },
    { $unwind: "$album" },
    ...bestArtistLookupStages(collection),
  ]);
}

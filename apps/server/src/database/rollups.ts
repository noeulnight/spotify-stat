import { Types } from "mongoose";

import { getWithDefault } from "../tools/env";
import { logger } from "../tools/logger";
import { normalizeSearchText, searchNgrams } from "../tools/search";
import {
  AlbumModel,
  ArtistModel,
  CatalogSearchModel,
  InfosModel,
  StatsHourlyEntityModel,
  StatsHourlySummaryModel,
  StatsLifetimeEntityModel,
  StatsRollupStateModel,
  StatsYearlyEntityModel,
  TrackModel,
  UserModel,
} from "./Models";
import { Infos } from "./schemas/info";

type InfoWithoutOwner = Omit<Infos, "owner">;
const rollupQueues = new Map<string, Promise<void>>();

function withRollupLock<T>(userId: string, operation: () => Promise<T>) {
  const previous = rollupQueues.get(userId) ?? Promise.resolve();
  const current = previous.then(operation, operation);
  rollupQueues.set(
    userId,
    current.then(
      () => undefined,
      () => undefined,
    ),
  );
  return current;
}

function timezoneOf(timezone?: string) {
  return timezone ?? getWithDefault("TIMEZONE", "Europe/Paris");
}

function zonedParts(date: Date, timezone: string) {
  const values: Record<string, number> = {};
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return {
    year: values.year!,
    month: values.month!,
    day: values.day!,
    hour: values.hour!,
  };
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
    const actual = zonedParts(new Date(instant), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
    );
    instant += target - actualAsUtc;
  }
  return new Date(instant);
}

function bucketOf(date: Date, timezone: string) {
  const parts = zonedParts(date, timezone);
  return {
    year: parts.year,
    day: localDateToUtc(parts.year, parts.month, parts.day, 0, timezone),
    hour: parts.hour,
  };
}

function entityValues(info: InfoWithoutOwner) {
  return [
    { type: "track" as const, itemId: info.id },
    { type: "album" as const, itemId: info.albumId },
    { type: "artist" as const, itemId: info.primaryArtistId },
  ];
}

async function appendStatsRollupsUnlocked(
  userId: string,
  infos: InfoWithoutOwner[],
) {
  const included = infos.filter((info) => !info.blacklistedBy);
  if (included.length === 0) return;

  const user = await UserModel.findById(userId, { "settings.timezone": 1 });
  if (!user) return;
  const timezone = timezoneOf(user.settings.timezone);
  const owner = new Types.ObjectId(userId);
  const albumIds = [...new Set(included.map((info) => info.albumId))];
  const albumReleaseYears = new Map(
    (
      await AlbumModel.find(
        { id: { $in: albumIds } },
        { _id: 0, id: 1, release_date: 1 },
      ).lean()
    ).map((album) => [
      album.id,
      Number(album.release_date?.split("-")[0] ?? 0),
    ]),
  );
  const summaries = new Map<
    string,
    ReturnType<typeof bucketOf> & {
      count: number;
      durationMs: number;
      artistCounts: [number, number, number, number, number];
      totalPeople: number;
      trackIds: Set<string>;
      artistIds: Set<string>;
    }
  >();
  const entities = new Map<
    string,
    ReturnType<typeof bucketOf> & {
      type: "track" | "album" | "artist";
      itemId: string;
      count: number;
      durationMs: number;
      albumReleaseYear: number;
      trackIds: Set<string>;
      trackId: string;
      albumId: string;
      primaryArtistId: string;
    }
  >();
  const lifetimeEntities = new Map<
    string,
    {
      type: "track" | "album" | "artist";
      itemId: string;
      count: number;
      durationMs: number;
      trackIds: Set<string>;
      trackId: string;
      albumId: string;
      primaryArtistId: string;
    }
  >();
  const yearlyEntities = new Map<
    string,
    {
      year: number;
      type: "track" | "album" | "artist";
      itemId: string;
      count: number;
      durationMs: number;
      albumReleaseYear: number;
    }
  >();

  for (const info of included) {
    const bucket = bucketOf(info.played_at, timezone);
    const summaryKey = `${bucket.day.toISOString()}:${bucket.hour}`;
    const summary = summaries.get(summaryKey) ?? {
      ...bucket,
      count: 0,
      durationMs: 0,
      artistCounts: [0, 0, 0, 0, 0],
      totalPeople: 0,
      trackIds: new Set<string>(),
      artistIds: new Set<string>(),
    };
    summary.count += 1;
    summary.durationMs += info.durationMs;
    const artistCount = info.artistIds?.length ?? 0;
    if (artistCount >= 1 && artistCount <= 5) {
      const artistCountIndex = artistCount - 1;
      summary.artistCounts[artistCountIndex] =
        (summary.artistCounts[artistCountIndex] ?? 0) + 1;
    }
    summary.totalPeople += artistCount;
    summary.trackIds.add(info.id);
    summary.artistIds.add(info.primaryArtistId);
    summaries.set(summaryKey, summary);

    for (const { type, itemId } of entityValues(info)) {
      const entityKey = `${summaryKey}:${type}:${itemId}`;
      const entity = entities.get(entityKey) ?? {
        ...bucket,
        type,
        itemId,
        count: 0,
        durationMs: 0,
        albumReleaseYear: albumReleaseYears.get(info.albumId) ?? 0,
        trackIds: new Set<string>(),
        trackId: info.id,
        albumId: info.albumId,
        primaryArtistId: info.primaryArtistId,
      };
      entity.count += 1;
      entity.durationMs += info.durationMs;
      entity.trackIds.add(info.id);
      entities.set(entityKey, entity);

      const lifetimeKey = `${type}:${itemId}`;
      const lifetimeEntity = lifetimeEntities.get(lifetimeKey) ?? {
        type,
        itemId,
        count: 0,
        durationMs: 0,
        trackIds: new Set<string>(),
        trackId: info.id,
        albumId: info.albumId,
        primaryArtistId: info.primaryArtistId,
      };
      lifetimeEntity.count += 1;
      lifetimeEntity.durationMs += info.durationMs;
      lifetimeEntity.trackIds.add(info.id);
      lifetimeEntities.set(lifetimeKey, lifetimeEntity);

      const yearlyKey = `${bucket.year}:${type}:${itemId}`;
      const yearlyEntity = yearlyEntities.get(yearlyKey) ?? {
        year: bucket.year,
        type,
        itemId,
        count: 0,
        durationMs: 0,
        albumReleaseYear: albumReleaseYears.get(info.albumId) ?? 0,
      };
      yearlyEntity.count += 1;
      yearlyEntity.durationMs += info.durationMs;
      yearlyEntities.set(yearlyKey, yearlyEntity);
    }
  }

  try {
    await StatsHourlySummaryModel.bulkWrite(
      [...summaries.values()].map((summary) => ({
        updateOne: {
          filter: { owner, day: summary.day, hour: summary.hour },
          update: {
            $inc: {
              count: summary.count,
              durationMs: summary.durationMs,
              artistCount1: summary.artistCounts[0],
              artistCount2: summary.artistCounts[1],
              artistCount3: summary.artistCounts[2],
              artistCount4: summary.artistCounts[3],
              artistCount5: summary.artistCounts[4],
              totalPeople: summary.totalPeople,
            },
            $addToSet: {
              trackIds: { $each: [...summary.trackIds] },
              artistIds: { $each: [...summary.artistIds] },
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    await StatsHourlyEntityModel.bulkWrite(
      [...entities.values()].map((entity) => ({
        updateOne: {
          filter: {
            owner,
            day: entity.day,
            hour: entity.hour,
            type: entity.type,
            itemId: entity.itemId,
          },
          update: {
            $inc: { count: entity.count, durationMs: entity.durationMs },
            $addToSet: { trackIds: { $each: [...entity.trackIds] } },
            $setOnInsert: {
              trackId: entity.trackId,
              albumId: entity.albumId,
              albumReleaseYear: entity.albumReleaseYear,
              primaryArtistId: entity.primaryArtistId,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    await StatsLifetimeEntityModel.bulkWrite(
      [...lifetimeEntities.values()].map((entity) => ({
        updateOne: {
          filter: { owner, type: entity.type, itemId: entity.itemId },
          update: {
            $inc: { count: entity.count, durationMs: entity.durationMs },
            $addToSet: { trackIds: { $each: [...entity.trackIds] } },
            $setOnInsert: {
              trackId: entity.trackId,
              albumId: entity.albumId,
              primaryArtistId: entity.primaryArtistId,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    await StatsYearlyEntityModel.bulkWrite(
      [...yearlyEntities.values()].map((entity) => ({
        updateOne: {
          filter: {
            owner,
            year: entity.year,
            type: entity.type,
            itemId: entity.itemId,
          },
          update: {
            $inc: { count: entity.count, durationMs: entity.durationMs },
            $setOnInsert: { albumReleaseYear: entity.albumReleaseYear },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    await StatsRollupStateModel.updateOne(
      { owner },
      { $setOnInsert: { status: "ready", timezone, updatedAt: new Date() } },
      { upsert: true },
    );
  } catch (error) {
    await StatsRollupStateModel.updateOne(
      { owner },
      { $set: { status: "dirty", timezone, updatedAt: new Date() } },
      { upsert: true },
    );
    logger.error(
      "Stats rollup update failed; raw stats fallback enabled",
      error,
    );
  }
}

export function appendStatsRollups(userId: string, infos: InfoWithoutOwner[]) {
  return withRollupLock(userId, () =>
    appendStatsRollupsUnlocked(userId, infos),
  );
}

export function storeInfosWithRollups(
  userId: string,
  realInfos: Infos[],
  infos: InfoWithoutOwner[],
) {
  return withRollupLock(userId, async () => {
    const saved = await InfosModel.create(realInfos);
    await appendStatsRollupsUnlocked(userId, infos);
    return saved;
  });
}

export async function markStatsRollupsDirty(userId: string) {
  const user = await UserModel.findById(userId, { "settings.timezone": 1 });
  if (!user) return;
  await StatsRollupStateModel.updateOne(
    { owner: user._id },
    {
      $set: {
        status: "dirty",
        timezone: timezoneOf(user.settings.timezone),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function deleteStatsRollups(userId: string) {
  const owner = new Types.ObjectId(userId);
  await Promise.all([
    StatsHourlySummaryModel.deleteMany({ owner }),
    StatsHourlyEntityModel.deleteMany({ owner }),
    StatsLifetimeEntityModel.deleteMany({ owner }),
    StatsYearlyEntityModel.deleteMany({ owner }),
    StatsRollupStateModel.deleteMany({ owner }),
  ]);
}

async function rebuildStatsRollupsUnlocked(userId: string) {
  const user = await UserModel.findById(userId, { "settings.timezone": 1 });
  if (!user) return;
  const owner = user._id;
  const timezone = timezoneOf(user.settings.timezone);
  await StatsRollupStateModel.updateOne(
    { owner },
    { $set: { status: "building", timezone, updatedAt: new Date() } },
    { upsert: true },
  );
  await Promise.all([
    StatsHourlySummaryModel.deleteMany({ owner }),
    StatsHourlyEntityModel.deleteMany({ owner }),
    StatsLifetimeEntityModel.deleteMany({ owner }),
    StatsYearlyEntityModel.deleteMany({ owner }),
  ]);

  const cursor = InfosModel.find({
    owner,
    blacklistedBy: { $exists: false },
  }).cursor();
  let batch: InfoWithoutOwner[] = [];
  for await (const info of cursor) {
    batch.push(info.toObject());
    if (batch.length >= 1_000) {
      await appendStatsRollupsUnlocked(userId, batch);
      batch = [];
    }
  }
  if (batch.length > 0) await appendStatsRollupsUnlocked(userId, batch);
  await StatsRollupStateModel.updateOne(
    { owner },
    { $set: { status: "ready", timezone, updatedAt: new Date() } },
  );
  logger.info(`Rebuilt stats rollups for ${userId}`);
}

export function rebuildStatsRollups(userId: string) {
  return withRollupLock(userId, () => rebuildStatsRollupsUnlocked(userId));
}

export async function rebuildAllStatsRollups() {
  for await (const user of UserModel.find({}, { _id: 1 })) {
    await rebuildStatsRollups(user._id.toString());
  }
}

export async function backfillCatalogSearchFields() {
  const models: ["track" | "album" | "artist", any][] = [
    ["track", TrackModel],
    ["album", AlbumModel],
    ["artist", ArtistModel],
  ];
  for (const [type, model] of models) {
    const cursor = model.find({}, { id: 1, name: 1 }).cursor();
    let operations: any[] = [];
    for await (const item of cursor) {
      operations.push({
        updateOne: {
          filter: { type, itemId: item.id },
          update: {
            $set: {
              normalizedName: normalizeSearchText(item.name),
              nameNgrams: searchNgrams(item.name),
            },
          },
          upsert: true,
        },
      });
      if (operations.length >= 1_000) {
        await CatalogSearchModel.bulkWrite(operations as never[]);
        operations = [];
      }
    }
    if (operations.length > 0) {
      await CatalogSearchModel.bulkWrite(operations as never[]);
    }
    await model.collection.updateMany(
      {
        $or: [
          { normalizedName: { $exists: true } },
          { nameNgrams: { $exists: true } },
        ],
      },
      { $unset: { normalizedName: 1, nameNgrams: 1 } },
    );
  }
}

export async function statsRollupsReady(
  userId: Types.ObjectId,
  timezone?: string,
) {
  const state = await StatsRollupStateModel.findOne({ owner: userId });
  return state?.status === "ready" && state.timezone === timezoneOf(timezone);
}

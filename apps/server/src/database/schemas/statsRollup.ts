import { Schema, Types } from "mongoose";

export interface StatsHourlySummary {
  owner: Types.ObjectId;
  day: Date;
  hour: number;
  count: number;
  durationMs: number;
  artistCount1: number;
  artistCount2: number;
  artistCount3: number;
  artistCount4: number;
  artistCount5: number;
  totalPeople: number;
  trackIds: string[];
  artistIds: string[];
}

export interface StatsHourlyEntity {
  owner: Types.ObjectId;
  day: Date;
  hour: number;
  type: "track" | "album" | "artist";
  itemId: string;
  count: number;
  durationMs: number;
  albumReleaseYear: number;
  trackIds: string[];
  trackId: string;
  albumId: string;
  primaryArtistId: string;
}

export interface StatsLifetimeEntity {
  owner: Types.ObjectId;
  type: "track" | "album" | "artist";
  itemId: string;
  count: number;
  durationMs: number;
  trackIds: string[];
  trackId: string;
  albumId: string;
  primaryArtistId: string;
}

export interface StatsYearlyEntity {
  owner: Types.ObjectId;
  year: number;
  type: "track" | "album" | "artist";
  itemId: string;
  count: number;
  durationMs: number;
  albumReleaseYear: number;
}

export interface StatsRollupState {
  owner: Types.ObjectId;
  timezone: string;
  status: "building" | "ready" | "dirty";
  updatedAt: Date;
}

export const StatsHourlySummarySchema = new Schema<StatsHourlySummary>({
  owner: { type: Schema.Types.ObjectId, required: true },
  day: { type: Date, required: true },
  hour: { type: Number, required: true },
  count: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  artistCount1: { type: Number, required: true },
  artistCount2: { type: Number, required: true },
  artistCount3: { type: Number, required: true },
  artistCount4: { type: Number, required: true },
  artistCount5: { type: Number, required: true },
  totalPeople: { type: Number, required: true },
  trackIds: { type: [String], required: true },
  artistIds: { type: [String], required: true },
});
StatsHourlySummarySchema.index({ owner: 1, day: 1, hour: 1 }, { unique: true });

export const StatsHourlyEntitySchema = new Schema<StatsHourlyEntity>({
  owner: { type: Schema.Types.ObjectId, required: true },
  day: { type: Date, required: true },
  hour: { type: Number, required: true },
  type: { type: String, enum: ["track", "album", "artist"], required: true },
  itemId: { type: String, required: true },
  count: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  albumReleaseYear: { type: Number, required: true },
  trackIds: { type: [String], required: true },
  trackId: { type: String, required: true },
  albumId: { type: String, required: true },
  primaryArtistId: { type: String, required: true },
});
StatsHourlyEntitySchema.index(
  { owner: 1, type: 1, day: 1, hour: 1, itemId: 1 },
  { unique: true },
);

export const StatsLifetimeEntitySchema = new Schema<StatsLifetimeEntity>({
  owner: { type: Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ["track", "album", "artist"], required: true },
  itemId: { type: String, required: true },
  count: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  trackIds: { type: [String], required: true },
  trackId: { type: String, required: true },
  albumId: { type: String, required: true },
  primaryArtistId: { type: String, required: true },
});
StatsLifetimeEntitySchema.index(
  { owner: 1, type: 1, itemId: 1 },
  { unique: true },
);
StatsLifetimeEntitySchema.index({ owner: 1, type: 1, count: -1, itemId: 1 });
StatsLifetimeEntitySchema.index({
  owner: 1,
  type: 1,
  durationMs: -1,
  itemId: 1,
});

export const StatsYearlyEntitySchema = new Schema<StatsYearlyEntity>({
  owner: { type: Schema.Types.ObjectId, required: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ["track", "album", "artist"], required: true },
  itemId: { type: String, required: true },
  count: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  albumReleaseYear: { type: Number, required: true },
});
StatsYearlyEntitySchema.index(
  { owner: 1, type: 1, year: 1, itemId: 1 },
  { unique: true },
);

export const StatsRollupStateSchema = new Schema<StatsRollupState>({
  owner: { type: Schema.Types.ObjectId, required: true, unique: true },
  timezone: { type: String, required: true },
  status: {
    type: String,
    enum: ["building", "ready", "dirty"],
    required: true,
  },
  updatedAt: { type: Date, required: true },
});

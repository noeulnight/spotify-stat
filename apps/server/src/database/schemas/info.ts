import { Schema, Types } from "mongoose";

export interface Infos {
  owner: Types.ObjectId;
  id: string;
  albumId: string;
  primaryArtistId: string;
  artistIds: string[];
  durationMs: number;
  played_at: Date;
  blacklistedBy?: "artist";
}

export const InfosSchema = new Schema<Infos>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User" },

    id: { type: String, index: true },
    albumId: { type: String, index: true },
    primaryArtistId: { type: String, index: true },
    artistIds: [{ type: String }],

    durationMs: { type: Number },

    played_at: { type: Date, index: true },
    blacklistedBy: {
      type: [String],
      enum: ["artist"],
      required: false,
      default: undefined,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

InfosSchema.index(
  { owner: 1, blacklistedBy: 1, played_at: -1 },
  { name: "owner_blacklistedBy_played_at" },
);
InfosSchema.index({ owner: 1, id: 1, played_at: -1 });
InfosSchema.index({ owner: 1, primaryArtistId: 1, played_at: 1 });
InfosSchema.index({ owner: 1, albumId: 1, played_at: 1 });

InfosSchema.virtual("track", {
  ref: "Track",
  localField: "id",
  foreignField: "id",
  justOne: true,
});

InfosSchema.virtual("album", {
  ref: "Album",
  localField: "albumId",
  foreignField: "id",
  justOne: true,
});

InfosSchema.virtual("artist", {
  ref: "Artist",
  localField: "primaryArtistId",
  foreignField: "id",
  justOne: true,
});

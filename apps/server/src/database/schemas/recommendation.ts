import { Schema, Types } from "mongoose";

export const RecommendationSchema = new Schema<{
  owner: Types.ObjectId;
  trackId: string;
  title: string | null;
  artists: string[];
  imageUrl: string | null;
  name: string;
  message: string;
  createdAt: Date;
}>({
  owner: { type: Schema.Types.ObjectId, required: true },
  trackId: { type: String, required: true },
  title: { type: String, default: null },
  artists: { type: [String], default: [] },
  imageUrl: { type: String, default: null },
  name: { type: String, default: "", maxlength: 40 },
  message: { type: String, default: "", maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
});
RecommendationSchema.index({ owner: 1, trackId: 1 }, { unique: true });
RecommendationSchema.index({ owner: 1, createdAt: -1, _id: -1 });

export const RecommendationRateSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

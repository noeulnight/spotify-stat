import { Schema } from "mongoose";

export type CatalogSearchType = "track" | "album" | "artist";

export interface CatalogSearch {
  type: CatalogSearchType;
  itemId: string;
  normalizedName: string;
  nameNgrams: string[];
}

export const CatalogSearchSchema = new Schema<CatalogSearch>({
  type: { type: String, enum: ["track", "album", "artist"], required: true },
  itemId: { type: String, required: true },
  normalizedName: { type: String, required: true },
  nameNgrams: { type: [String], required: true },
});

CatalogSearchSchema.index({ type: 1, itemId: 1 }, { unique: true });
CatalogSearchSchema.index({ type: 1, nameNgrams: 1 });

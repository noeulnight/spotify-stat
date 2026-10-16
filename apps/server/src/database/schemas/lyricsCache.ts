import { Schema } from "mongoose";

import type { Lyrics } from "../../tools/apis/lyrics";

export const LyricsCacheSchema = new Schema<{
  trackId: string;
  lyrics: Lyrics | null;
  expiresAt?: Date;
}>(
  {
    trackId: { type: String, required: true, unique: true },
    lyrics: {
      type: new Schema(
        {
          id: { type: Number, required: true },
          instrumental: { type: Boolean, required: true },
          plainLyrics: { type: String, default: null },
          syncedLyrics: { type: String, default: null },
        },
        { _id: false },
      ),
      default: null,
    },
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true },
);

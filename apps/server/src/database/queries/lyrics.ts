import {
  createLyricsCache,
  type LyricsCacheStore,
} from "../../tools/apis/lyricsCache";
import { LyricsCacheModel } from "../Models";

export const lyricsCacheStore: LyricsCacheStore = {
  async get(trackId) {
    const cached = await LyricsCacheModel.findOne({
      trackId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    }).lean();
    return cached ? cached.lyrics : undefined;
  },
  set(trackId, lyrics) {
    return LyricsCacheModel.updateOne(
      { trackId },
      lyrics === null
        ? { $set: { lyrics, expiresAt: new Date(Date.now() + 300_000) } }
        : { $set: { lyrics }, $unset: { expiresAt: 1 } },
      { upsert: true },
    ).exec();
  },
  clear: () => LyricsCacheModel.deleteMany({}).exec(),
};

export const lyricsCache = createLyricsCache(lyricsCacheStore);

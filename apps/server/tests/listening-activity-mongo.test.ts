import assert from "node:assert/strict";
import test from "node:test";

const uri = process.env.MONGO_ACTIVITY_TEST_URI;
test(
  "activity aggregation isolates owners and primary artists and uses local calendar dates",
  { skip: !uri },
  async () => {
    assert.match(
      uri!,
      /^mongodb:\/\/127\.0\.0\.1:27119\/spotistat_activity_test$/,
    );
    const mongoose = await import("mongoose");
    const { InfosModel } = await import("../src/database/Models");
    const { getListeningActivity, getArtistPlayCount } =
      await import("../src/database/queries/listeningActivity");
    await mongoose.connect(uri!);
    const owner = new mongoose.Types.ObjectId();
    const other = new mongoose.Types.ObjectId();
    const user = {
      _id: owner,
      settings: { timezone: "Asia/Seoul" },
    } as Parameters<typeof getListeningActivity>[0];
    try {
      await InfosModel.collection.insertMany([
        {
          owner,
          id: "song",
          primaryArtistId: "artist",
          played_at: new Date("2024-02-28T15:01:00Z"),
        },
        {
          owner,
          id: "song",
          primaryArtistId: "artist",
          played_at: new Date("2024-02-29T15:01:00Z"),
        },
        {
          owner,
          id: "song",
          primaryArtistId: "artist",
          played_at: new Date("2024-02-29T16:01:00Z"),
        },
        {
          owner,
          id: "other",
          primaryArtistId: "artist",
          played_at: new Date("2024-03-01T15:01:00Z"),
        },
        {
          owner: other,
          id: "song",
          primaryArtistId: "artist",
          played_at: new Date("2024-03-02T15:01:00Z"),
        },
        {
          owner,
          id: "song",
          primaryArtistId: "artist",
          played_at: new Date("2099-01-01T00:00:00Z"),
        },
      ]);
      const song = await getListeningActivity(user, { id: "song" });
      assert.equal(song.listeningDays, 2);
      assert.equal(song.longestStreak, 2);
      assert.deepEqual(song.peakDay, { date: "2024-03-01", count: 2 });
      const artist = await getListeningActivity(user, {
        primaryArtistId: "artist",
      });
      assert.equal(artist.listeningDays, 3);
      assert.equal(artist.longestStreak, 3);
      assert.equal(await getArtistPlayCount(user, "artist"), 5);
    } finally {
      await InfosModel.deleteMany({ owner: { $in: [owner, other] } });
      await mongoose.disconnect();
    }
  },
);

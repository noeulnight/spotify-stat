import assert from "node:assert/strict";
import test from "node:test";

const uri = process.env.MONGO_TEST_URI;
test(
  "catalog migration makes existing songs, albums and artists searchable",
  { skip: !uri },
  async () => {
    assert.match(
      uri!,
      /^mongodb:\/\/127\.0\.0\.1:\d+\/spotistat_catalog_search_test$/,
    );
    const mongoose = await import("mongoose");
    const { TrackModel, AlbumModel, ArtistModel, CatalogSearchModel } =
      await import("../src/database/Models");
    const { searchTrack, searchArtist } = await import("../src/database");
    const { searchAlbum } = await import("../src/database/queries/album");
    const { up } =
      await import("../src/migrations/1792166001043-backfill_catalog_search");
    await mongoose.connect(uri!);
    try {
      await Promise.all([
        TrackModel.deleteMany({}),
        AlbumModel.deleteMany({}),
        ArtistModel.deleteMany({}),
        CatalogSearchModel.deleteMany({}),
      ]);
      await TrackModel.collection.insertMany([
        {
          id: "track-1",
          name: "enchanted love",
          album: "album-1",
          artists: ["artist-1"],
        },
        {
          id: "track-2",
          name: "Other song",
          album: "album-1",
          artists: ["artist-1"],
        },
      ]);
      await AlbumModel.collection.insertOne({
        id: "album-1",
        name: "Enchanted Album",
        artists: ["artist-1"],
      });
      await ArtistModel.collection.insertOne({
        id: "artist-1",
        name: "Enchanted Artist",
      });
      assert.equal((await searchTrack("enchanted love")).length, 0);
      await up();
      const tracks = await searchTrack("enchanted love");
      assert.deepEqual(
        tracks.map((track) => track.id),
        ["track-1"],
      );
      assert.equal((await searchTrack("ENCHANTED LOVE"))[0]?.id, "track-1");
      assert.equal((await searchArtist("enchanted"))[0]?.id, "artist-1");
      assert.equal((await searchAlbum("enchanted"))[0]?.id, "album-1");
      assert.equal(await CatalogSearchModel.countDocuments(), 4);
      await up();
      assert.equal(await CatalogSearchModel.countDocuments(), 4);
      assert.equal((await searchTrack("enchanted love"))[0]?.id, "track-1");
    } finally {
      await mongoose.disconnect();
    }
  },
);

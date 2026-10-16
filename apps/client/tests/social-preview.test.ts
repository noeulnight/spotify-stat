import assert from "node:assert/strict";
import test from "node:test";
import axios from "axios";
import { loadPreview } from "../src/features/social-preview/api/preview";
import {
  isPreviewKind,
  isSpotifyImage,
  previewImageUrl,
} from "../src/features/social-preview/model/preview";

const id = "11dFghVXANMlKmJXsNCbNl";
const origin = new URL("https://stats.example.com/");

test("OG URLs preserve the share token and reject unsupported kinds and artwork hosts", () => {
  const url = new URL(previewImageUrl(origin, "songs", id, "a+b&c"));
  assert.equal(url.pathname, `/og/songs/${id}.png`);
  assert.equal(url.searchParams.get("token"), "a+b&c");
  assert.equal(isPreviewKind("artists"), true);
  assert.equal(isPreviewKind("toString"), false);
  assert.equal(isSpotifyImage("https://i.scdn.co/image/cover"), true);
  assert.equal(
    isSpotifyImage("https://image-cdn-ak.spotifycdn.com/image/cover"),
    true,
  );
  for (const image of [
    "http://i.scdn.co/a",
    "https://scdn.co.evil.test/a",
    "https://localhost/a",
    "https://i.scdn.co:8080/a",
    "invalid",
  ]) {
    assert.equal(isSpotifyImage(image), false);
  }
});

test("OG metadata works without cookies and uses only the explicit public token for shared pages", async () => {
  const previousAdapter = axios.defaults.adapter;
  const previousBase = process.env.API_BASE_URL;
  process.env.API_BASE_URL = "https://api.example.com";
  const requests: string[] = [];
  axios.defaults.adapter = async (config) => {
    requests.push(config.url!);
    assert.equal(config.headers.Cookie, undefined);
    let data: unknown;
    if (config.url === "https://open.spotify.com/oembed") {
      assert.equal(config.params.url, `https://open.spotify.com/track/${id}`);
      data = {
        title: "Public song",
        thumbnail_url: "https://i.scdn.co/image/cover",
      };
    } else {
      assert.equal(config.params.token, "public-token");
      if (config.url?.endsWith("/stats"))
        data = config.url.startsWith("/album/")
          ? { tracks: [{ count: 120 }, { count: 80 }] }
          : { total: { count: 1234 } };
      else if (config.url?.startsWith("/track/"))
        data = [{ id, name: "한글 노래", album: "album", artists: ["artist"] }];
      else if (config.url?.startsWith("/album/"))
        data = [
          {
            name: "Album",
            release_date: "2026-10-16",
            album_type: "album",
            artists: ["artist"],
            images: [{ url: "https://i.scdn.co/image/cover" }],
          },
        ];
      else data = [{ name: "아티스트", images: [], genres: ["k-pop"] }];
    }
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    assert.equal((await loadPreview("songs", id, origin)).title, "Public song");
    const song = await loadPreview("songs", id, origin, "public-token");
    assert.equal(song.title, "한글 노래");
    assert.equal(song.subtitle, "아티스트");
    assert.equal(song.image, "https://i.scdn.co/image/cover");
    assert.deepEqual(song.metrics, [{ label: "Plays", value: "1,234" }]);
    assert.deepEqual(song.tags, ["Album", "2026-10-16"]);
    const album = await loadPreview("albums", id, origin, "public-token");
    assert.deepEqual(album.metrics, [
      { label: "Plays", value: "200" },
      { label: "Songs", value: "2" },
    ]);
    const artist = await loadPreview("artists", id, origin, "public-token");
    assert.deepEqual(artist.tags, ["k-pop"]);
    assert.deepEqual(artist.metrics, [{ label: "Plays", value: "1,234" }]);
    assert.equal(
      (await loadPreview("albums", id, origin, "public-token")).title,
      "Album",
    );
    assert.equal(
      (await loadPreview("artists", id, origin, "public-token")).title,
      "아티스트",
    );
    const before = requests.length;
    assert.equal(
      (await loadPreview("songs", "../invalid", origin)).available,
      false,
    );
    assert.equal(requests.length, before);
    const workingAdapter = axios.defaults.adapter;
    axios.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/stats")) throw new Error("Stats unavailable");
      return workingAdapter(config);
    };
    const withoutStats = await loadPreview("songs", id, origin, "public-token");
    assert.equal(withoutStats.title, "한글 노래");
    assert.equal(withoutStats.metrics, undefined);
    axios.defaults.adapter = async () => {
      throw new Error("Unavailable");
    };
    const fallback = await loadPreview("songs", id, origin, "invalid-token");
    assert.equal(fallback.available, false);
    assert.equal(fallback.title, "Song");
  } finally {
    axios.defaults.adapter = previousAdapter;
    if (previousBase === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = previousBase;
  }
});

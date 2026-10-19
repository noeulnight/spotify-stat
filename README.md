# Spotistat

A self-hosted Spotify listening dashboard with play history, rankings, and synced lyrics.

[Open Spotistat](https://spotify.lth.so) · [Releases](https://github.com/noeulnight/spotify-stat/releases) · [Run locally](#run-locally)

<p align="center" id="screenshots">
  <a href="docs/screenshots/overview.png">
    <img src="docs/screenshots/overview.png" alt="Spotistat artist details and listening stats, captured from the live app" width="900" />
  </a>
</p>

## Features

- Browse recent plays and search songs, albums, and artists.
- Compare play counts, listening time, and rankings across date ranges.
- View hourly listening patterns and changes in artist distribution.
- Control Spotify playback while reading synced lyrics.
- Share read-only stats pages using a custom URL.
- Import Spotify account data or extended streaming history.

Settings include light and dark themes, time zones, and artist exclusions.

## Run locally

You need Node.js 26, pnpm 11.9.0, MongoDB, and a [Spotify developer app](https://developer.spotify.com/dashboard).

<details>
<summary>Setup instructions</summary>

### 1. Install dependencies

```sh
git clone https://github.com/noeulnight/spotify-stat.git
cd spotify-stat
pnpm install --frozen-lockfile
```

### 2. Configure Spotify

Register this redirect URI in your Spotify app:

```text
http://127.0.0.1:8080/oauth/spotify/callback
```

Create `apps/server/.env` with your client ID and secret:

```dotenv
MONGO_ENDPOINT=mongodb://127.0.0.1:27017/spotify-stat
CLIENT_ENDPOINT=http://127.0.0.1:4321
API_ENDPOINT=http://127.0.0.1:8080
SPOTIFY_PUBLIC=your_spotify_client_id
SPOTIFY_SECRET=your_spotify_client_secret
TIMEZONE=Asia/Seoul
```

### 3. Start the server

```sh
pnpm --filter @spotify-stat/server build
cd apps/server
node --env-file=.env build/index.js --migrate
node --env-file=.env build/index.js
```

### 4. Start the client

Create `apps/client/.env`:

```dotenv
PUBLIC_API_BASE_URL=/api
```

In another terminal, run from the repository root:

```sh
pnpm --filter spotistat exec astro dev --background
```

Open `http://127.0.0.1:4321` and sign in with Spotify. The dev server proxies `/api` to port `8080`.

To check logs or stop the client:

```sh
pnpm --filter spotistat exec astro dev status
pnpm --filter spotistat exec astro dev logs
pnpm --filter spotistat exec astro dev stop
```

Keep `.env` files out of Git.

</details>

## Development

The web app lives in `apps/client` and the API in `apps/server`. The client uses Astro, React, and shadcn/ui; the server uses Express and MongoDB.

Frontend commands and structure are in the [client README](apps/client/README.md).

## License

Spotistat is a fork of [Your Spotify](https://github.com/Yooooomi/your_spotify), licensed under [GPL-3.0](LICENSE).

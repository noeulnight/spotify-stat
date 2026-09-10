import { Counter, Histogram, collectDefaultMetrics } from "prom-client";

export class Metrics {
  static httpRequestsTotal = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "endpoint", "status"] as const,
  });

  static httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "endpoint", "status"] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  static importsTotal = new Counter({
    name: "imports_total",
    help: "Total number of imports",
    labelNames: ["type", "user", "status"] as const,
  });

  static ingestedTracksTotal = new Counter({
    name: "ingested_tracks_total",
    help: "Total number of ingested tracks from Spotify API",
    labelNames: ["user"] as const,
  });

  static ingestedAlbumsTotal = new Counter({
    name: "ingested_albums_total",
    help: "Total number of ingested albums from Spotify API",
    labelNames: ["user"] as const,
  });

  static ingestedArtistsTotal = new Counter({
    name: "ingested_artists_total",
    help: "Total number of ingested artists from Spotify API",
    labelNames: ["user"] as const,
  });
}

collectDefaultMetrics();

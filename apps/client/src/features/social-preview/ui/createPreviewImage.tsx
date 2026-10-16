import satori from "satori";
import sharp from "sharp";
import axios from "axios";
import boldFontUrl from "../../../shared/assets/fonts/NotoSansKR-Bold.otf?inline";
import fontUrl from "../../../shared/assets/fonts/NotoSansKR-Regular.otf?inline";
import { isSpotifyImage, type Preview } from "../model/preview";

const font = Buffer.from(fontUrl.split(",")[1], "base64");
const boldFont = Buffer.from(boldFontUrl.split(",")[1], "base64");

export async function createPreviewImage(preview: Preview, label: string) {
  let artwork: string | undefined;
  let background = "#18181b";
  let accent = "#a1a1aa";
  if (preview.image && isSpotifyImage(preview.image)) {
    try {
      const { data, headers } = await axios.get<ArrayBuffer>(preview.image, {
        responseType: "arraybuffer",
        timeout: 4000,
        maxRedirects: 0,
        maxContentLength: 5_000_000,
      });
      const mime = String(headers["content-type"] ?? "").split(";")[0];
      if (["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        const buffer = Buffer.from(data);
        artwork = `data:${mime};base64,${buffer.toString("base64")}`;
        const { dominant, channels } = await sharp(buffer)
          .removeAlpha()
          .toColourspace("srgb")
          .stats();
        const palette = channels
          .slice(0, 3)
          .map(
            (channel, index) =>
              [dominant.r, dominant.g, dominant.b][index] * 0.4 +
              channel.mean * 0.6,
          );
        const baseScale = 60 / Math.max(1, ...palette);
        const base = palette.map((value) => Math.round(value * baseScale));
        background = `rgb(${base.join(",")})`;
        const scale = 190 / Math.max(1, ...palette);
        accent = `rgb(${palette.map((value) => Math.round(value * scale)).join(",")})`;
      }
    } catch {
      // Keep the text preview when Spotify artwork is unavailable.
    }
  }

  const svg = await satori(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "38px 48px",
        background,
        color: "#fafafa",
        fontFamily: "Noto Sans KR",
      }}
    >
      <svg
        width="1200"
        height="630"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <filter id="color-waves" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.003 0.006"
              numOctaves="2"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="220"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="24" />
          </filter>
          <radialGradient id="cover-color">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="corner-color">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <pattern
            id="dots"
            width="58"
            height="58"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="14" cy="14" r="1" fill="rgba(255, 255, 255, 0.12)" />
            <circle cx="43" cy="43" r="1" fill="rgba(255, 255, 255, 0.12)" />
          </pattern>
        </defs>
        <g filter="url(#color-waves)">
          <ellipse
            cx="150"
            cy="210"
            rx="540"
            ry="390"
            fill="url(#cover-color)"
          />
          <ellipse
            cx="660"
            cy="120"
            rx="420"
            ry="180"
            transform="rotate(-24 660 120)"
            fill="url(#corner-color)"
          />
          <ellipse
            cx="1150"
            cy="630"
            rx="580"
            ry="460"
            fill="url(#corner-color)"
          />
        </g>
        <rect width="1200" height="630" fill="url(#dots)" />
      </svg>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 44,
          marginTop: 88,
          height: 224,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 224,
            height: 224,
            flexShrink: 0,
            borderRadius: label === "Artist" ? 112 : 20,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            background: "#e4e4e7",
          }}
        >
          {artwork ? (
            <img
              src={artwork}
              width={224}
              height={224}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 90, color: "#a1a1aa" }}>♪</span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            gap: 22,
          }}
        >
          <div
            style={{
              display: "block",
              fontSize: preview.title.length > 40 ? 48 : 64,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -2,
              lineClamp: 2,
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {preview.title.slice(0, 200)}
          </div>
          {preview.subtitle && preview.subtitle !== label && (
            <div
              style={{
                display: "block",
                fontSize: 28,
                lineHeight: 1.4,
                lineClamp: 2,
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {preview.subtitle.slice(0, 160)}
            </div>
          )}
        </div>
      </div>
      {!!preview.tags?.length && (
        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {preview.tags.slice(0, 4).map((tag, index) => (
            <div
              key={index}
              style={{
                display: "block",
                maxWidth: 360,
                padding: "8px 12px",
                borderRadius: 6,
                background: "rgba(255, 255, 255, 0.1)",
                fontSize: 22,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {tag.slice(0, 80)}
            </div>
          ))}
        </div>
      )}
      {!!preview.metrics?.length && (
        <div style={{ display: "flex", gap: 44, marginTop: 32 }}>
          {preview.metrics.slice(0, 4).map((metric) => (
            <div
              key={metric.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 0,
              }}
            >
              <div style={{ fontSize: 36, color: "rgba(255, 255, 255, 0.8)" }}>
                {metric.value}
              </div>
              <div style={{ fontSize: 20, color: "rgba(255, 255, 255, 0.8)" }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Noto Sans KR", data: font, weight: 400, style: "normal" },
        { name: "Noto Sans KR", data: boldFont, weight: 700, style: "normal" },
      ],
    },
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": preview.available
        ? "public, max-age=3600, s-maxage=3600"
        : "no-store",
    },
  });
}

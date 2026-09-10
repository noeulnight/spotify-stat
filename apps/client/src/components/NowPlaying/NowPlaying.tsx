import { LinearProgress, Skeleton } from "@mui/material";
import Axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, CurrentlyPlayingResponse } from "../../services/apis/api";
import { useIsGuest } from "../../services/hooks/hooks";
import { msToDuration } from "../../services/stats";
import { getSpotifyLogUrl } from "../../services/tools";
import Text from "../Text";
import TitleCard from "../TitleCard";

import s from "./index.module.css";

type PlaybackState =
  | { status: "loading" }
  | { status: "ready"; playback: CurrentlyPlayingResponse | null }
  | { status: "forbidden" }
  | { status: "error" };

const REFRESH_INTERVAL_MS = 10_000;

export default function NowPlaying() {
  const isGuest = useIsGuest();
  const [state, setState] = useState<PlaybackState>({ status: "loading" });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const { data } = await api.currentlyPlaying();
        if (active) {
          setState({ status: "ready", playback: data });
          setNow(Date.now());
        }
      } catch (error) {
        if (!active) return;
        if (
          Axios.isAxiosError(error) &&
          (error.response?.status === 400 || error.response?.status === 403)
        ) {
          setState({ status: "forbidden" });
        } else {
          setState({ status: "error" });
        }
      }
    };

    refresh();
    const refreshTimer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const progressTimer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(progressTimer);
  }, []);

  const playback = state.status === "ready" ? state.playback : null;
  const progressMs = useMemo(() => {
    if (!playback) return 0;
    const elapsed = playback.isPlaying ? now - playback.fetchedAt : 0;
    return Math.min(playback.progressMs + elapsed, playback.track.durationMs);
  }, [now, playback]);

  return (
    <TitleCard title="Now playing" contentClassName={s.content}>
      {state.status === "loading" && (
        <div className={s.player}>
          <Skeleton variant="rounded" className={s.cover} />
          <div className={s.details}>
            <Skeleton width="35%" />
            <Skeleton width="20%" />
            <Skeleton width="100%" />
          </div>
        </div>
      )}
      {state.status === "forbidden" && (
        <Text size="normal">
          {isGuest ? (
            "Current playback is temporarily unavailable."
          ) : (
            <>
              <a href={getSpotifyLogUrl()}>Reconnect Spotify</a> once to allow
              current playback access.
            </>
          )}
        </Text>
      )}
      {state.status === "error" && (
        <Text size="normal">Could not load current playback.</Text>
      )}
      {state.status === "ready" && !playback && (
        <Text size="normal">Nothing is playing right now.</Text>
      )}
      {playback && (
        <div className={s.player}>
          {playback.album.imageUrl ? (
            <Link className={s.coverLink} to={`/album/${playback.album.id}`}>
              <img
                className={s.cover}
                src={playback.album.imageUrl}
                alt={`${playback.album.name} cover`}
              />
            </Link>
          ) : (
            <div className={s.coverPlaceholder} />
          )}
          <div className={s.details}>
            <div className={s.heading}>
              <div className={s.names}>
                <Link to={`/song/${playback.track.id}`}>
                  <Text element="strong" size="big">
                    {playback.track.name}
                  </Text>
                </Link>
                <div className="subtitle">
                  {playback.artists.map((artist, index) => (
                    <span key={artist.id}>
                      {index > 0 && ", "}
                      <Link to={`/artist/${artist.id}`}>{artist.name}</Link>
                    </span>
                  ))}
                </div>
              </div>
              <Text size="normal">
                {playback.isPlaying ? "Playing" : "Paused"}
              </Text>
            </div>
            <div className={s.progress}>
              <LinearProgress
                variant="determinate"
                value={
                  playback.track.durationMs > 0
                    ? (progressMs / playback.track.durationMs) * 100
                    : 0
                }
              />
              <div className={s.time}>
                <span>{msToDuration(progressMs)}</span>
                <span>{msToDuration(playback.track.durationMs)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </TitleCard>
  );
}

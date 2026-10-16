import type { ReactNode } from "react";
import { useMediaActions } from "./media-actions";
import { ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { SongLink } from "./SongLink";
import { AlbumLink } from "./AlbumLink";
import { ArtistLink } from "./ArtistLink";
import { TrackPlayButton } from "./TrackPlayButton";

export interface MediaInfoProps {
  trackId?: string;
  albumId?: string;
  artistId?: string;
  title: string;
  subTitle?: ReactNode;
  imageUrl?: string;
  publicToken?: string;
  round?: boolean;
  marquee?: boolean;
  truncate?: boolean;
}

export function MediaInfo({
  trackId,
  albumId,
  artistId,
  title,
  subTitle,
  imageUrl,
  publicToken,
  round = Boolean(artistId && !trackId && !albumId),
  marquee = false,
  truncate = false,
}: MediaInfoProps) {
  const renderActions = useMediaActions();
  const cover = (
    <Avatar
      size="lg"
      className={round ? undefined : "rounded-md after:rounded-md"}
    >
      <AvatarImage
        src={imageUrl}
        alt=""
        className="rounded-[inherit]"
        loading="lazy"
      />
      <AvatarFallback className="rounded-[inherit]">
        <ImageIcon aria-hidden="true" className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
  return (
    <div data-slot="media-info" className="flex min-w-0 items-center gap-3">
      <div className="group/media-cover relative shrink-0">
        {albumId ? (
          <AlbumLink
            album={{ id: albumId, name: "View album" }}
            publicToken={publicToken}
          >
            <span className="sr-only">View album</span>
            {cover}
          </AlbumLink>
        ) : (
          cover
        )}
        {trackId && !publicToken && (
          <TrackPlayButton trackId={trackId} title={title} />
        )}
      </div>
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <div className={marquee ? "marquee" : undefined}>
          <p
            className={
              truncate && !marquee
                ? "truncate text-sm font-medium"
                : "text-sm font-medium"
            }
            title={title}
          >
            {trackId ? (
              <SongLink
                song={{ id: trackId, name: title }}
                publicToken={publicToken}
              />
            ) : albumId ? (
              <AlbumLink
                album={{ id: albumId, name: title }}
                publicToken={publicToken}
              />
            ) : artistId ? (
              <ArtistLink
                artist={{ id: artistId, name: title }}
                publicToken={publicToken}
              />
            ) : (
              title
            )}
          </p>
        </div>
        {subTitle != null && (
          <div className={marquee ? "marquee" : undefined}>
            <p
              className={
                truncate && !marquee
                  ? "truncate text-xs text-muted-foreground"
                  : "text-xs text-muted-foreground"
              }
            >
              {artistId && typeof subTitle === "string" ? (
                <ArtistLink
                  artist={{ id: artistId, name: subTitle }}
                  publicToken={publicToken}
                />
              ) : (
                subTitle
              )}
            </p>
          </div>
        )}
      </div>
      {trackId && !publicToken && renderActions?.(trackId, title)}
    </div>
  );
}

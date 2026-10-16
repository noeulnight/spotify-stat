import type { ReactNode } from "react";

export function AlbumLink({
  album,
  publicToken,
  children,
}: {
  album: { id: string; name: string };
  publicToken?: string;
  children?: ReactNode;
}) {
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  return (
    <a
      href={`${prefix}/albums/${encodeURIComponent(album.id)}`}
      className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children ?? album.name}
    </a>
  );
}

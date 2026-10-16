import type { ReactNode } from "react";

export function ArtistLink({
  artist,
  publicToken,
  children,
}: {
  artist: { id: string; name: string };
  publicToken?: string;
  children?: ReactNode;
}) {
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  return (
    <a
      href={`${prefix}/artists/${encodeURIComponent(artist.id)}`}
      className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children ?? artist.name}
    </a>
  );
}

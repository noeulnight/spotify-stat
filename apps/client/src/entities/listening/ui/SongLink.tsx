import type { ReactNode } from "react";

export function SongLink({
  song,
  publicToken,
  children,
}: {
  song: { id: string; name: string };
  publicToken?: string;
  children?: ReactNode;
}) {
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  return (
    <a
      href={`${prefix}/songs/${encodeURIComponent(song.id)}`}
      className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children ?? song.name}
    </a>
  );
}

export function spotifyTrackId(input: string): string | null {
  const value = input.trim();
  const uri = /^spotify:track:([A-Za-z0-9]{22})$/.exec(value);
  if (uri) return uri[1];
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.host !== "open.spotify.com" ||
      url.username ||
      url.password
    )
      return null;
    return (
      /^\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]{22})\/?$/.exec(
        url.pathname,
      )?.[1] ?? null
    );
  } catch {
    return null;
  }
}

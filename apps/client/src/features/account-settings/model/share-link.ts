export function isShareablePage(pathname: string) {
  const path =
    pathname.replace(/^\/share\/[^/]+(?=\/|$)/, "").replace(/\/$/, "") || "/";
  return (
    [
      "/",
      "/recent",
      "/stats",
      "/longest-session",
      "/top/songs",
      "/top/albums",
      "/top/artists",
    ].includes(path) || /^\/(songs|albums|artists)\/[^/]+$/.test(path)
  );
}

export function createShareLink(currentUrl: string, publicToken: string) {
  const url = new URL(currentUrl);
  if (!publicToken || !isShareablePage(url.pathname)) return null;
  const path = url.pathname.replace(/^\/share\/[^/]+(?=\/|$)/, "");
  url.pathname = `/share/${encodeURIComponent(publicToken)}${path === "/" ? "" : path}`;
  return url.href;
}

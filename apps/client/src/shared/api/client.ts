import axios from "axios";

export interface ApiClientOptions {
  baseURL?: string;
  publicToken?: string;
}

// Create a new client when the authenticated account or public access changes.
export function createApiClient({
  baseURL = import.meta.env?.PUBLIC_API_BASE_URL,
  publicToken,
}: ApiClientOptions = {}) {
  if (!baseURL) throw new Error("PUBLIC_API_BASE_URL is required.");
  const relative = /^\/(?!\/)/.test(baseURL);
  const url = relative
    ? new URL(baseURL, "http://localhost")
    : new URL(baseURL);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "API baseURL must be an HTTP(S) URL or root-relative path without credentials, query or hash.",
    );
  }
  const normalizedURL = (relative ? url.pathname : url.href).replace(/\/$/, "");
  return {
    queryKey: ["spotify-api", normalizedURL, crypto.randomUUID()] as const,
    http: axios.create({
      baseURL: normalizedURL,
      withCredentials: true,
      params: publicToken ? { token: publicToken } : {},
    }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

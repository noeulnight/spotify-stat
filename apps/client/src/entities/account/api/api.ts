import type { ApiClient } from "../../../shared/api";
import type { User, AdminAccount, GlobalPreferences, SpotifyMe } from "./types";

export function createAccountApi(client: ApiClient, signal?: AbortSignal) {
  const get = async <T>(
    url: string,
    params: Record<string, unknown> = {},
  ): Promise<T> => (await client.http.get<T>(url, { params, signal })).data;
  return {
    version: () => get<{ update: boolean; version: string }>("/version"),
    me: async () => {
      const account = await get<
        { status: true; user: User } | { status: false }
      >("/me");
      const token = client.http.defaults.params?.token;
      if (token && account.status && account.user.publicToken !== token) {
        return { status: false } as const;
      }
      return account;
    },
    sme: () => get<SpotifyMe>("/oauth/spotify/me"),
    globalPreferences: () => get<GlobalPreferences>("/global/preferences"),
    getAccounts: () => get<AdminAccount[]>("/accounts"),
  };
}

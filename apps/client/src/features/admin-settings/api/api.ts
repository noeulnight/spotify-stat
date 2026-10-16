import type { ApiClient } from "../../../shared/api";
import type { GlobalPreferences } from "../../../entities/account";
export function createAdminSettingsApi(client: ApiClient) {
  const writable = () => {
    if (client.http.defaults.params?.token)
      throw new Error("Shared accounts are read-only");
  };
  return {
    setAdmin: async (id: string, status: boolean) => {
      writable();
      await client.http.put(`/admin/${encodeURIComponent(id)}`, { status });
    },
    deleteAccount: async (id: string) => {
      writable();
      await client.http.delete(`/account/${encodeURIComponent(id)}`);
    },
    savePreferences: async (preferences: Partial<GlobalPreferences>) => {
      writable();
      return (
        await client.http.post<GlobalPreferences>(
          "/global/preferences",
          preferences,
        )
      ).data;
    },
  };
}

import type { ApiClient } from "../../../shared/api";
import type { User } from "../../../entities/account";

export type Settings = Pick<
  User["settings"],
  | "recommendationsEnabled"
  | "historyLine"
  | "preferredStatsPeriod"
  | "nbElements"
  | "metricUsed"
  | "darkMode"
  | "timezone"
  | "dateFormat"
>;

export function createSettingsApi(client: ApiClient) {
  const writable = () => {
    if (client.http.defaults.params?.token)
      throw new Error("Shared accounts are read-only");
  };
  return {
    save: async (settings: Settings) => {
      writable();
      await client.http.post("/settings", {
        ...settings,
        historyLine: String(settings.historyLine),
      });
    },
    rename: async (newName: string) => {
      writable();
      await client.http.put("/rename", { newName });
    },
    createShare: async () => {
      writable();
      return (await client.http.post<string>("/generate-public-token")).data;
    },
    checkShareKey: async (key: string) => {
      writable();
      return (
        await client.http.get<{ key: string; available: boolean }>(
          "/public-token/availability",
          { params: { key } },
        )
      ).data;
    },
    changeShareKey: async (key: string) => {
      writable();
      return (await client.http.put<string>("/public-token", { key })).data;
    },
    revokeShare: async () => {
      writable();
      await client.http.post("/delete-public-token");
    },
  };
}

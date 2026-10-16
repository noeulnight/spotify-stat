import type { ApiClient } from "../../../shared/api";
import type { ImporterState, ImporterStateType } from "./types";

export function createImportHistoryApi(
  client: ApiClient,
  signal?: AbortSignal,
) {
  const get = async <T>(
    url: string,
    params: Record<string, unknown> = {},
  ): Promise<T> => (await client.http.get<T>(url, { params, signal })).data;
  return {
    upload: async (
      type: ImporterStateType,
      files: File[],
      onProgress: (percent: number) => void,
    ) => {
      const body = new FormData();
      for (const file of files) body.append("imports", file);
      await client.http.post(`/import/${type}`, body, {
        onUploadProgress: ({ loaded, total }) => {
          if (total)
            onProgress(Math.min(100, Math.round((loaded / total) * 100)));
        },
      });
    },
    retry: async (id: string) => {
      await client.http.post("/import/retry", { existingStateId: id });
    },
    clean: async (id: string) => {
      await client.http.delete(`/import/clean/${encodeURIComponent(id)}`);
    },
    getImports: () => get<ImporterState[]>("/imports"),
  };
}

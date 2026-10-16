import { useMemo } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createApiClient } from "./client";

function createRuntime(publicToken?: string) {
  return {
    client: createApiClient({ publicToken }),
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    }),
  };
}

const browserRuntimes = new Map<string, ReturnType<typeof createRuntime>>();

export function useApiRuntime(publicToken?: string) {
  return useMemo(() => {
    if (typeof window === "undefined") return createRuntime(publicToken);
    const key = publicToken ?? "";
    let runtime = browserRuntimes.get(key);
    if (!runtime) {
      runtime = createRuntime(publicToken);
      browserRuntimes.set(key, runtime);
    }
    return runtime;
  }, [publicToken]);
}

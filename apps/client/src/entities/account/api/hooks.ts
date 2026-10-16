import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { ApiClient } from "../../../shared/api";
import { createAccountQueries } from "./queries";

export function useAccount(client: ApiClient, queryClient?: QueryClient) {
  return useQuery(createAccountQueries(client).me(), queryClient);
}

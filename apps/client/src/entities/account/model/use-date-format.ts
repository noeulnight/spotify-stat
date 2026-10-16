import { useMemo } from "react";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../api/hooks";
import { createAccountDateFormat } from "./date-format";

export function useDateFormat(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const settings = account.data?.status
    ? account.data.user.settings
    : undefined;
  return useMemo(() => createAccountDateFormat(settings), [settings]);
}

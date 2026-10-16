import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAccount } from "../../entities/account";
import type { ApiClient } from "../../shared/api";

export function AccountTheme({
  client,
  publicToken,
}: {
  client: ApiClient;
  publicToken?: string;
}) {
  const { setTheme } = useTheme();
  const account = useAccount(client);
  const mode =
    !publicToken && account.data?.status
      ? account.data.user.settings?.darkMode
      : undefined;
  useEffect(() => {
    if (mode) setTheme(mode === "follow" ? "system" : mode);
  }, [mode, setTheme]);
  return null;
}

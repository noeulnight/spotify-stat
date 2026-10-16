import { useMutation } from "@tanstack/react-query";
import {
  useAccount,
  createAccountQueries,
  type User,
} from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import { createSettingsApi } from "../api/settings";

export function useSettings() {
  const { client, queryClient } = useApiRuntime();
  const account = useAccount(client, queryClient);
  const api = createSettingsApi(client);
  const update = (transform: (user: User) => User) => {
    queryClient.setQueryData(
      createAccountQueries(client).me().queryKey,
      (current) =>
        current?.status
          ? { ...current, user: transform(current.user) }
          : current,
    );
  };
  const save = useMutation(
    {
      mutationFn: api.save,
      onSuccess: async (_, settings) => {
        update((user) => ({
          ...user,
          settings: { ...user.settings, ...settings },
        }));
        await queryClient.invalidateQueries({
          queryKey: [...client.queryKey, "listening"],
        });
      },
    },
    queryClient,
  );
  const rename = useMutation(
    {
      mutationFn: api.rename,
      onSuccess: (_, username) => update((user) => ({ ...user, username })),
    },
    queryClient,
  );
  const createShare = useMutation(
    {
      mutationFn: api.createShare,
      onSuccess: (publicToken) => update((user) => ({ ...user, publicToken })),
    },
    queryClient,
  );
  const revokeShare = useMutation(
    {
      mutationFn: api.revokeShare,
      onSuccess: () => update((user) => ({ ...user, publicToken: null })),
    },
    queryClient,
  );
  return { account, save, rename, createShare, revokeShare };
}

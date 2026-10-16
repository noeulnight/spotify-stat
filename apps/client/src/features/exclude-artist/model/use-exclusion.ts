import { useMutation } from "@tanstack/react-query";
import { useAccount, createAccountQueries } from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import { createArtistExclusionApi } from "../api/api";
export function useExclusion(publicToken?: string) {
  const { client, queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const ids = account.data?.status
    ? (account.data.user.settings.blacklistedArtists ?? [])
    : [];
  const mutation = useMutation(
    {
      mutationFn: ({ id, excluded }: { id: string; excluded: boolean }) =>
        createArtistExclusionApi(client).setExcluded(id, excluded),
      onSuccess: async (_, { id, excluded }) => {
        queryClient.setQueryData(
          createAccountQueries(client).me().queryKey,
          (current) =>
            current?.status
              ? {
                  ...current,
                  user: {
                    ...current.user,
                    settings: {
                      ...current.user.settings,
                      blacklistedArtists: excluded
                        ? [...new Set([...ids, id])]
                        : ids.filter((entry) => entry !== id),
                    },
                  },
                }
              : current,
        );
        await queryClient.invalidateQueries({
          queryKey: [...client.queryKey, "listening"],
        });
      },
    },
    queryClient,
  );
  return {
    client,
    queryClient,
    account,
    ids,
    mutation,
    writable: !publicToken && account.data?.status === true,
  };
}

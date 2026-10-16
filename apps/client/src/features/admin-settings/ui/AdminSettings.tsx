import { useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useAccount,
  createAccountQueries,
  type AdminAccount,
  type GlobalPreferences,
} from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../shared/ui/dialog";
import { Skeleton } from "../../../shared/ui/skeleton";
import { createAdminSettingsApi } from "../api/api";
export function AdminSettings() {
  const { client, queryClient } = useApiRuntime();
  const account = useAccount(client, queryClient);
  const enabled = account.data?.status === true && account.data.user.admin;
  const queries = createAccountQueries(client);
  const users = useQuery({ ...queries.getAccounts(), enabled }, queryClient);
  const preferences = useQuery(
    { ...queries.globalPreferences(), enabled },
    queryClient,
  );
  const api = createAdminSettingsApi(client);
  const [target, setTarget] = useState<AdminAccount | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const change = useMutation(
    {
      mutationFn: ({ id, status }: { id: string; status: boolean }) =>
        api.setAdmin(id, status),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queries.getAccounts().queryKey,
          }),
          queryClient.invalidateQueries({ queryKey: queries.me().queryKey }),
        ]);
      },
    },
    queryClient,
  );
  const remove = useMutation(
    {
      mutationFn: api.deleteAccount,
      onSuccess: async () => {
        setTarget(null);
        setConfirmation("");
        await queryClient.invalidateQueries({
          queryKey: queries.getAccounts().queryKey,
        });
      },
    },
    queryClient,
  );
  const save = useMutation(
    {
      mutationFn: api.savePreferences,
      onSuccess: (data) =>
        queryClient.setQueryData(queries.globalPreferences().queryKey, data),
    },
    queryClient,
  );
  const clearLyrics = useMutation(
    {
      mutationFn: api.clearLyricsCache,
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: [...client.queryKey, "listening", "lyrics"],
        }),
    },
    queryClient,
  );
  if (!enabled) return null;
  const self = account.data?.status
    ? (account.data.user.id ?? account.data.user._id)
    : "";
  const adminCount = users.data?.filter((user) => user.admin).length ?? 0;
  const busy =
    change.isPending ||
    remove.isPending ||
    save.isPending ||
    clearLyrics.isPending;
  const error = change.error ?? remove.error ?? save.error ?? clearLyrics.error;
  const message =
    isAxiosError(error) &&
    error.response?.data?.code === "CANNOT_HAVE_ZERO_ADMIN"
      ? "At least one administrator is required"
      : "Could not save changes. Try again.";
  return (
    <Card aria-label="Administration">
      <CardHeader>
        <CardTitle>Administration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Lyrics cache</p>
            <p className="text-xs text-muted-foreground">
              Clear cached lyrics for all users.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => clearLyrics.mutate()}
          >
            {clearLyrics.isPending ? "Clearing…" : "Clear lyrics cache"}
          </Button>
        </div>
        {clearLyrics.isSuccess && (
          <p role="status" className="text-sm">
            Lyrics cache cleared
          </p>
        )}
        {preferences.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : preferences.isError ? (
          <div role="alert">
            <p>Could not load preferences</p>
            <Button
              variant="outline"
              onClick={() => void preferences.refetch()}
            >
              Retry preferences
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {(
              [
                { key: "allowRegistrations", label: "New registrations" },
                { key: "allowAffinity", label: "Taste comparison" },
              ] as const
            ).map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm">{label}</span>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={label}
                  aria-pressed={preferences.data?.[key] === true}
                  disabled={busy}
                  onClick={() =>
                    save.mutate({
                      [key]: !preferences.data?.[key],
                    } as Partial<GlobalPreferences>)
                  }
                >
                  {preferences.data?.[key] ? "Enabled" : "Disabled"}
                </Button>
              </div>
            ))}
          </div>
        )}
        {users.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : users.isError ? (
          <div role="alert">
            <p>Could not load accounts</p>
            <Button variant="outline" onClick={() => void users.refetch()}>
              Retry accounts
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {users.data?.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user.username}
                    {user.id === self ? " (you)" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.admin ? "Administrator" : "User"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || (user.admin && adminCount <= 1)}
                    onClick={() =>
                      change.mutate({ id: user.id, status: !user.admin })
                    }
                  >
                    {user.admin ? "Remove admin" : "Make admin"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={
                      busy ||
                      user.id === self ||
                      (user.admin && adminCount <= 1)
                    }
                    onClick={() => {
                      setTarget(user);
                      setConfirmation("");
                      remove.reset();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <Dialog
          open={!!target}
          onOpenChange={(open) => {
            if (!open && !remove.isPending) setTarget(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete account</DialogTitle>
              <DialogDescription>
                This permanently deletes the account. This action cannot be
                undone. Type {target?.username} to confirm.
              </DialogDescription>
            </DialogHeader>
            <label htmlFor="delete-account-name" className="text-sm">
              Account name
            </label>
            <Input
              id="delete-account-name"
              value={confirmation}
              disabled={remove.isPending}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            {remove.isError && (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => setTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={remove.isPending || confirmation !== target?.username}
                onClick={() => {
                  if (target && confirmation === target.username)
                    remove.mutate(target.id);
                }}
              >
                {remove.isPending ? "Deleting…" : "Delete account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

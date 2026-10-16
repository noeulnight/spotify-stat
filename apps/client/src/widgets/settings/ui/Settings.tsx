import { useAccount } from "../../../entities/account";
import { useApiRuntime } from "../../../shared/api";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../shared/ui/tabs";
import { ExcludedArtists } from "../../../features/exclude-artist";
import { AdminSettings } from "../../../features/admin-settings";
import { SpotifyConnection } from "../../../features/spotify-login";
import { AccountSettings } from "../../../features/account-settings";
import { ImportHistory } from "../../../features/import-history";

export function Settings() {
  const { client, queryClient } = useApiRuntime();
  const account = useAccount(client, queryClient);
  if (!account.data?.status) return <AccountSettings />;
  return (
    <Tabs defaultValue="account" className="min-w-0 gap-5">
      <TabsList variant="line" aria-label="Settings sections">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="data">Data</TabsTrigger>
        {account.data.user.admin && (
          <TabsTrigger value="admin">Admin</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="account" keepMounted className="space-y-5">
        <AccountSettings>
          <SpotifyConnection />
        </AccountSettings>
      </TabsContent>
      <TabsContent
        value="data"
        keepMounted
        className="grid items-start gap-5 lg:grid-cols-2"
      >
        <ImportHistory />
        <ExcludedArtists />
      </TabsContent>
      {account.data.user.admin && (
        <TabsContent value="admin" keepMounted>
          <AdminSettings />
        </TabsContent>
      )}
    </Tabs>
  );
}

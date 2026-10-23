import type { IconType } from "react-icons";
import {
  RiAlbumFill,
  RiBarChart2Fill,
  RiHomeFill,
  RiMusic2Fill,
  RiTimeFill,
  RiUser2Fill,
  RiHistoryFill,
  RiSettings3Fill,
  RiMusic2Line,
} from "react-icons/ri";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/shared/ui/sidebar";

import type { ApiClient } from "../../../shared/api";
import { useApiRuntime } from "../../../shared/api";
import { useAccount } from "../../../entities/account";
import { SearchDialog } from "../../../features/search";
import { SidebarFooterContent } from "./SidebarFooterContent";

const menuGroups: {
  label: string;
  items: { label: string; icon: IconType; href?: string }[];
}[] = [
  {
    label: "General",
    items: [
      { label: "Home", icon: RiHomeFill, href: "/" },
      { label: "Recent", icon: RiHistoryFill, href: "/recent" },
      { label: "Stats", icon: RiBarChart2Fill, href: "/stats" },
      { label: "Longest session", icon: RiTimeFill, href: "/longest-session" },
      {
        label: "Recommendations",
        icon: RiMusic2Line,
        href: "/recommendations",
      },
    ],
  },
  {
    label: "Tops",
    items: [
      { label: "Top songs", icon: RiMusic2Fill, href: "/top/songs" },
      { label: "Top albums", icon: RiAlbumFill, href: "/top/albums" },
      { label: "Top artists", icon: RiUser2Fill, href: "/top/artists" },
    ],
  },
];

export function Sidebar({
  client,
  activePath = "/",
  publicToken,
}: {
  client: ApiClient;
  activePath?: string;
  publicToken?: string;
}) {
  const { queryClient } = useApiRuntime(publicToken);
  const account = useAccount(client, queryClient);
  const recommendationsDisabled =
    publicToken &&
    account.data?.status &&
    account.data.user.settings.recommendationsEnabled === false;
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  const pagePath = prefix ? activePath.slice(prefix.length) || "/" : activePath;
  return (
    <SidebarPrimitive variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SearchDialog
              key={publicToken ?? "private"}
              publicToken={publicToken}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter(
                    ({ href }) =>
                      !recommendationsDisabled || href !== "/recommendations",
                  )
                  .map(({ label, icon: Icon, href }) => (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton
                        render={
                          href ? (
                            <a
                              href={
                                prefix
                                  ? `${prefix}${href === "/" ? "" : href}`
                                  : href
                              }
                              aria-current={
                                href === pagePath ? "page" : undefined
                              }
                            />
                          ) : undefined
                        }
                        isActive={href === pagePath}
                      >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {!publicToken && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <a
                        href="/settings"
                        aria-current={
                          pagePath === "/settings" ? "page" : undefined
                        }
                      />
                    }
                    isActive={pagePath === "/settings"}
                  >
                    <RiSettings3Fill aria-hidden="true" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent client={client} publicToken={publicToken} />
      </SidebarFooter>
    </SidebarPrimitive>
  );
}

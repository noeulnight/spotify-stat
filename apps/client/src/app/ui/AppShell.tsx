import { PlaylistActions } from "../../features/save-to-playlist";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { useApiRuntime } from "../../shared/api";
import { Sidebar } from "../../widgets/sidebar";
import { PageBreadcrumb } from "../../widgets/page-breadcrumb";
import { Separator } from "../../shared/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/ui/sidebar";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import { AccountTheme } from "./AccountTheme";

export function AppShell({
  children,
  activePath,
  publicToken,
}: {
  children?: ReactNode;
  activePath: string;
  publicToken?: string;
}) {
  const { client, queryClient } = useApiRuntime(publicToken);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="spotistat-theme"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AccountTheme client={client} publicToken={publicToken} />
        <PlaylistActions>
          <TooltipProvider>
            <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
              <Sidebar
                client={client}
                activePath={activePath}
                publicToken={publicToken}
              />
              <SidebarInset
                id="main-content"
                tabIndex={-1}
                data-scroll-container
                className="min-h-0 min-w-0 overflow-y-auto"
              >
                <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 bg-background px-4">
                  <SidebarTrigger />
                  <Separator
                    orientation="vertical"
                    className="mx-1 h-4 self-center!"
                  />
                  <PageBreadcrumb
                    activePath={activePath}
                    publicToken={publicToken}
                  />
                </header>
                {children}
              </SidebarInset>
              <div id="lyrics-panel-slot" className="contents" />
            </SidebarProvider>
          </TooltipProvider>
        </PlaylistActions>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

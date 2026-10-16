import type { ApiClient } from "../../../shared/api";
import type { ComponentProps } from "react";
import { Button } from "../../../shared/ui/button";

export function LoginButton({
  client,
  label = "Log in with Spotify",
  variant,
  className,
}: {
  client: ApiClient;
  label?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const href = `${client.http.defaults.baseURL}/oauth/spotify`;

  return (
    <Button
      render={<a href={href} data-astro-reload />}
      nativeButton={false}
      variant={variant}
      className={className ?? "w-full"}
    >
      <span className="truncate" title={label}>
        {label}
      </span>
    </Button>
  );
}

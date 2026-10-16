import { ChevronRight } from "lucide-react";
import { buttonVariants } from "../../../shared/ui/button";

export function HomeSectionLink({
  href,
  label,
  publicToken,
}: {
  href: string;
  label: string;
  publicToken?: string;
}) {
  const prefix = publicToken ? `/share/${encodeURIComponent(publicToken)}` : "";
  return (
    <a
      href={`${prefix}${href}`}
      aria-label={label}
      title={label}
      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
    >
      <ChevronRight aria-hidden="true" />
    </a>
  );
}

import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../shared/ui/breadcrumb";
import { usePageBreadcrumb } from "../model/use-page-breadcrumb";

export function PageBreadcrumb({
  activePath,
  publicToken,
}: {
  activePath: string;
  publicToken?: string;
}) {
  const items = usePageBreadcrumb(activePath, publicToken);
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem className="min-w-0">
              {index === items.length - 1 ? (
                <BreadcrumbPage className="truncate" title={item.label}>
                  {item.label}
                </BreadcrumbPage>
              ) : "href" in item ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <span>{item.label}</span>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

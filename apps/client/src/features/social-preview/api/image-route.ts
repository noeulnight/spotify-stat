import type { APIRoute } from "astro";
import { isPreviewKind, previewKinds } from "../model/preview";
import { loadPreview } from "./preview";
import { createPreviewImage } from "../ui/createPreviewImage";

export const getPreviewImage: APIRoute = async ({ params, url, site }) => {
  if (
    !isPreviewKind(params.kind) ||
    !/^[a-zA-Z0-9]{22}$/.test(params.id ?? "")
  ) {
    return new Response("Not found", { status: 404 });
  }
  const preview = await loadPreview(
    params.kind,
    params.id!,
    site ?? url,
    url.searchParams.get("token") || undefined,
  );
  return createPreviewImage(preview, previewKinds[params.kind].label);
};

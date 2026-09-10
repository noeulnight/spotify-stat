import {
  escapeSearchRegex,
  normalizeSearchText,
  searchNgrams,
} from "../../tools/search";
import { CatalogSearchModel } from "../Models";
import { CatalogSearchType } from "../schemas/catalogSearch";

export async function searchCatalogIds(
  type: CatalogSearchType,
  query: string,
  limit: number,
) {
  const normalized = normalizeSearchText(query);
  const results = await CatalogSearchModel.find(
    {
      type,
      nameNgrams: { $all: searchNgrams(query) },
      normalizedName: { $regex: escapeSearchRegex(normalized) },
    },
    { itemId: 1 },
  )
    .limit(limit)
    .lean();
  return results.map((result) => result.itemId);
}

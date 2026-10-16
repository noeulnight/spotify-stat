import { backfillCatalogSearchFields } from "../database/rollups";
import { startMigration } from "../tools/migrations";

export async function up() {
  startMigration("backfill catalog search");
  await backfillCatalogSearchFields();
}

import { startServer } from "./bin/www";
import { connect } from "./database";
import {
  backfillCatalogSearchFields,
  rebuildAllStatsRollups,
} from "./database/rollups";
import { runMigrations } from "./migrations";

if (process.argv[2] === "--migrate") {
  runMigrations();
} else if (process.argv[2] === "--backfill-stats") {
  connect()
    .then(async (connection) => {
      try {
        await backfillCatalogSearchFields();
        await rebuildAllStatsRollups();
      } finally {
        await connection.disconnect();
      }
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
} else {
  startServer();
}

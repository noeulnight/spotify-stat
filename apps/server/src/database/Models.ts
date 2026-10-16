import { model } from "mongoose";

import { AlbumSchema } from "./schemas/album";
import { ArtistSchema } from "./schemas/artist";
import { CatalogSearchSchema } from "./schemas/catalogSearch";
import { GlobalPreferencesSchema } from "./schemas/globalPreference";
import { ImporterStateSchema } from "./schemas/import";
import { InfosSchema } from "./schemas/info";
import { LyricsCacheSchema } from "./schemas/lyricsCache";
import { MigrationSchema } from "./schemas/migration";
import { PrivateDataSchema } from "./schemas/privateData";
import {
  StatsHourlyEntitySchema,
  StatsHourlySummarySchema,
  StatsLifetimeEntitySchema,
  StatsRollupStateSchema,
  StatsYearlyEntitySchema,
} from "./schemas/statsRollup";
import { TrackSchema } from "./schemas/track";
import { UserSchema } from "./schemas/user";

export const UserModel = model("User", UserSchema);
export const InfosModel = model("Infos", InfosSchema);
export const ArtistModel = model("Artist", ArtistSchema);
export const AlbumModel = model("Album", AlbumSchema);
export const TrackModel = model("Track", TrackSchema);
export const LyricsCacheModel = model("LyricsCache", LyricsCacheSchema);
export const CatalogSearchModel = model("CatalogSearch", CatalogSearchSchema);
export const MigrationModel = model("Migration", MigrationSchema);
export const GlobalPreferencesModel = model(
  "GlobalPreference",
  GlobalPreferencesSchema,
);
export const ImporterStateModel = model("ImporterState", ImporterStateSchema);
export const PrivateDataModel = model("PrivateData", PrivateDataSchema);
export const StatsHourlySummaryModel = model(
  "StatsHourlySummary",
  StatsHourlySummarySchema,
);
export const StatsHourlyEntityModel = model(
  "StatsHourlyEntity",
  StatsHourlyEntitySchema,
);
export const StatsLifetimeEntityModel = model(
  "StatsLifetimeEntity",
  StatsLifetimeEntitySchema,
);
export const StatsYearlyEntityModel = model(
  "StatsYearlyEntity",
  StatsYearlyEntitySchema,
);
export const StatsRollupStateModel = model(
  "StatsRollupState",
  StatsRollupStateSchema,
);

import {
  deleteAllInfosFromUserId,
  deleteAllOrphanTracks,
  deleteUser as dbDeleteUser,
} from "../database";
import { deleteStatsRollups } from "../database/rollups";
import { longWriteDbLock } from "./lock";
import { logger } from "./logger";

export const deleteUser = async (userId: string) => {
  logger.info(`Deleting user ${userId}`);
  await longWriteDbLock.lock();
  await deleteAllInfosFromUserId(userId);
  await deleteStatsRollups(userId);
  await dbDeleteUser(userId);
  await deleteAllOrphanTracks();
  longWriteDbLock.unlock();
};

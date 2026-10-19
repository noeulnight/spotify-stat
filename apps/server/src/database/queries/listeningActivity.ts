import { getWithDefault } from "../../tools/env";
import {
  summarizeListeningActivity,
  ListeningDay,
} from "../../tools/listening-activity";
import { InfosModel } from "../Models";
import { User } from "../schemas/user";

export async function getListeningActivity(
  user: User,
  filter: { id: string } | { primaryArtistId: string },
) {
  const timezone =
    user.settings.timezone ?? getWithDefault("TIMEZONE", "Europe/Paris");
  const now = new Date();
  const days = await InfosModel.aggregate<ListeningDay>([
    { $match: { owner: user._id, ...filter, played_at: { $lte: now } } },
    {
      $group: {
        _id: {
          $dateToString: { date: "$played_at", format: "%Y-%m-%d", timezone },
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return summarizeListeningActivity(days, today);
}

export function getArtistPlayCount(user: User, artistId: string) {
  return InfosModel.countDocuments({
    owner: user._id,
    primaryArtistId: artistId,
  });
}

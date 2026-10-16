import type { Settings } from "../api/settings";

export function validateSettings(settings: Settings) {
  if (
    !Number.isInteger(settings.nbElements) ||
    settings.nbElements < 5 ||
    settings.nbElements > 50
  )
    return "Enter a count from 5 to 50";
  try {
    new Intl.DateTimeFormat(
      settings.dateFormat === "default" ? undefined : settings.dateFormat,
      settings.timezone ? { timeZone: settings.timezone } : undefined,
    );
  } catch {
    return "Enter a valid time zone and date locale";
  }
  return null;
}

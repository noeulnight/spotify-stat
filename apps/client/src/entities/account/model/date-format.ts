import type { User } from "../api/types";

export function createAccountDateFormat(
  settings?: Pick<User["settings"], "dateFormat" | "timezone">,
) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  try {
    return new Intl.DateTimeFormat(
      settings?.dateFormat && settings.dateFormat !== "default"
        ? settings.dateFormat
        : undefined,
      {
        ...options,
        ...(settings?.timezone ? { timeZone: settings.timezone } : {}),
      },
    );
  } catch {
    return new Intl.DateTimeFormat("en", options);
  }
}

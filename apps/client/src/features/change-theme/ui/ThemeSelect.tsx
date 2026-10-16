import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Select, SelectContent, SelectItem } from "../../../shared/ui/select";

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];
const subscribe = () => () => {};

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const Icon =
    mounted && theme === "light"
      ? SunIcon
      : mounted && theme === "dark"
        ? MoonIcon
        : MonitorIcon;

  return (
    <Select
      items={themes}
      value={mounted ? (theme ?? "system") : "system"}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
    >
      <SelectPrimitive.Trigger
        aria-label="Theme"
        title="Theme"
        disabled={!mounted}
        // Firefox must not restore the previous enabled state before hydration.
        render={
          <Button variant="ghost" size="icon" {...{ autoComplete: "off" }} />
        }
      >
        <Icon aria-hidden="true" />
      </SelectPrimitive.Trigger>
      <SelectContent align="end">
        {themes.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

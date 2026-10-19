import { useState, type ReactNode } from "react";
import type { User } from "../../../entities/account";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { PageSkeleton } from "../../../shared/ui/page-skeleton";
import { useSettings } from "../model/use-settings";
import { validateSettings } from "../model/validation";
import type { Settings } from "../api/settings";
import { ShareKeyEditor } from "./ShareKeyEditor";
import { SettingsSelect } from "./SettingsSelect";

export function AccountSettings({ children }: { children?: ReactNode }) {
  const state = useSettings();
  if (state.account.isPending) return <PageSkeleton layout="list" />;
  if (state.account.isError)
    return (
      <div className="space-y-3" role="alert">
        <p>Account unavailable</p>
        <Button onClick={() => void state.account.refetch()}>Retry</Button>
      </div>
    );
  if (!state.account.data.status)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Log in to edit settings
      </p>
    );
  return (
    <SettingsForm
      key={state.account.data.user.id}
      user={state.account.data.user}
      state={state}
      children={children}
    />
  );
}

function SettingsForm({
  user,
  state,
  children,
}: {
  user: User;
  state: ReturnType<typeof useSettings>;
  children?: ReactNode;
}) {
  const [name, setName] = useState(user.username);
  const [draft, setDraft] = useState<Settings>(() => ({
    historyLine: user.settings.historyLine ?? false,
    preferredStatsPeriod: user.settings.preferredStatsPeriod ?? "month",
    nbElements: user.settings.nbElements ?? 10,
    metricUsed: user.settings.metricUsed ?? "number",
    darkMode: user.settings.darkMode ?? "follow",
    timezone:
      user.settings.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: user.settings.dateFormat ?? "default",
  }));
  const [validation, setValidation] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const shareUrl = user.publicToken
    ? `${window.location.origin}/share/${encodeURIComponent(user.publicToken)}`
    : "";
  const field = (key: keyof Settings, value: Settings[keyof Settings]) => {
    setDraft({ ...draft, [key]: value });
    setValidation(null);
    state.save.reset();
  };
  const zones = Intl.supportedValuesOf("timeZone");
  const shareBusy =
    state.createShare.isPending ||
    state.revokeShare.isPending ||
    state.changeShareKey.isPending;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <div className="min-w-0 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim().length >= 2) state.rename.mutate(name.trim());
              }}
            >
              <label htmlFor="settings-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="settings-name"
                value={name}
                minLength={2}
                maxLength={64}
                required
                onChange={(event) => {
                  setName(event.target.value);
                  state.rename.reset();
                }}
              />
              <Button
                type="submit"
                disabled={
                  state.rename.isPending ||
                  name.trim() === user.username ||
                  name.trim().length < 2
                }
              >
                Save name
              </Button>
              {state.rename.isError && <p role="alert">Could not save name</p>}
              {state.rename.isSuccess && <p role="status">Name saved</p>}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Anyone with the link can view your listening history and
              statistics.
            </p>
            {shareUrl ? (
              <>
                <Input aria-label="Share link" readOnly value={shareUrl} />
                <ShareKeyEditor
                  key={user.publicToken}
                  currentKey={user.publicToken!}
                  state={state}
                  disabled={shareBusy}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      void navigator.clipboard.writeText(shareUrl).then(
                        () => setCopied("Link copied"),
                        () => setCopied("Could not copy link"),
                      )
                    }
                  >
                    Copy link
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={shareBusy}
                    onClick={() => {
                      setCopied(null);
                      state.revokeShare.mutate();
                    }}
                  >
                    Disable sharing
                  </Button>
                </div>
              </>
            ) : (
              <Button
                disabled={shareBusy}
                onClick={() => {
                  setCopied(null);
                  state.createShare.mutate();
                }}
              >
                Enable sharing
              </Button>
            )}
            {state.changeShareKey.isSuccess && (
              <p role="status">
                Sharing key saved. The previous link no longer works.
              </p>
            )}
            {copied && <p role="status">{copied}</p>}
            {(state.createShare.isError || state.revokeShare.isError) && (
              <p role="alert">Could not update sharing</p>
            )}
          </CardContent>
        </Card>
        {children}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const error = validateSettings(draft);
              setValidation(error);
              if (!error) state.save.mutate(draft);
            }}
          >
            <fieldset
              disabled={state.save.isPending}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <label htmlFor="settings-metric">Statistics metric</label>
                <SettingsSelect
                  id="settings-metric"
                  value={draft.metricUsed}
                  onChange={(value) => field("metricUsed", value)}
                  items={[
                    { value: "number", label: "Plays" },
                    { value: "duration", label: "Listening time" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-period">Default period</label>
                <SettingsSelect
                  id="settings-period"
                  value={draft.preferredStatsPeriod}
                  onChange={(value) => field("preferredStatsPeriod", value)}
                  items={[
                    { value: "day", label: "Day" },
                    { value: "week", label: "Week" },
                    { value: "month", label: "Month" },
                    { value: "year", label: "Year" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-count">Items per chart</label>
                <Input
                  id="settings-count"
                  type="number"
                  min={5}
                  max={50}
                  step={1}
                  required
                  value={draft.nbElements}
                  onChange={(event) =>
                    field("nbElements", Number(event.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-history">History chart</label>
                <SettingsSelect
                  id="settings-history"
                  value={String(draft.historyLine)}
                  onChange={(value) => field("historyLine", value === "true")}
                  items={[
                    { value: "true", label: "Line" },
                    { value: "false", label: "Bar" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-theme">Theme</label>
                <SettingsSelect
                  id="settings-theme"
                  value={draft.darkMode}
                  onChange={(value) => field("darkMode", value)}
                  items={[
                    { value: "follow", label: "System" },
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-locale">Date locale</label>
                <Input
                  id="settings-locale"
                  list="settings-locales"
                  required
                  value={draft.dateFormat}
                  onChange={(event) => field("dateFormat", event.target.value)}
                />
                <datalist id="settings-locales">
                  {["default", "en-US", "en-GB", "ko-KR", "ja-JP", "de-DE"].map(
                    (value) => (
                      <option key={value} value={value} />
                    ),
                  )}
                </datalist>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="settings-timezone">Time zone</label>
                <Input
                  id="settings-timezone"
                  list="settings-timezones"
                  required
                  value={draft.timezone ?? ""}
                  onChange={(event) => field("timezone", event.target.value)}
                />
                <datalist id="settings-timezones">
                  {zones.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Used to group listening statistics.
                </p>
              </div>
            </fieldset>
            <Button type="submit" disabled={state.save.isPending}>
              {state.save.isPending ? "Saving…" : "Save preferences"}
            </Button>
            {(validation || state.save.isError) && (
              <p role="alert">{validation ?? "Could not save preferences"}</p>
            )}
            {state.save.isSuccess && <p role="status">Preferences saved</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import type { useSettings } from "../model/use-settings";
import { validateShareKey } from "../model/validation";

export function ShareKeyEditor({
  currentKey,
  state,
  disabled,
}: {
  currentKey: string;
  state: ReturnType<typeof useSettings>;
  disabled: boolean;
}) {
  const [key, setKey] = useState(currentKey);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void Promise.all([
      import("@material/web/textfield/outlined-text-field.js"),
      import("@material/web/button/filled-button.js"),
      import("@material/web/button/outlined-button.js"),
    ]).then(() => setReady(true));
  }, []);
  const validation = validateShareKey(key);
  const checked = state.checkShareKey.data;
  const saveConflict =
    isAxiosError(state.changeShareKey.error) &&
    state.changeShareKey.error.response?.status === 409;
  const available = checked?.key === key && checked.available && !saveConflict;
  const conflict = checked?.key === key && !checked.available;
  const changed = key !== currentKey;
  const busy = disabled || state.checkShareKey.isPending;
  const saveError = state.changeShareKey.isError
    ? saveConflict
      ? "This key is already in use. Choose another key and check again."
      : "Could not save the key. Try again."
    : null;
  return (
    <form
      className="space-y-3 [--md-ref-typeface-brand:var(--font-sans)] [--md-ref-typeface-plain:var(--font-sans)]"
      aria-label="Change sharing key"
      aria-busy={!ready || busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (available && !validation && changed && !busy)
          state.changeShareKey.mutate(key);
      }}
    >
      <md-outlined-text-field
        className="w-full"
        label="Sharing key"
        value={key}
        required
        maxLength={64}
        disabled={!ready || busy}
        supporting-text="3–64 letters, numbers, hyphens or underscores. Keys are case-sensitive."
        onInput={(event) => {
          setKey(
            (event.currentTarget as HTMLElement & { value: string }).value,
          );
          state.checkShareKey.reset();
          state.changeShareKey.reset();
        }}
      />
      <div className="flex flex-wrap gap-2">
        <md-outlined-button
          type="button"
          disabled={!ready || busy || !changed || !!validation}
          onClick={() => {
            state.changeShareKey.reset();
            state.checkShareKey.mutate(key);
          }}
        >
          {state.checkShareKey.isPending ? "Checking…" : "Check availability"}
        </md-outlined-button>
        <md-filled-button
          type="submit"
          disabled={!ready || busy || !changed || !available || !!validation}
        >
          {state.changeShareKey.isPending ? "Saving…" : "Save sharing key"}
        </md-filled-button>
      </div>
      {changed && validation && (
        <p role="alert" className="text-sm">
          {validation}
        </p>
      )}
      {conflict && (
        <p role="alert" className="text-sm">
          This key is already in use.
        </p>
      )}
      {available && !state.changeShareKey.isError && (
        <p role="status" className="text-sm">
          This key is available.
        </p>
      )}
      {state.checkShareKey.isError && (
        <p role="alert" className="text-sm">
          Could not check availability. Try again.
        </p>
      )}
      {saveError && (
        <p role="alert" className="text-sm">
          {saveError}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Saving a new key disables the previous share link.
      </p>
    </form>
  );
}

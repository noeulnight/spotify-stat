import { useId, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
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
  const fieldId = useId();
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
      className="space-y-3"
      aria-label="Change sharing key"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (available && !validation && changed && !busy)
          state.changeShareKey.mutate(key);
      }}
    >
      <label htmlFor={fieldId} className="text-sm font-medium">
        Sharing key
      </label>
      <Input
        id={fieldId}
        value={key}
        required
        minLength={3}
        maxLength={64}
        disabled={busy}
        aria-invalid={!!((changed && validation) || conflict || saveConflict)}
        aria-describedby={`${fieldId}-hint`}
        onChange={(event) => {
          setKey(event.target.value);
          state.checkShareKey.reset();
          state.changeShareKey.reset();
        }}
      />
      <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
        3–64 letters, numbers, hyphens or underscores. Keys are case-sensitive.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          type="button"
          disabled={busy || !changed || !!validation}
          onClick={() => {
            state.changeShareKey.reset();
            state.checkShareKey.mutate(key);
          }}
        >
          {state.checkShareKey.isPending ? "Checking…" : "Check availability"}
        </Button>
        <Button
          type="submit"
          disabled={busy || !changed || !available || !!validation}
        >
          {state.changeShareKey.isPending ? "Saving…" : "Save sharing key"}
        </Button>
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

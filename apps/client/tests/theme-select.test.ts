import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { ThemeSelect } from "../src/features/change-theme";

test("theme trigger prevents Firefox from restoring disabled state before hydration", () => {
  const html = renderToString(createElement(ThemeSelect));
  const trigger = html.match(/<button\b[^>]*>/)?.[0];
  assert.ok(trigger);
  assert.match(trigger, /disabled=""/);
  assert.match(trigger, /autoComplete="off"/i);
});

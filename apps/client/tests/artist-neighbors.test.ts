import assert from "node:assert/strict";
import test from "node:test";
import { getRankedNeighbors } from "../src/entities/listening";

test("artist arrows use the current artist's position in the backend rank window", () => {
  const results = ["a", "b", "c"].map((id) => ({ id }));
  assert.deepEqual(getRankedNeighbors("b", { index: 5, results }), {
    position: 6,
    previous: "a",
    next: "c",
  });
  assert.deepEqual(getRankedNeighbors("a", { index: 0, results }), {
    position: 1,
    previous: undefined,
    next: "b",
  });
  assert.deepEqual(
    getRankedNeighbors("c", { index: 9, results: results.slice(1) }),
    { position: 10, previous: "b", next: undefined },
  );
  assert.deepEqual(
    getRankedNeighbors("a", { index: 0, results: [{ id: "a" }] }),
    { position: 1, previous: undefined, next: undefined },
  );
  assert.deepEqual(getRankedNeighbors("missing", { index: -1, results }), {});
  assert.deepEqual(getRankedNeighbors("missing", { index: 0, results }), {});
  assert.deepEqual(getRankedNeighbors("a", undefined), {});
});

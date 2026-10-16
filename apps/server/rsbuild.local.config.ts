import { defineConfig } from "@rsbuild/core";

export default defineConfig({
  source: { entry: { local: "./src/local-readonly.ts" } },
  output: { distPath: "./build-local", target: "node" },
});

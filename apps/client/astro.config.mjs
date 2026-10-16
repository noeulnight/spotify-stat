// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.SITE_URL,
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  server: { host: "127.0.0.1", allowedHosts: true },
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: process.env.API_BASE_URL || "http://127.0.0.1:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ""),
          cookieDomainRewrite: "",
        },
      },
    },
  },
});

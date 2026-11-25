import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    preact(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Aphelion — Stellar Cold Key Vault",
        short_name: "Aphelion",
        description: "Air-gapped Stellar Hierarchical Deterministic (HD) Cold Key Vault",
        theme_color: "#071324",
        background_color: "#071324",
        display: "standalone",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  server: {
    fs: {
      allow: [".."],
    },
  },
});

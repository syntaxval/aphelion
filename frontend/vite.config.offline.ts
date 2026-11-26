import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [
    preact(),
    viteSingleFile(),
    {
      name: "strict-offline-csp",
      transformIndexHtml(html) {
        return html.replace("connect-src 'self'", "connect-src 'none'");
      },
    },
  ],
  build: {
    outDir: "dist-offline",
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});

import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/,
// so production builds need that repo name as the base path. Dev server stays at "/".
// If you rename the repo, update GH_PAGES_REPO to match.
const GH_PAGES_REPO = "bobby-s-routine-app";

export default defineConfig(({ command }) => ({
  base: command === "build" ? `/${GH_PAGES_REPO}/` : "/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        injectionPoint: undefined,
      },
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Encore",
        short_name: "Encore",
        description: "Daily habit log, idea capture, and insights — offline-first.",
        theme_color: "#14151f",
        background_color: "#14151f",
        display: "standalone",
        orientation: "portrait",
        // Relative to the manifest's own URL (which lives under the base path),
        // so these resolve correctly regardless of the exact repo name.
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
}));

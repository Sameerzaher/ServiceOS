import type { MetadataRoute } from "next";

/** Matches UI chrome (nav) and `themeColor` in layout. */
const THEME_COLOR = "#171717";

/**
 * Web app manifest (served at `/manifest.webmanifest`).
 * `dir` / `lang` align with `layout.tsx` for RTL Hebrew.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ServiceOS",
    short_name: "ServiceOS",
    description: "ניהול תלמידים, שיעורים והגדרות — ServiceOS",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: THEME_COLOR,
    dir: "rtl",
    lang: "he",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

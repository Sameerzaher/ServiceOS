import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  /** Cache client navigations so App Router routes work offline after first visit. */
  cacheOnFrontEndNav: true,
  /** When both network and cache fail, show a friendly offline page (must exist at this path). */
  fallbacks: {
    document: "/offline",
  },
});

const isVercel = process.env.VERCEL === "1";
const isWin = process.platform === "win32";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * On some Windows setups, `next build` fails during "Collecting build traces"
   * with ENOENT for `.nft.json` / rename under `.next`. Disabling tracing avoids
   * that flake. Vercel/Linux builds should keep tracing on so the serverless
   * bundle includes the app correctly (avoids `clientReferenceManifest` / `clientModules` crashes).
   */
  outputFileTracing: isVercel || !isWin,

  /**
   * Avoid server async chunks (`./<id>.js`) that can go missing under Windows
   * dev HMR / parallel workers (`MODULE_NOT_FOUND` from webpack-runtime).
   * Do not force this on Vercel/Linux server builds — it can break the client
   * reference manifest used by App Router RSC (`Cannot read ... 'clientModules'`).
   */
  webpack: (config, { dev, isServer }) => {
    const disableSplitChunks =
      (!isServer && dev) || (isServer && isWin);
    if (disableSplitChunks) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);

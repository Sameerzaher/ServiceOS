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

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * On some Windows setups, `next build` fails during "Collecting build traces"
   * with ENOENT for `.nft.json` / rename under `.next`. Disabling tracing avoids
   * that flake (larger deploy image if you use `output: 'standalone'` elsewhere).
   */
  outputFileTracing: false,

  /**
   * Avoid server async chunks (`./<id>.js`) that can go missing under Windows
   * dev HMR / parallel workers (`MODULE_NOT_FOUND` from webpack-runtime).
   * Slightly larger server bundles; stable requires at runtime.
   */
  webpack: (config, { dev, isServer }) => {
    /**
     * Server: always disable async chunks (Windows missing `./<id>.js`).
     * Client dev: same issue manifests as `originalFactory is undefined` /
     * broken HMR when split chunks desync. Prod client keeps default splitting.
     */
    if (isServer || (!isServer && dev)) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);

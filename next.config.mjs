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
const nextConfig = {};

export default withPWA(nextConfig);

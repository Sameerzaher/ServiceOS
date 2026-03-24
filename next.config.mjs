import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  /** Cache client navigations so App Router routes work offline after first visit. */
  cacheOnFrontEndNav: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);

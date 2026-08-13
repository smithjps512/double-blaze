/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace packages ship TypeScript source rather than a build artifact, so
  // Next compiles them alongside the app. Keeps the packages editable without a
  // build step between changing one and seeing it work.
  transpilePackages: [
    "@double-blaze/site-db",
    "@double-blaze/site-render",
    "@double-blaze/site-schema",
  ],
};

export default nextConfig;

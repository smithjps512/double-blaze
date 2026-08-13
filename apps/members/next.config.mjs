/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    "@double-blaze/site-db",
    "@double-blaze/site-render",
    "@double-blaze/site-schema",
  ],
};

export default nextConfig;

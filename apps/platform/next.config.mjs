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
  // Short links for the Period 3 smart cities, so a student who types
  // /demo/drone-town still lands on the city.
  async redirects() {
    const hub = "/demo/period-3-smart-cities";
    const cities = ["connection-center-city", "solar-city", "sensor-street", "clock-tower-square"];
    return [
      { source: "/demo/smart-cities", destination: `${hub}/`, permanent: false },
      // Solar City was called Drone Town until its designers named it.
      { source: "/demo/drone-town", destination: `${hub}/solar-city/`, permanent: false },
      { source: `${hub}/drone-town`, destination: `${hub}/solar-city/`, permanent: false },
      { source: `${hub}/drone-town/index.html`, destination: `${hub}/solar-city/`, permanent: false },
      ...cities.map((city) => ({ source: `/demo/${city}`, destination: `${hub}/${city}/`, permanent: false })),
    ];
  },
};

export default nextConfig;

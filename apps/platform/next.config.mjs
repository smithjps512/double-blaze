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
  // /demo/rowantopia lands on the city, and old addresses keep working.
  async redirects() {
    const hub = "/demo/period-3-smart-cities";
    const cities = [
      "connection-center-city", "solar-city", "romanville", "smithsburg", "roseville",
      "gamersville", "smart-yale-city", "rowantopia", "blueprint-city",
    ];
    // Early names, before each team's slide deck named its city.
    const renamed = { "drone-town": "solar-city", "sensor-street": "romanville", "clock-tower-square": "smithsburg" };
    return [
      { source: "/demo/smart-cities", destination: `${hub}/`, permanent: false },
      ...cities.map((city) => ({ source: `/demo/${city}`, destination: `${hub}/${city}/`, permanent: false })),
      ...Object.entries(renamed).flatMap(([old, city]) => [
        { source: `/demo/${old}`, destination: `${hub}/${city}/`, permanent: false },
        { source: `${hub}/${old}`, destination: `${hub}/${city}/`, permanent: false },
        { source: `${hub}/${old}/index.html`, destination: `${hub}/${city}/`, permanent: false },
      ]),
    ];
  },

};

export default nextConfig;

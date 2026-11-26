import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Welcome to Joe's",
    short_name: "Joe's",
    start_url: "/",
    display: "fullscreen",
    background_color: "#FFF8F1",
    theme_color: "#C42242",
    icons: [{ src: "/joes-logo.png", sizes: "384x400", type: "image/png" }],
  };
}

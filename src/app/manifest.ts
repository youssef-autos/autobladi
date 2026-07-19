import type { MetadataRoute } from "next"

/**
 * PWA manifest. Lets mobile browsers prompt users to add the site to
 * their home screen with the right name, icon, and theme color.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "autobladi.ma — Le marché auto au Maroc",
    short_name: "autobladi",
    description:
      "Achat et vente de voitures au Maroc. Estimation gratuite par IA, showrooms professionnels.",
    start_url: "/ar",
    display: "standalone",
    background_color: "#fdfaf5",
    theme_color: "#c1272d",
    icons: [
      {
        src: "/icons/logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}

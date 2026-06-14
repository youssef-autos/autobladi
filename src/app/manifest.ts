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
      "Achat et vente de voitures au Maroc. Estimation gratuite par IA, concessions vérifiées.",
    start_url: "/ar",
    display: "standalone",
    background_color: "#fdfaf5",
    theme_color: "#c1272d",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}

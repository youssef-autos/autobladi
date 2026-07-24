const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

/**
 * Builds the `alternates` block for a page's metadata: a self-referencing
 * canonical plus hreflang links to every locale (and x-default → French, the
 * site's default). Use for every public, indexable page so Google/Bing serve
 * the right language version and the ar/fr copies don't compete.
 *
 * @param locale current locale ("ar" | "fr")
 * @param path   path WITHOUT the locale prefix, starting with "/"
 *               (e.g. "/annonces/dacia-duster-2024"); use "" for the home page.
 */
export function localeAlternates(locale: string, path: string) {
  const clean = path === "/" ? "" : path
  return {
    canonical: `${SITE_URL}/${locale}${clean}`,
    languages: {
      ar: `${SITE_URL}/ar${clean}`,
      fr: `${SITE_URL}/fr${clean}`,
      "x-default": `${SITE_URL}/fr${clean}`,
    },
  }
}

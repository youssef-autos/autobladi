/**
 * Typed builders for the schema.org / JSON-LD blobs we embed on every
 * SEO-sensitive page. Keeping them here (instead of inline in pages)
 * makes it easy to:
 *   - share fields like the publisher / site URL
 *   - audit which schemas exist (search this file)
 *   - test the output shape if we ever add unit tests
 *
 * All builders return a plain serializable object. Render with
 * <JsonLd data={...} /> from `@/components/seo/JsonLd`.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

const ORG = {
  "@type": "Organization",
  name: "autobladi.ma",
  url: SITE_URL,
  logo: `${SITE_URL}/icons/logo-512.png`,
} as const

// ---------------------------------------------------------------------------
// Organization — placed once at the root layout
// ---------------------------------------------------------------------------
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "autobladi.ma",
    url: SITE_URL,
    logo: `${SITE_URL}/icons/logo-512.png`,
    sameAs: [
      "https://www.facebook.com/autobladi",
      "https://www.instagram.com/autobladi",
      "https://www.youtube.com/@autobladi",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "MA",
      addressLocality: "Casablanca",
    },
  }
}

// ---------------------------------------------------------------------------
// WebSite + SearchAction — placed once on the home page
// ---------------------------------------------------------------------------
export function websiteSchema(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "autobladi.ma",
    url: SITE_URL,
    inLanguage: locale === "fr" ? "fr-MA" : "ar-MA",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}/annonces?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

// ---------------------------------------------------------------------------
// Vehicle — annonce detail page
// ---------------------------------------------------------------------------
export type VehicleInput = {
  locale: string
  slug: string
  title: string
  description?: string | null
  brandName?: string | null
  modelName?: string | null
  year?: number | null
  mileage?: number | null
  fuelType?: string | null
  transmission?: string | null
  color?: string | null
  doors?: number | null
  price?: number | null
  sellerName?: string | null
  cityName?: string | null
  images: string[]
  publishedAt?: string | null
}

export function vehicleSchema(v: VehicleInput) {
  const url = `${SITE_URL}/${v.locale}/annonces/${v.slug}`
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: v.title,
    url,
    image: v.images.length > 0 ? v.images : undefined,
  }
  if (v.description) data.description = v.description.slice(0, 5000)
  if (v.brandName) {
    data.brand = { "@type": "Brand", name: v.brandName }
    if (v.modelName) {
      data.model = v.modelName
    }
  }
  if (v.year) data.vehicleModelDate = String(v.year)
  if (typeof v.mileage === "number") {
    data.mileageFromOdometer = {
      "@type": "QuantitativeValue",
      value: v.mileage,
      unitCode: "KMT",
    }
  }
  if (v.fuelType) data.fuelType = v.fuelType
  if (v.transmission) data.vehicleTransmission = v.transmission
  if (v.color) data.color = v.color
  if (typeof v.doors === "number") data.numberOfDoors = v.doors
  if (typeof v.price === "number") {
    data.offers = {
      "@type": "Offer",
      price: v.price,
      priceCurrency: "MAD",
      availability: "https://schema.org/InStock",
      url,
      seller: v.sellerName
        ? { "@type": "Person", name: v.sellerName }
        : ORG,
      ...(v.cityName && {
        areaServed: { "@type": "City", name: v.cityName },
      }),
    }
  }
  if (v.publishedAt) data.datePosted = v.publishedAt
  return data
}

// ---------------------------------------------------------------------------
// AutoDealer / LocalBusiness — professionnel detail
// ---------------------------------------------------------------------------
export type AutoDealerInput = {
  locale: string
  slug: string
  name: string
  description?: string | null
  logoUrl?: string | null
  coverUrl?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  cityName?: string | null
  latitude?: number | null
  longitude?: number | null
  rating?: number | null
  reviewsCount?: number | null
}

export function autoDealerSchema(d: AutoDealerInput) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: d.name,
    url: `${SITE_URL}/${d.locale}/professionnel/${d.slug}`,
  }
  if (d.description) data.description = d.description.slice(0, 5000)
  if (d.logoUrl) data.image = d.logoUrl
  if (d.phone) data.telephone = d.phone
  if (d.email) data.email = d.email
  if (d.website) data.sameAs = [d.website]
  if (d.address || d.cityName) {
    data.address = {
      "@type": "PostalAddress",
      ...(d.address && { streetAddress: d.address }),
      ...(d.cityName && { addressLocality: d.cityName }),
      addressCountry: "MA",
    }
  }
  if (typeof d.latitude === "number" && typeof d.longitude === "number") {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: d.latitude,
      longitude: d.longitude,
    }
  }
  if (
    typeof d.rating === "number" &&
    typeof d.reviewsCount === "number" &&
    d.reviewsCount > 0
  ) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: d.rating,
      reviewCount: d.reviewsCount,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return data
}

// ---------------------------------------------------------------------------
// Article — blog detail page
// ---------------------------------------------------------------------------
export type ArticleInput = {
  locale: string
  slug: string
  title: string
  description?: string | null
  imageUrl?: string | null
  authorName?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
}

export function articleSchema(a: ArticleInput) {
  const url = `${SITE_URL}/${a.locale}/blog/${a.slug}`
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  }
  if (a.description) data.description = a.description.slice(0, 5000)
  if (a.imageUrl) data.image = [a.imageUrl]
  if (a.publishedAt) data.datePublished = a.publishedAt
  if (a.updatedAt) data.dateModified = a.updatedAt
  if (a.authorName) {
    data.author = { "@type": "Person", name: a.authorName }
  }
  data.publisher = ORG
  return data
}

// ---------------------------------------------------------------------------
// BreadcrumbList — any page with breadcrumbs
// ---------------------------------------------------------------------------
export type BreadcrumbItem = { name: string; url: string }

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ---------------------------------------------------------------------------
// CollectionPage — annonces / professionnels listing pages
// ---------------------------------------------------------------------------
export function collectionSchema(opts: {
  locale: string
  path: string
  name: string
  description: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}/${opts.locale}${opts.path}`,
    inLanguage: opts.locale === "fr" ? "fr-MA" : "ar-MA",
  }
}

// ---------------------------------------------------------------------------
// FAQPage — eligible for Google FAQ rich results + cited by AI engines.
// Feed it short, self-contained Q/A pairs.
// ---------------------------------------------------------------------------
export type FaqItem = { question: string; answer: string }

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  }
}

// ---------------------------------------------------------------------------
// ItemList — listing/grid pages (annonces, professionnels) so search engines
// understand the page as an ordered collection of items.
// ---------------------------------------------------------------------------
export type ItemListEntry = { url: string; name: string }

export function itemListSchema(items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: it.url,
      name: it.name,
    })),
  }
}

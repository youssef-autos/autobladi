import type { Metadata } from "next"
import { Cairo, Inter, Playfair_Display, Tajawal } from "next/font/google"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { DirectionProvider } from "@base-ui/react/direction-provider"

import { JsonLd } from "@/components/seo/JsonLd"
import { FavoritesProvider } from "@/hooks/use-favorites"
import { Toaster } from "@/components/ui/sonner"
import { routing } from "@/i18n/routing"
import { getSiteFaviconUrl, getSiteVerification } from "@/lib/queries/home"
import { organizationSchema } from "@/lib/seo/structured-data"
import { cn } from "@/lib/utils"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
})

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * Per-locale metadata. The root [locale]/layout owns everything except
 * page-specific overrides; pages then narrow title / description /
 * openGraph via their own generateMetadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const ar = locale === "ar"

  // Admin-configurable favicon (falls back to the static app/icon.tsx).
  const faviconUrl = await getSiteFaviconUrl()
  // Admin-entered search-engine verification codes (GSC + Bing).
  const verify = await getSiteVerification()

  const titleDefault = ar
    ? "autobladi.ma — بيع وشراء السيارات في المغرب"
    : "autobladi.ma — Achat et vente de voitures au Maroc"
  const description = ar
    ? "موقعك الأول لبيع وشراء السيارات الجديدة والمستعملة في المغرب. تقدير مجاني بالذكاء الاصطناعي، معارض موثّقة، تواصل آمن مباشر."
    : "La 1ère plateforme pour acheter et vendre des voitures neuves et d'occasion au Maroc. Estimation gratuite par IA, concessions vérifiées, contact direct sécurisé."

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: titleDefault,
      template: "%s · autobladi.ma",
    },
    description,
    keywords: ar
      ? [
          "سيارات المغرب",
          "بيع سيارات",
          "شراء سيارات",
          "سيارات مستعملة",
          "سيارات جديدة",
          "معارض السيارات",
          "تقدير سعر السيارة",
          "autobladi",
        ]
      : [
          "voitures Maroc",
          "achat voiture",
          "vente voiture",
          "occasion Maroc",
          "voiture neuve",
          "professionnel Maroc",
          "estimation prix voiture",
          "autobladi",
        ],
    applicationName: "autobladi.ma",
    authors: [{ name: "autobladi.ma" }],
    creator: "autobladi.ma",
    publisher: "autobladi.ma",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: ar ? "ar_MA" : "fr_MA",
      alternateLocale: ar ? ["fr_MA"] : ["ar_MA"],
      url: `${SITE_URL}/${locale}`,
      siteName: "autobladi.ma",
      title: titleDefault,
      description,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "autobladi.ma",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ar: `${SITE_URL}/ar`,
        fr: `${SITE_URL}/fr`,
        "x-default": `${SITE_URL}/ar`,
      },
    },
    // Search-engine ownership verification (google-site-verification + Bing's
    // msvalidate.01) — admin-managed from /admin/parametres.
    ...((verify.google || verify.bing) && {
      verification: {
        ...(verify.google && { google: verify.google }),
        ...(verify.bing && { other: { "msvalidate.01": verify.bing } }),
      },
    }),
    // Icons are auto-discovered by Next from app/icon.tsx + app/apple-icon.tsx.
    // When an admin uploads a custom favicon, it overrides them here.
    ...(faviconUrl && {
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
    }),
    manifest: "/manifest.webmanifest",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    // Optional: drop your Search Console verification token in env to
    // enable site verification without touching code.
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
    }),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const dir = locale === "ar" ? "rtl" : "ltr"

  return (
    <html
      lang={locale}
      dir={dir}
      className={cn(
        cairo.variable,
        tajawal.variable,
        inter.variable,
        playfair.variable,
        "h-full antialiased",
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd data={organizationSchema()} />
        <DirectionProvider direction={dir}>
          <NuqsAdapter>
            <NextIntlClientProvider>
              <FavoritesProvider>{children}</FavoritesProvider>
            </NextIntlClientProvider>
          </NuqsAdapter>
        </DirectionProvider>
        <Toaster richColors closeButton position={dir === "rtl" ? "top-left" : "top-right"} />
      </body>
    </html>
  )
}

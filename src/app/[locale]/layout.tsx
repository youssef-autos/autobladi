export const dynamic = "force-dynamic"

import type { Metadata, Viewport } from "next"
import { Cairo, Outfit, Tajawal } from "next/font/google"
import Script from "next/script"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { DirectionProvider } from "@base-ui/react/direction-provider"

import { JsonLd } from "@/components/seo/JsonLd"
import { FavoritesProvider } from "@/hooks/use-favorites"
import { Toaster } from "@/components/ui/sonner"
import { routing } from "@/i18n/routing"
import {
  getAdsenseClientId,
  getSiteAnalyticsId,
  getSiteFaviconUrl,
  getSiteVerification,
} from "@/lib/queries/home"
import { mediaUrl } from "@/lib/media"
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

// Matches the Latin/French typeface used on autohouse.ma — Arabic keeps
// Cairo/Tajawal untouched.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// `viewportFit: "cover"` lets content opt into the iOS safe-area insets
// (env(safe-area-inset-*)) — without it, MobileContactBar's bottom padding
// resolves to 0 and the sticky call/WhatsApp bar can sit under the home
// indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
  // mediaUrl() routes it through the ad-blocker-safe `/media` path.
  const faviconUrl = mediaUrl(await getSiteFaviconUrl())
  // Admin-entered search-engine verification codes (GSC + Bing).
  const verify = await getSiteVerification()

  const titleDefault = ar
    ? "autobladi.ma — بيع وشراء السيارات في المغرب"
    : "autobladi.ma — Achat et vente de voitures au Maroc"
  const description = ar
    ? "بيع وشراء السيارات الجديدة والمستعملة في المغرب. تقدير مجاني بالذكاء الاصطناعي، معارض موثوقة، وتواصل مباشر وآمن."
    : "Achetez et vendez des voitures neuves et d'occasion au Maroc. Estimation gratuite par IA, showrooms vérifiés, contact direct et sécurisé."

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
          "showroom Maroc",
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
    ...((verify.google || verify.bing || verify.yandex || verify.pinterest) && {
      verification: {
        ...(verify.google && { google: verify.google }),
        ...((verify.bing || verify.yandex || verify.pinterest) && {
          other: {
            ...(verify.bing && { "msvalidate.01": verify.bing }),
            ...(verify.yandex && { "yandex-verification": verify.yandex }),
            ...(verify.pinterest && { "p:domain_verify": verify.pinterest }),
          },
        }),
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
  const [gaId, adsenseClientId, verify] = await Promise.all([
    getSiteAnalyticsId(),
    getAdsenseClientId(),
    getSiteVerification(),
  ])
  const adsenseEnabled = adsenseClientId.startsWith("ca-pub-")

  return (
    <html
      lang={locale}
      dir={dir}
      className={cn(
        cairo.variable,
        tajawal.variable,
        outfit.variable,
        "h-full antialiased overflow-x-hidden",
      )}
    >
      {verify.customHead && (
        <head dangerouslySetInnerHTML={{ __html: verify.customHead }} />
      )}
      <body className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        {/* Google AdSense loader — injected once, only when a publisher id is set. */}
        {adsenseEnabled && (
          <Script
            id="adsbygoogle-init"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
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

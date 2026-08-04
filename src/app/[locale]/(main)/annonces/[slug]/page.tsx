import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { AdSlot } from "@/components/ads/AdSlot"
import { JsonLd } from "@/components/seo/JsonLd"
import { breadcrumbSchema, vehicleSchema } from "@/lib/seo/structured-data"
import { AnnonceHeader } from "@/components/annonces/AnnonceHeader"
import { AnnonceSpecs } from "@/components/annonces/AnnonceSpecs"
import { AnnonceVideo } from "@/components/annonces/AnnonceVideo"
import { ContactSidebar } from "@/components/annonces/ContactSidebar"
import { ImageGallery } from "@/components/annonces/ImageGallery"
import { MobileContactBar } from "@/components/annonces/MobileContactBar"
import { SafetyTips } from "@/components/annonces/SafetyTips"
import { SellerCard } from "@/components/annonces/SellerCard"
import { SimilarCars } from "@/components/annonces/SimilarCars"
import { ViewTracker } from "@/components/annonces/ViewTracker"
import { Container } from "@/components/ui/Container"
import {
  countOtherAnnoncesByUser,
  getAnnonceBySlug,
} from "@/lib/queries/annonce-detail"
import { getShowroomByUserId } from "@/lib/queries/professionnels"
import { localeAlternates } from "@/lib/seo/alternates"

export const dynamic = "force-static"
export const revalidate = 60

type RouteParams = { locale: string; slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const annonce = await getAnnonceBySlug(slug)
  if (!annonce) return { title: "Not found" }

  const main = annonce.images[0]?.url
  const isAr = locale === "ar"
  const num = (n: number) => new Intl.NumberFormat("fr-FR").format(n)
  const cityName = annonce.city
    ? isAr
      ? annonce.city.name_ar
      : annonce.city.name_fr
    : null
  const priceFmt = annonce.price != null ? num(annonce.price) : null
  const kmFmt = annonce.mileage != null ? `${num(annonce.mileage)} ${isAr ? "كم" : "km"}` : null

  // Keyword-rich title: "{titre} à vendre à {ville} — {prix} DH"
  const title = isAr
    ? `${annonce.title}${cityName ? ` للبيع بـ${cityName}` : " للبيع"}${priceFmt ? ` — ${priceFmt} درهم` : ""}`
    : `${annonce.title}${cityName ? ` à vendre à ${cityName}` : " à vendre"}${priceFmt ? ` — ${priceFmt} DH` : ""}`

  const description = (
    isAr
      ? `${annonce.title} للبيع${cityName ? ` بـ${cityName}` : ""}${priceFmt ? ` بسعر ${priceFmt} درهم` : ""}${kmFmt ? `، ${kmFmt}` : ""}. شاهد الصور والمواصفات وتواصل مباشرةً مع البائع على autobladi.ma.`
      : `${annonce.title} à vendre${cityName ? ` à ${cityName}` : ""}${priceFmt ? ` au prix de ${priceFmt} DH` : ""}${kmFmt ? `, ${kmFmt}` : ""}. Photos, caractéristiques et contact direct du vendeur sur autobladi.ma.`
  ).slice(0, 160)

  return {
    title,
    description,
    alternates: localeAlternates(locale, `/annonces/${annonce.slug}`),
    openGraph: {
      title,
      description,
      images: main ? [main] : undefined,
      type: "article",
    },
  }
}

export default async function AnnonceDetailPage({
  params,
}: {
  params: Promise<RouteParams>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const annonce = await getAnnonceBySlug(slug)
  if (!annonce) notFound()

  const otherCount = annonce.seller
    ? await countOtherAnnoncesByUser(annonce.seller.id, annonce.id)
    : 0

  // Professional sellers may have a public showroom — link to it from the card.
  const sellerIsPro =
    annonce.seller?.account_type === "pro" ||
    annonce.seller?.account_type === "admin"
  const showroom =
    annonce.seller && sellerIsPro
      ? await getShowroomByUserId(annonce.seller.id)
      : null

  return (
    <>
      <ViewTracker annonceId={annonce.id} />

      <Container className="pt-6 pb-4">
        <Suspense fallback={<div className="h-[90px] rounded-2xl bg-muted animate-pulse" />}>
          <AdSlot slotId="annonce_top" />
        </Suspense>
      </Container>

      <Container className="pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <ImageGallery
                images={annonce.images}
                title={annonce.title}
                condition={annonce.condition}
              />
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {annonce.title}
              </h1>
            </div>
            <AnnonceHeader annonce={annonce} />

            <AnnonceSpecs annonce={annonce} />

            <AnnonceVideo annonce={annonce} />

            <Suspense fallback={<div className="h-[90px] rounded-2xl bg-muted animate-pulse" />}>
              {/* In-article slot — different size on mobile vs desktop, one call. */}
              <AdSlot slotId="annonce_bottom" />
            </Suspense>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {annonce.seller && (
              <SellerCard
                seller={annonce.seller}
                otherCount={otherCount}
                showroom={showroom}
              />
            )}

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              {annonce.seller && (
                <ContactSidebar
                  annonceId={annonce.id}
                  annonceSlug={annonce.slug}
                  title={annonce.title}
                  sellerId={annonce.seller.id}
                  contactPhone={annonce.contact_phone}
                  contactWhatsapp={annonce.contact_whatsapp}
                />
              )}
            </div>

            <SafetyTips />

            <Suspense fallback={<div className="h-[250px] rounded-2xl bg-muted animate-pulse" />}>
              <AdSlot slotId="annonce_sidebar" />
            </Suspense>
          </aside>
        </div>
      </Container>

      <Suspense fallback={null}>
        <SimilarCars annonce={annonce} />
      </Suspense>

      {/* Mobile-only sticky Call / WhatsApp bar */}
      {annonce.seller && (
        <MobileContactBar
          annonceId={annonce.id}
          contactPhone={annonce.contact_phone}
          contactWhatsapp={annonce.contact_whatsapp}
        />
      )}
      {/* Spacer so the fixed bar never hides the last content on mobile */}
      <div className="h-20 lg:hidden" aria-hidden="true" />

      <JsonLd
        data={vehicleSchema({
          locale,
          slug: annonce.slug,
          title: annonce.title,
          description: annonce.description,
          brandName: annonce.brand?.name ?? null,
          modelName: annonce.model?.name ?? null,
          year: annonce.year,
          mileage: annonce.mileage,
          fuelType: annonce.fuel_type,
          transmission: annonce.transmission,
          color: annonce.color,
          doors: annonce.doors,
          price: annonce.price,
          sellerName: annonce.seller?.full_name ?? null,
          cityName: annonce.city?.name_fr ?? null,
          images: annonce.images.map((i) => i.url),
          publishedAt: annonce.published_at,
        })}
      />

      <JsonLd
        data={breadcrumbSchema([
          {
            name: locale === "fr" ? "Accueil" : "الرئيسية",
            url: `${SITE_URL}/${locale}`,
          },
          {
            name: locale === "fr" ? "Annonces" : "السيارات",
            url: `${SITE_URL}/${locale}/annonces`,
          },
          {
            name: annonce.title,
            url: `${SITE_URL}/${locale}/annonces/${annonce.slug}`,
          },
        ])}
      />
    </>
  )
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autobladi.ma"


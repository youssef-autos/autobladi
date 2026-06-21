import { Suspense } from "react"
import { Mail, MapPin, Phone } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"

import { AdBanner } from "@/components/ads/AdBanner"
import { Link } from "@/i18n/navigation"
import { Logo } from "@/components/layout/Logo"
import { listFooterPages } from "@/lib/queries/pages"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
} from "@/components/layout/SocialIcons"
import { TikTokIcon } from "../professionnels/socials"

export async function Footer({ logoUrl }: { logoUrl?: string | null }) {
  const t = await getTranslations("footer")
  const locale = await getLocale()
  const year = new Date().getFullYear()
  const footerPages = await listFooterPages()

  return (
    <footer className="mt-auto bg-brand-dark text-white/80">
      {/* Site-wide footer banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-6">
        <Suspense fallback={<div className="h-[100px] md:h-[120px] rounded-2xl bg-white/5 animate-pulse" />}>
          <AdBanner placement="footer_banner" heightClass="h-[100px] md:h-[120px]" />
        </Suspense>
      </div>

      {/* Thin gold separator at top */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-moroccan-gold-500/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1 — Brand */}
          <div className="space-y-4">
            <Logo variant="light" size="md" imageUrl={logoUrl} />
            <p className="text-sm leading-relaxed text-white/60">{t("tagline")}</p>
            <div className="flex items-center gap-3">
              <SocialLink href="https://facebook.com/autobladi/" label="Facebook">
                <FacebookIcon className="size-4" />
              </SocialLink>
              <SocialLink href="https://www.instagram.com/autobladi.ma/" label="Instagram">
                <InstagramIcon className="size-4" />
              </SocialLink>
              <SocialLink href="https://youtube.com/@autobladima/" label="YouTube">
                <YoutubeIcon className="size-4" />
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/company/autobladima" label="LinkedIn">
                <LinkedinIcon className="size-4" />
              </SocialLink>
              <SocialLink href="https://tiktok.com/autobladi.ma/" label="tiktok">
                <TikTokIcon className="size-4" />
              </SocialLink>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div className="space-y-4">
            <FooterHeading>{t("explore")}</FooterHeading>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="/annonces">{t("exploreItems.all")}</FooterLink>
              <FooterLink href="/annonces?sort=popular">{t("exploreItems.popular")}</FooterLink>
              <FooterLink href="/annonces?featured=1">{t("exploreItems.featured")}</FooterLink>
              <FooterLink href="/professionnels">{t("exploreItems.dealers")}</FooterLink>
              <FooterLink href="/estimation">{t("exploreItems.estimation")}</FooterLink>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div className="space-y-4">
            <FooterHeading>{t("company")}</FooterHeading>
            <ul className="space-y-2.5 text-sm">
              {/* CMS-managed pages (À propos, CGU, Confidentialité, …) */}
              {footerPages.map((p) => (
                <FooterLink key={p.slug} href={`/p/${p.slug}`}>
                  {locale === "ar" ? p.title_ar : p.title_fr}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact */}
          <div className="space-y-4">
            <FooterHeading>{t("contact")}</FooterHeading>

            {/* Page links */}
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="/contact">{t("companyItems.contact")}</FooterLink>
              <FooterLink href="/publicite">{t("companyItems.publicite")}</FooterLink>
            </ul>

            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-white/60">
                <Phone className="size-4 shrink-0 text-moroccan-gold-500" aria-hidden="true" />
                <a href={`tel:${t("phone").replace(/\s/g, "")}`} className="hover:text-white transition-colors">
                  {t("phone")}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Mail className="size-4 shrink-0 text-moroccan-gold-500" aria-hidden="true" />
                <a href={`mailto:${t("email")}`} className="hover:text-white transition-colors">
                  {t("email")}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <MapPin className="size-4 shrink-0 text-moroccan-gold-500" aria-hidden="true" />
                {t("address")}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-5 text-xs text-white/50 text-center">
          © {year} autobladi.ma — {t("rights")}
        </div>
      </div>
    </footer>
  )
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
      {children}
    </h3>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-white/60 hover:text-moroccan-gold-500 transition-colors"
      >
        {children}
      </Link>
    </li>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center size-8 rounded-full bg-white/5 text-white/70 hover:bg-moroccan-gold-500/10 hover:text-moroccan-gold-500 transition-colors"
    >
      {children}
    </a>
  )
}


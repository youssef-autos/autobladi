import { Suspense } from "react"
import { getLocale, getTranslations } from "next-intl/server"

import { AdBanner } from "@/components/ads/AdBanner"
import { Container } from "@/components/ui/Container"
import { Link } from "@/i18n/navigation"
import { Logo } from "@/components/layout/Logo"
import { listFooterPages } from "@/lib/queries/pages"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/layout/SocialIcons"

export async function Footer({ logoUrl }: { logoUrl?: string | null }) {
  const t = await getTranslations("footer")
  const locale = await getLocale()
  const year = new Date().getFullYear()
  const footerPages = await listFooterPages()

  return (
    <footer className="mt-auto bg-brand-dark text-white/80">
      {/* Site-wide footer banner */}
      <Container className="pt-6">
        <Suspense fallback={<div className="h-[100px] md:h-[120px] rounded-2xl bg-white/5 animate-pulse" />}>
          <AdBanner placement="footer_banner" heightClass="h-[100px] md:h-[120px]" />
        </Suspense>
      </Container>

      {/* Thin gold separator at top */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-moroccan-gold-500/60 to-transparent" />

      <Container className="py-12 lg:py-16">
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
              <SocialLink href="https://www.whatsapp.com/channel/0029VbD7RhtBfxnzjdMQ4T1z" label="WhatsApp">
                <WhatsappIcon className="size-4" />
              </SocialLink>
            </div>
          </div>

          {/* Column 2 — Explore */}
          <div className="space-y-4 max-md:pt-8 max-md:border-t max-md:border-white/10">
            <FooterHeading>{t("explore")}</FooterHeading>
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="/annonces">{t("exploreItems.all")}</FooterLink>
              <FooterLink href="/annonces?sort=popular">{t("exploreItems.popular")}</FooterLink>
              <FooterLink href="/showrooms">{t("exploreItems.dealers")}</FooterLink>
              <FooterLink href="/marques">{t("exploreItems.brands")}</FooterLink>
              <FooterLink href="/villes">{t("exploreItems.cities")}</FooterLink>
              <FooterLink href="/estimation">{t("exploreItems.estimation")}</FooterLink>
              <FooterLink href="/comparer">{t("exploreItems.comparer")}</FooterLink>
              <FooterLink href="/blog">{t("exploreItems.blog")}</FooterLink>
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div className="space-y-4 max-md:pt-8 max-md:border-t max-md:border-white/10">
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
          <div className="space-y-4 max-md:pt-8 max-md:border-t max-md:border-white/10">
            <FooterHeading>{t("contact")}</FooterHeading>

            {/* Page links */}
            <ul className="space-y-2.5 text-sm">
              <FooterLink href="/contact">{t("companyItems.contact")}</FooterLink>
              <FooterLink href="/publicite">{t("companyItems.publicite")}</FooterLink>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom strip */}
      <div className="border-t border-white/10">
        <Container className="py-5 text-xs text-white/60 text-center">
          © {year} autobladi.ma — {t("rights")}
        </Container>
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
      className="inline-flex items-center justify-center size-8 rounded-full bg-moroccan-gold-500/10 text-moroccan-gold-500/80 hover:bg-moroccan-gold-500/20 hover:text-moroccan-gold-500 transition-colors"
    >
      {children}
    </a>
  )
}


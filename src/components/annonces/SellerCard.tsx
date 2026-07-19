"use client"

import { Crown, Store, Star, User as UserIcon } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { AnnonceDetail } from "@/lib/queries/annonce-detail"
import { cn } from "@/lib/utils"

type Props = {
  seller: NonNullable<AnnonceDetail["seller"]>
  otherCount: number
  /** Active showroom owned by the seller (professionals only). */
  showroom?: { slug: string; name: string } | null
}

function initials(name?: string | null) {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function SellerCard({ seller, otherCount, showroom }: Props) {
  const t = useTranslations("annonceDetail.seller")
  const format = useFormatter()
  const memberDate = format.dateTime(new Date(seller.created_at), {
    year: "numeric",
    month: "long",
  })
  const isPro = seller.account_type === "pro" || seller.account_type === "admin"

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <header className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar
            className={cn(
              "size-12",
              isPro &&
                "ring-2 ring-moroccan-gold-500 ring-offset-2 ring-offset-card",
            )}
          >
            {seller.avatar_url && <AvatarImage src={seller.avatar_url} alt={seller.full_name ?? ""} />}
            <AvatarFallback className="bg-moroccan-sand-50 text-moroccan-red-500 font-semibold">
              {initials(seller.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Pro badge — sits on the avatar like a membership crest. */}
          {isPro && (
            <span
              title={t("pro")}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded-full bg-moroccan-gradient px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white ring-2 ring-card shadow-sm"
            >
              <Crown className="size-2.5" aria-hidden="true" />
              {t("pro")}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate inline-flex items-center gap-1.5">
            {seller.full_name ?? <UserIcon className="size-4 inline" />}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("memberSince", { date: memberDate })}
          </p>
        </div>
      </header>

      <p className="mt-4 text-sm text-muted-foreground inline-flex items-center gap-1.5">
        <Star className="size-4 text-moroccan-gold-500" aria-hidden="true" />
        {t("otherAnnonces", { count: otherCount })}
      </p>

      {showroom && (
        <Link
          href={`/professionnel/${showroom.slug}`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-moroccan-red-500/30 bg-moroccan-red-50 px-4 h-10 text-sm font-semibold text-moroccan-red-600 hover:bg-moroccan-red-500 hover:text-white transition-colors"
        >
          <Store className="size-4" aria-hidden="true" />
          {t("viewShowroom")}
        </Link>
      )}
    </section>
  )
}
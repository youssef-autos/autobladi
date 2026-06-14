"use client"

import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useFavorites } from "@/hooks/use-favorites"
import { cn } from "@/lib/utils"

type Props = {
  annonceId: string
  /** "icon" = round overlay button (cards); "wide" = bordered button (sidebar). */
  variant?: "icon" | "wide"
  className?: string
}

export function FavoriteButton({ annonceId, variant = "icon", className }: Props) {
  const { isFavorite, toggle, isAuthed } = useFavorites()
  const t = useTranslations("annonceDetail.contact")
  const active = isFavorite(annonceId)

  async function handleClick(e: React.MouseEvent) {
    // Cards wrap the whole article in a link — never navigate on a fav click.
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthed) {
      toast.error(t("loginRequired"))
      return
    }
    try {
      const next = await toggle(annonceId)
      if (next === true) toast.success(t("favoriteAdded"))
      else if (next === false) toast.success(t("favoriteRemoved"))
    } catch {
      toast.error(t("favoriteError"))
    }
  }

  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border text-sm font-medium transition-colors",
          active
            ? "border-moroccan-red-500/40 bg-moroccan-red-50 text-moroccan-red-600"
            : "border-border bg-background text-foreground hover:bg-moroccan-sand-50",
          className,
        )}
      >
        <Heart
          className={cn("size-4", active && "fill-moroccan-red-500 text-moroccan-red-500")}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{t("favorite").split(" ")[0]}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={t("favorite")}
      title={t("favorite")}
      className={cn(
        "relative z-30 inline-flex size-8 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white",
        active
          ? "text-moroccan-red-500"
          : "text-foreground/70 hover:text-moroccan-red-500",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-moroccan-red-500")} />
    </button>
  )
}

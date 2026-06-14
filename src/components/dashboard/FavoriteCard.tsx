"use client"

import { useTransition } from "react"
import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { removeFavorite } from "@/app/[locale]/dashboard/favoris/actions"
import { CarCard } from "@/components/cars/CarCard"
import type { AnnonceCardData } from "@/lib/queries/home"

type Props = {
  favoriteId: string
  annonce: AnnonceCardData
}

export function FavoriteCard({ favoriteId, annonce }: Props) {
  const t = useTranslations("dashboard.favorisPage")
  const [pending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const res = await removeFavorite(favoriteId)
      if (!res.ok) {
        toast.error(t("removed"))
        return
      }
      toast.success(t("removed"))
    })
  }

  return (
    <div className="relative">
      <CarCard annonce={annonce} />
      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        aria-label={t("remove")}
        className="absolute top-3 start-3 z-30 inline-flex size-9 items-center justify-center rounded-full bg-white shadow-card text-moroccan-red-500 hover:bg-moroccan-red-50 transition-colors disabled:opacity-60"
      >
        <Heart className="size-4 fill-moroccan-red-500" />
      </button>
    </div>
  )
}

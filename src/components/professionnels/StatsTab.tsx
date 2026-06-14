"use client"

import { Calendar, Car, MessageCircle, Star } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"

import { StatsCard } from "@/components/dashboard/StatsCard"

type Props = {
  memberSince: string
  activeCars: number
  rating: number
  reviewsCount: number
}

export function StatsTab({
  memberSince,
  activeCars,
  rating,
  reviewsCount,
}: Props) {
  const t = useTranslations("professionnels.stats")
  const format = useFormatter()
  const memberDate = format.dateTime(new Date(memberSince), {
    year: "numeric",
    month: "long",
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Calendar}
          label={t("memberSince", { date: "" })}
          value={memberDate}
          accent="default"
        />
        <StatsCard
          icon={Car}
          label={t("carsActive", { count: activeCars })}
          value={activeCars}
          accent="red"
        />
        <StatsCard
          icon={Star}
          label="Rating"
          value={Number(rating).toFixed(1)}
          accent="gold"
        />
        <StatsCard
          icon={MessageCircle}
          label="Reviews"
          value={reviewsCount}
          accent="mint"
        />
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {t("comingSoon")}
      </p>
    </div>
  )
}
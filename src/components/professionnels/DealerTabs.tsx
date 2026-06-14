"use client"

import { Car } from "lucide-react"
import { useTranslations } from "next-intl"

import { AboutTab } from "@/components/professionnels/AboutTab"
import { ReviewsTab } from "@/components/professionnels/ReviewsTab"
import { StatsTab } from "@/components/professionnels/StatsTab"
import { CarCard } from "@/components/cars/CarCard"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { ProfessionnelDetail, ReviewItem } from "@/lib/queries/professionnels"
import type { AnnonceCardData } from "@/lib/queries/home"

type Props = {
  dealer: ProfessionnelDetail
  cars: AnnonceCardData[]
  reviews: ReviewItem[]
  hasAlreadyReviewed: boolean
}

export function DealerTabs({ dealer, cars, reviews, hasAlreadyReviewed }: Props) {
  const t = useTranslations("professionnels")

  return (
    <Tabs defaultValue="cars" className="space-y-6">
      <TabsList className="bg-moroccan-sand-50/60 p-1 rounded-xl h-auto">
        <TabsTrigger value="cars" className="rounded-lg px-4 py-2 text-sm">
          {t("tabs.cars")} ({dealer.annonces_count})
        </TabsTrigger>
        <TabsTrigger value="about" className="rounded-lg px-4 py-2 text-sm">
          {t("tabs.about")}
        </TabsTrigger>
        <TabsTrigger value="reviews" className="rounded-lg px-4 py-2 text-sm">
          {t("tabs.reviews")} ({dealer.reviews_count})
        </TabsTrigger>
        <TabsTrigger value="stats" className="rounded-lg px-4 py-2 text-sm">
          {t("tabs.stats")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="cars">
        {cars.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
            <EmptyState
              icon={Car}
              title={t("list.empty")}
              description={t("list.emptyDesc")}
            />
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((c) => (
              <li key={c.id}>
                <CarCard annonce={c} />
              </li>
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="about">
        <AboutTab dealer={dealer} />
      </TabsContent>

      <TabsContent value="reviews">
        <ReviewsTab
          professionnelId={dealer.id}
          averageRating={dealer.rating}
          reviewsCount={dealer.reviews_count}
          reviews={reviews}
          hasAlreadyReviewed={hasAlreadyReviewed}
        />
      </TabsContent>

      <TabsContent value="stats">
        <StatsTab
          memberSince={dealer.created_at}
          activeCars={dealer.annonces_count}
          rating={dealer.rating}
          reviewsCount={dealer.reviews_count}
        />
      </TabsContent>
    </Tabs>
  )
}

import { Fragment } from "react"
import { Car } from "lucide-react"

import { AdBanner } from "@/components/ads/AdBanner"
import { AnnonceCardList } from "@/components/annonces/AnnonceCardList"
import { CarCard } from "@/components/cars/CarCard"
import { EmptyState } from "@/components/ui/EmptyState"
import type { AnnonceCardData } from "@/lib/queries/home"

type Props = {
  annonces: AnnonceCardData[]
  view: "grid" | "list"
  emptyTitle: string
  emptyDesc: string
  emptyAction?: React.ReactNode
}

/** Insert an inline ad after every Nth listing */
const INLINE_AD_INTERVAL = 12

export function AnnoncesList({
  annonces,
  view,
  emptyTitle,
  emptyDesc,
  emptyAction,
}: Props) {
  if (annonces.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title={emptyTitle}
        description={emptyDesc}
        action={emptyAction}
      />
    )
  }

  const gridClass =
    view === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
      : "flex flex-col gap-4"

  // Slice annonces into pages of INLINE_AD_INTERVAL and inject AdBanner between them
  const chunks: AnnonceCardData[][] = []
  for (let i = 0; i < annonces.length; i += INLINE_AD_INTERVAL) {
    chunks.push(annonces.slice(i, i + INLINE_AD_INTERVAL))
  }

  return (
    <div className="flex flex-col gap-6">
      {chunks.map((chunk, idx) => (
        <Fragment key={idx}>
          <div className={gridClass}>
            {chunk.map((annonce) =>
              view === "grid" ? (
                <CarCard key={annonce.id} annonce={annonce} />
              ) : (
                <AnnonceCardList key={annonce.id} annonce={annonce} />
              ),
            )}
          </div>
          {idx < chunks.length - 1 && (
            <AdBanner placement="listings_inline" />
          )}
        </Fragment>
      ))}
    </div>
  )
}

"use client"

import dynamic from "next/dynamic"

export const AdvancedStats = dynamic(
  () => import("./AdvancedStats").then((m) => m.AdvancedStats),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    ),
  },
)

"use client"

import dynamic from "next/dynamic"

export const ActivityChart = dynamic(
  () => import("./ActivityChart").then((m) => m.ActivityChart),
  { ssr: false },
)

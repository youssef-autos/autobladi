"use client"

import { useState } from "react"

import { EstimationForm } from "@/components/estimation/EstimationForm"
import { EstimationResult } from "@/components/estimation/EstimationResult"
import type { PriceEstimate } from "@/lib/ai/types"
import type { Brand, CarModel } from "@/lib/queries/home"
import type { EstimationFormValues } from "@/lib/validations/estimation"
import type { Locale } from "@/i18n/routing"

type Props = {
  brands: Brand[]
  models: CarModel[]
  locale: Locale
}

export function EstimationPanel({ brands, models, locale }: Props) {
  const [result, setResult] = useState<PriceEstimate | null>(null)
  const [values, setValues] = useState<EstimationFormValues | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <EstimationForm
        brands={brands}
        models={models}
        onLoadingChange={setLoading}
        onResult={(r, v) => {
          setResult(r)
          setValues(v)
        }}
      />
      <EstimationResult
        result={result}
        loading={loading}
        values={values}
        locale={locale}
        onReset={() => {
          setResult(null)
          setValues(null)
        }}
      />
    </div>
  )
}

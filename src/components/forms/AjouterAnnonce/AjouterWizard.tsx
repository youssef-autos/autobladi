"use client"

import { useEffect, useState, useTransition } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { publishAnnonce, updateAnnonce } from "@/app/[locale]/dashboard/ajouter/actions"
import { Stepper } from "@/components/forms/AjouterAnnonce/Stepper"
import { Step1Vehicle } from "@/components/forms/AjouterAnnonce/Step1Info"
import { Step2DescriptionPrice } from "@/components/forms/AjouterAnnonce/Step2Description"
import { Step3Images } from "@/components/forms/AjouterAnnonce/Step3Images"
import { Step4Review } from "@/components/forms/AjouterAnnonce/Step4Review"
import { useRouter } from "@/i18n/navigation"
import {
  fullAnnonceSchema,
  type AnnonceFormValues,
} from "@/lib/validations/annonce"
import type { Brand, CarModel, City, Secteur } from "@/lib/queries/home"
import { cn } from "@/lib/utils"

type Props = {
  brands: Brand[]
  models: CarModel[]
  cities: City[]
  secteurs: Secteur[]
  defaultPhone: string
  defaultWhatsapp: string
  /** Pro accounts (and admins) unlock the promo-video field. */
  isPro?: boolean
  /** "edit" reuses this wizard to update an existing annonce. */
  mode?: "create" | "edit"
  /** Required in edit mode — the annonce being updated. */
  annonceId?: string
  /** Pre-filled form values in edit mode. */
  initialValues?: AnnonceFormValues
  /** Where to redirect after save (default: /dashboard/annonces). */
  redirectTo?: string
}

const STORAGE_KEY = "autobladi:ajouter:draft:v1"
const TOTAL_STEPS = 4

const stepFields: Record<number, Array<keyof AnnonceFormValues>> = {
  1: [
    "condition",
    "brandId",
    "modelId",
    "cityId",
    "secteurId",
    "year",
    "mileage",
    "fuelType",
    "transmission",
    "doors",
    "seats",
    "color",
    "origine",
    "firstOwner",
    "accidentFree",
    "options",
  ],
  2: ["title", "description", "price", "contactPhone"],
  3: ["images", "videoUrl"],
  4: ["acceptTerms"],
}

function makeDefaults(defaultPhone: string, defaultWhatsapp: string): AnnonceFormValues {
  return {
    condition: "occasion",
    brandId: "",
    modelId: "",
    cityId: "",
    secteurId: "",
    year: new Date().getFullYear() - 2,
    mileage: null,
    fuelType: null,
    transmission: null,
    doors: null,
    seats: null,
    color: "",
    origine: null,
    enginePower: null,
    engineSize: null,
    firstOwner: null,
    accidentFree: null,
    options: [],
    title: "",
    description: "",
    price: 0,
    negotiable: false,
    priceOnRequest: false,
    contactPhone: defaultPhone,
    contactWhatsapp: defaultWhatsapp || null,
    videoUrl: null,
    images: [],
    acceptTerms: false,
  }
}

export function AjouterWizard({
  brands,
  models,
  cities,
  secteurs,
  defaultPhone,
  defaultWhatsapp,
  isPro = false,
  mode = "create",
  annonceId,
  initialValues,
  redirectTo,
}: Props) {
  const t = useTranslations("ajouter")
  const tStep4 = useTranslations("ajouter.step4")
  const router = useRouter()
  const isEdit = mode === "edit"
  const [step, setStep] = useState(1)
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const form = useForm<AnnonceFormValues>({
    resolver: zodResolver(fullAnnonceSchema),
    defaultValues:
      isEdit && initialValues
        ? initialValues
        : makeDefaults(defaultPhone, defaultWhatsapp),
    mode: "onBlur",
  })

  // Restore draft from localStorage on mount (create mode only — edits start
  // from the existing annonce, not a saved draft).
  useEffect(() => {
    if (isEdit) return
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Partial<AnnonceFormValues>
      const defaults = makeDefaults(defaultPhone, defaultWhatsapp)
      form.reset({ ...defaults, ...parsed }, { keepDefaultValues: false })
    } catch {
      // ignore — bad JSON
    }
  }, [isEdit, defaultPhone, defaultWhatsapp, form])

  // Persist draft on every change (create mode only)
  useEffect(() => {
    if (isEdit) return
    let handle: ReturnType<typeof setTimeout> | null = null
    // eslint-disable-next-line react-hooks/incompatible-library -- watch subscription is intentional for draft autosave
    const sub = form.watch((values) => {
      if (handle) clearTimeout(handle)
      handle = setTimeout(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values))
        } catch {
          // ignore quota or privacy-mode errors
        }
      }, 400)
    })
    return () => {
      if (handle) clearTimeout(handle)
      sub.unsubscribe()
    }
  }, [isEdit, form])

  async function goNext() {
    const fields = stepFields[step] ?? []
    const valid = await form.trigger(fields)
    if (!valid) return
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goPrev() {
    setStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function onSubmit(values: AnnonceFormValues) {
    startTransition(async () => {
      const result =
        isEdit && annonceId
          ? await updateAnnonce(annonceId, values)
          : await publishAnnonce(values)
      if (!result.ok) {
        const description =
          result.error === "limit_reached"
            ? tStep4("limitReached")
            : result.error
        toast.error(tStep4("errorGeneric"), { description })
        return
      }
      if (!isEdit) {
        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
      }
      setDone(true)
      toast.success(tStep4("successTitle"), { description: tStep4("successDesc") })
      setTimeout(() => router.push(redirectTo ?? "/dashboard/annonces"), 1800)
    })
  }

  const stepLabels = [
    { id: 1, label: t("steps.vehicle") },
    { id: 2, label: t("steps.description") },
    { id: 3, label: t("steps.photos") },
    { id: 4, label: t("steps.review") },
  ]

  if (done) {
    return (
      <div className="rounded-2xl border border-moroccan-mint-500/40 bg-moroccan-mint-500/5 p-10 text-center space-y-4">
        <CheckCircle2 className="mx-auto size-14 text-moroccan-mint-500" aria-hidden="true" />
        <h2 className="font-display text-2xl font-bold">{tStep4("successTitle")}</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">{tStep4("successDesc")}</p>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        {/* Progress bar (gold) */}
        <div className="h-1 bg-moroccan-sand-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-gradient transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <Stepper steps={stepLabels} current={step} />

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card"
        >
          <div
            key={step}
            className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
          >
            {step === 1 && (
              <Step1Vehicle
                brands={brands}
                models={models}
                cities={cities}
                secteurs={secteurs}
              />
            )}
            {step === 2 && (
              <Step2DescriptionPrice brands={brands} models={models} />
            )}
            {step === 3 && <Step3Images isPro={isPro} />}
            {step === 4 && (
              <Step4Review brands={brands} models={models} cities={cities} />
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1 || pending}
              className={cn(
                "inline-flex items-center gap-1.5 h-11 px-5 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("previous")}
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                disabled={pending}
                className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all"
              >
                {t("next")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 transition-all disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden="true" />
                {isEdit
                  ? pending
                    ? t("updating")
                    : t("update")
                  : pending
                    ? t("publishing")
                    : t("publish")}
              </button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  )
}

"use client"

import { useTransition } from "react"
import { Rocket } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { becomeProfessional } from "@/app/[locale]/dashboard/showroom/actions"
import { useRouter } from "@/i18n/navigation"

/**
 * Free one-click activation of a professional (dealer) account. On success the
 * page refreshes and the showroom management form appears.
 */
export function BecomeProButton() {
  const t = useTranslations("showroom.notReady")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function activate() {
    startTransition(async () => {
      const res = await becomeProfessional()
      if (res.ok) {
        router.refresh()
      } else {
        toast.error(t("error"))
      }
    })
  }

  return (
    <button
      type="button"
      onClick={activate}
      disabled={pending}
      className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105 disabled:opacity-60"
    >
      <Rocket className="size-4" aria-hidden="true" />
      {pending ? t("activating") : t("activateCta")}
    </button>
  )
}

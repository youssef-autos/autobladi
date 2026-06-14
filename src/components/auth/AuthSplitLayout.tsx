import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"

type Props = {
  children: React.ReactNode
  className?: string
}

export async function AuthSplitLayout({ children, className }: Props) {
  const locale = await getLocale()
  const t = await getTranslations("common")

  return (
    <div className="min-h-dvh w-full grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Hero / illustration side */}
      <div className="relative hidden lg:block overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/auth-bg.jpg)" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-moroccan-red-500/85 via-moroccan-red-500/60 to-moroccan-gold-500/40"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <Link href={`/${locale}`} className="text-2xl font-bold tracking-tight">
            {t("siteName")}
          </Link>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">{t("tagline")}</h2>
            <div className="h-1 w-16 rounded-full bg-moroccan-gold-500" />
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className={cn("flex items-center justify-center p-6 sm:p-10", className)}>
        <div className="w-full max-w-md">
          <Link
            href={`/${locale}`}
            className="lg:hidden mb-8 inline-block text-xl font-bold text-moroccan-red-500"
          >
            {t("siteName")}
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}

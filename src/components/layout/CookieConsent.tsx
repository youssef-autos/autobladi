"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { Cookie } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"

const STORAGE_KEY = "autobladi:cookie-consent"

type Consent = "unset" | "pending" | "accepted" | "declined"

type Props = {
  gaId: string | null
  adsenseClientId: string
  adsenseEnabled: boolean
}

/**
 * Gates the non-essential (analytics + ads) scripts behind consent, and
 * shows the banner until the visitor picks one. Essential cookies (auth
 * session, locale) aren't affected — they're not injected here.
 */
export function CookieConsent({ gaId, adsenseClientId, adsenseEnabled }: Props) {
  const t = useTranslations("cookieConsent")
  const [consent, setConsent] = useState<Consent>("unset")

  useEffect(() => {
    // localStorage is a browser-only API; consent defaults to "unset" for
    // SSR, then this corrects it right after mount. No effect-free way to
    // read it safely.
    const stored = window.localStorage.getItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored === "accepted" || stored === "declined" ? stored : "pending")
  }, [])

  function choose(value: "accepted" | "declined") {
    window.localStorage.setItem(STORAGE_KEY, value)
    setConsent(value)
  }

  return (
    <>
      {consent === "accepted" && gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
      {consent === "accepted" && adsenseEnabled && (
        <Script
          id="adsbygoogle-init"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}

      {consent === "pending" && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-moroccan-gold-500/15 text-moroccan-gold-700">
                <Cookie className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {t("message")}{" "}
                <Link
                  href="/p/privacy"
                  className="font-medium text-moroccan-red-500 hover:underline"
                >
                  {t("learnMore")}
                </Link>
              </p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => choose("declined")}
                className="h-10 flex-1 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors sm:flex-none"
              >
                {t("decline")}
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="h-10 flex-1 rounded-xl bg-moroccan-gradient px-4 text-sm font-semibold text-white shadow-moroccan hover:brightness-105 transition-all sm:flex-none"
              >
                {t("acceptAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

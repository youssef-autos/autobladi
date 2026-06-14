"use client"

import { useState } from "react"
import { CheckCircle2, Mail } from "lucide-react"
import { useTranslations } from "next-intl"

import { Container } from "@/components/ui/Container"
import { GoldAccent } from "@/components/ui/GoldAccent"
import { cn } from "@/lib/utils"

export function Newsletter() {
  const t = useTranslations("home.newsletter")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      })
    } catch {
      // ignore — anti-enumeration: always confirm
    } finally {
      setSubmitting(false)
      setDone(true)
    }
  }

  return (
    <section className="py-12 md:py-16 bg-moroccan-sand-50">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-white text-moroccan-red-500 shadow-card mb-4">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("title")}
          </h2>
          <GoldAccent className="mx-auto mt-3" />
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>

          {done ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-xl bg-moroccan-mint-500/10 px-4 py-3 text-sm font-medium text-moroccan-mint-500">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              ✓
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder")}
                className="flex-1 h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:border-moroccan-red-500/40 focus:ring-2 focus:ring-moroccan-red-500/15"
              />
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "h-12 rounded-xl px-6 bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan",
                  "hover:brightness-105 disabled:opacity-60 transition-all",
                )}
              >
                {t("subscribe")}
              </button>
            </form>
          )}
        </div>
      </Container>
    </section>
  )
}

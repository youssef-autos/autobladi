import { Rocket } from "lucide-react"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { VerificationForm } from "@/components/verification/VerificationForm"
import { VerificationStatus } from "@/components/verification/VerificationStatus"
import { Link } from "@/i18n/navigation"
import { EmptyState } from "@/components/ui/EmptyState"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

export const dynamic = "force-dynamic"

type ProfileSlice = Pick<
  Tables<"profiles">,
  "account_type" | "is_verified" | "updated_at"
>

type RequestSlice = Pick<
  Tables<"verification_requests">,
  "id" | "status" | "rejection_reason" | "created_at" | "reviewed_at"
>

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("verification")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(
      `/${locale}/auth/connexion?returnTo=/${locale}/dashboard/verification`,
    )
  }

  const [profileRes, requestRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("account_type, is_verified, updated_at")
      .eq("id", user.id)
      .maybeSingle<ProfileSlice>(),
    supabase
      .from("verification_requests")
      .select("id, status, rejection_reason, created_at, reviewed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<RequestSlice>(),
  ])

  const profile = profileRes.data
  const latest = requestRes.data

  // Gate: pro accounts only (admin gets through too for QA)
  if (
    !profile ||
    (profile.account_type !== "pro" && profile.account_type !== "admin")
  ) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
        <div className="rounded-2xl bg-card border border-border p-12 shadow-soft">
          <EmptyState
            icon={Rocket}
            title={t("notPro.title")}
            description={t("notPro.desc")}
            action={
              <Link
                href="/dashboard/upgrade"
                className="inline-flex items-center h-11 px-5 rounded-xl bg-moroccan-gradient text-white text-sm font-semibold shadow-moroccan hover:brightness-105"
              >
                {t("notPro.cta")}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const isVerified = profile.is_verified
  const isPending = !isVerified && latest?.status === "pending"
  const isRejected =
    !isVerified && (!latest || latest.status === "rejected")
  const showRejectedBanner = !isVerified && latest?.status === "rejected"

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>

      {isVerified && (
        <VerificationStatus
          kind="verified"
          verifiedAt={latest?.reviewed_at ?? profile.updated_at ?? null}
        />
      )}

      {isPending && latest && (
        <VerificationStatus
          kind="pending"
          submittedAt={latest.created_at}
        />
      )}

      {showRejectedBanner && latest && (
        <VerificationStatus
          kind="rejected"
          submittedAt={latest.created_at}
          reason={latest.rejection_reason}
        />
      )}

      {/* Show the form when there's no active (pending/approved) request */}
      {!isVerified && !isPending && isRejected && (
        <VerificationForm userId={user.id} />
      )}
    </div>
  )
}

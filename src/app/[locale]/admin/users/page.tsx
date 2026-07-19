import { Users as UsersIcon } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ExportUsersButton } from "@/components/admin/ExportUsersButton"
import { UserRow } from "@/components/admin/UserRow"
import { UsersToolbar } from "@/components/admin/UsersToolbar"
import { EmptyState } from "@/components/ui/EmptyState"
import { createClient } from "@/lib/supabase/server"
import { listUsers } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

// Admins are excluded from this listing, so only these are filterable here.
const ACCOUNT_TYPES = ["gratuit", "pro"] as const
type FilterableType = (typeof ACCOUNT_TYPES)[number]

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  const { locale } = await params
  const sp = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.usersPage")

  const q = typeof sp.q === "string" ? sp.q : ""
  const accountType = ACCOUNT_TYPES.includes(sp.type as FilterableType)
    ? (sp.type as FilterableType)
    : undefined
  const hasFilters = q.trim().length > 0 || !!accountType

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const users = await listUsers({ limit: 200, q, accountType })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <ExportUsersButton users={users} />
      </header>

      <UsersToolbar />

      {users.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 shadow-card">
          <EmptyState
            icon={UsersIcon}
            title={hasFilters ? t("noResults") : t("empty")}
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-moroccan-sand-50/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-3">{t("columns.user")}</th>
                  <th className="text-start px-4 py-3">{t("columns.email")}</th>
                  <th className="text-start px-4 py-3">{t("columns.phone")}</th>
                  <th className="text-start px-4 py-3">{t("columns.whatsapp")}</th>
                  <th className="text-start px-4 py-3">{t("columns.type")}</th>
                  <th className="text-start px-4 py-3">{t("columns.joined")}</th>
                  <th className="text-end px-4 py-3">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <UserRow key={row.id} row={row} currentAdminId={user?.id ?? ""} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

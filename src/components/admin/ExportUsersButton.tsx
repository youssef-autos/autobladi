"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import type { AdminUserRow } from "@/lib/queries/admin"

type Props = {
  users: AdminUserRow[]
}

export function ExportUsersButton({ users }: Props) {
  const t = useTranslations("adminPanel.usersPage")
  const locale = useLocale()
  const [busy, setBusy] = useState(false)

  async function onExport() {
    if (users.length === 0) {
      toast.error(t("export.empty"))
      return
    }
    setBusy(true)
    try {
      // Lazy-load SheetJS so it never weighs down the page bundle.
      const XLSX = await import("xlsx")

      const header = [t("export.name"), t("export.phone"), t("export.email")]
      const rows = users.map((u) => [
        u.full_name ?? "",
        u.phone ?? "",
        u.email ?? "",
      ])

      const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
      ws["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 32 }]
      if (locale === "ar") ws["!views"] = [{ RTL: true }]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, t("export.sheet"))

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `autobladi-users-${date}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(t("export.done", { count: users.length }))
    } catch (e) {
      console.error("[export users]", (e as Error).message)
      toast.error(t("export.failed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={busy}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-moroccan-sand-50 transition-colors disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {t("export.button")}
    </button>
  )
}

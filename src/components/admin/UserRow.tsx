"use client"

import { useState, useTransition } from "react"
import {
  ArrowDownToLine,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { toast } from "sonner"

import { deleteUser, setUserRole } from "@/app/[locale]/admin/users/actions"
import { UserEditDialog } from "@/components/admin/UserEditDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VerifiedBadge } from "@/components/ui/VerifiedBadge"
import type { AdminUserRow } from "@/lib/queries/admin"

type Props = {
  row: AdminUserRow
  currentAdminId: string
}

function initials(name?: string | null, fallback?: string): string {
  if (!name) return fallback?.[0]?.toUpperCase() ?? "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function UserRow({ row, currentAdminId }: Props) {
  const t = useTranslations("adminPanel.usersPage")
  const tBadge = useTranslations("dashboard.badge")
  const tVerif = useTranslations("verification.badge")
  const format = useFormatter()
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  const isSelf = row.id === currentAdminId
  const isAdmin = row.account_type === "admin"
  // Promotion to admin is intentionally not exposed in the UI.
  const hasRoleActions = !isSelf && row.account_type !== "gratuit"

  function changeRole(role: "gratuit" | "pro" | "admin") {
    if (isSelf) {
      toast.error(t("toast.cantSelf"))
      return
    }
    startTransition(async () => {
      const res = await setUserRole({ id: row.id, role })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(
        role === "admin"
          ? t("toast.promoted")
          : role === "gratuit"
            ? t("toast.downgraded")
            : t("toast.demoted"),
      )
    })
  }

  function handleDelete() {
    if (!window.confirm(t("deleteConfirm", { name: row.full_name ?? row.email ?? row.id })))
      return
    startTransition(async () => {
      const res = await deleteUser({ id: row.id })
      if (!res.ok) {
        toast.error(t("toast.error"))
        return
      }
      toast.success(t("toast.deleted"))
    })
  }

  return (
    <tr
      className={`border-b border-border last:border-0 transition-colors ${
        isAdmin
          ? "bg-moroccan-gold-50/40 hover:bg-moroccan-gold-50/70"
          : "hover:bg-moroccan-sand-50/50"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            className={`size-9 shrink-0 ${
              isAdmin ? "ring-2 ring-moroccan-gold-400/60" : ""
            }`}
          >
            {row.avatar_url && <AvatarImage src={row.avatar_url} alt={row.full_name ?? ""} />}
            <AvatarFallback
              className={`text-sm font-semibold ${
                isAdmin
                  ? "bg-moroccan-gold-100 text-moroccan-gold-700"
                  : "bg-moroccan-sand-50 text-moroccan-red-500"
              }`}
            >
              {initials(row.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground truncate">
                {row.full_name ?? "—"}
              </p>
              {isAdmin && (
                <ShieldCheck
                  className="size-3.5 shrink-0 text-moroccan-gold-700"
                  aria-label={tBadge("admin")}
                />
              )}
              {isSelf && (
                <span className="shrink-0 rounded-full bg-moroccan-gold-500/15 text-moroccan-gold-700 text-[10px] font-semibold px-1.5 py-0.5">
                  {t("you")}
                </span>
              )}
            </div>
            {row.city && (
              <p className="text-xs text-muted-foreground truncate">{row.city}</p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-xs">
        {row.email ? (
          <span className="text-foreground" dir="ltr">
            {row.email}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {row.phone ? (
          <span dir="ltr">{row.phone}</span>
        ) : (
          "—"
        )}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {row.whatsapp ? (
          <span dir="ltr">{row.whatsapp}</span>
        ) : (
          "—"
        )}
      </td>

      <td className="px-4 py-3">
        {row.account_type === "admin" && (
          <Badge variant="featured">{tBadge("admin")}</Badge>
        )}
        {row.account_type === "pro" && <Badge variant="pro">{tBadge("pro")}</Badge>}
        {row.account_type === "gratuit" && (
          <Badge variant="outline">{tBadge("gratuit")}</Badge>
        )}
      </td>

      <td className="px-4 py-3">
        {row.is_verified ? (
          <VerifiedBadge
            label={tVerif("label")}
            tooltip={tVerif("tooltip")}
            size="sm"
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
        {format.dateTime(new Date(row.created_at), { dateStyle: "medium" })}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="actions"
              className="inline-flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:bg-moroccan-sand-50 hover:text-foreground"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="size-4 me-2" />
                {t("edit")}
              </DropdownMenuItem>
              {hasRoleActions && <DropdownMenuSeparator />}
              {row.account_type === "admin" && !isSelf && (
                <DropdownMenuItem
                  onClick={() => changeRole("pro")}
                  disabled={pending}
                >
                  <ShieldOff className="size-4 me-2" />
                  {t("demote")}
                </DropdownMenuItem>
              )}
              {row.account_type !== "gratuit" && !isSelf && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => changeRole("gratuit")}
                  disabled={pending}
                >
                  <ArrowDownToLine className="size-4 me-2" />
                  {t("downgrade")}
                </DropdownMenuItem>
              )}
              {!isSelf && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={pending}
                  >
                    <Trash2 className="size-4 me-2" />
                    {t("delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <UserEditDialog open={editOpen} onOpenChange={setEditOpen} user={row} />
        </div>
      </td>
    </tr>
  )
}

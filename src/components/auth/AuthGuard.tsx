"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"

import { useUser } from "@/hooks/use-user"
import type { Tables } from "@/types/database.types"

type Props = {
  children: React.ReactNode
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

type AccountType = Tables<"profiles">["account_type"]

export function AuthGuard({ children, requireAdmin = false, fallback = null }: Props) {
  const { user, profile, loading } = useUser()
  const router = useRouter()
  const locale = useLocale()

  const allowed =
    !loading && !!user && (!requireAdmin || (profile?.account_type as AccountType) === "admin")

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace(`/${locale}/auth/connexion`)
      return
    }
    if (requireAdmin && profile?.account_type !== "admin") {
      router.replace(`/${locale}`)
    }
  }, [loading, user, profile, requireAdmin, router, locale])

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}

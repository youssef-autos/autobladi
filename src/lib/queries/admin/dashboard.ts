import "server-only"

import { createClient } from "@/lib/supabase/server"

export type AdminCounts = {
  users: number
  newUsersMonth: number
  totalAnnonces: number
  activeAnnonces: number
  pendingAnnonces: number
  showrooms: number
  pendingShowrooms: number
  pendingReports: number
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const supabase = await createClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthStartIso = monthStart.toISOString()

  const [
    usersRes,
    newUsersRes,
    totalRes,
    activeRes,
    pendingAnnRes,
    showroomsRes,
    pendingShowroomsRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStartIso),
    supabase.from("annonces").select("id", { count: "exact", head: true }),
    supabase
      .from("annonces")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("annonces")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("showrooms").select("id", { count: "exact", head: true }),
    supabase
      .from("showrooms")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ])
  return {
    users: usersRes.count ?? 0,
    newUsersMonth: newUsersRes.count ?? 0,
    totalAnnonces: totalRes.count ?? 0,
    activeAnnonces: activeRes.count ?? 0,
    pendingAnnonces: pendingAnnRes.count ?? 0,
    showrooms: showroomsRes.count ?? 0,
    pendingShowrooms: pendingShowroomsRes.count ?? 0,
    pendingReports: reportsRes.count ?? 0,
  }
}

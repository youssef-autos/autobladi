import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { AnnonceStatus, RequestStatus, Tables } from "@/types/database.types"

// ---------------------------------------------------------------------------
// Reports — annonce abuse reports, joined with the annonce + reporter
// ---------------------------------------------------------------------------
export type AdminReportRow = {
  id: string
  reason: string
  description: string | null
  status: RequestStatus
  created_at: string
  annonce: {
    id: string
    slug: string
    title: string
    status: AnnonceStatus
    main_image: string | null
  } | null
  reporter: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

type RawReportRow = Tables<"reports"> & {
  annonces:
    | (Tables<"annonces"> & {
        annonce_images:
          | { url: string; is_main: boolean; order_index: number }[]
          | null
      })
    | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listReports(): Promise<AdminReportRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("reports")
    .select(`
      id, reason, description, status, created_at,
      annonces(id, slug, title, status, annonce_images(url, is_main, order_index)),
      profiles!reporter_id(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as unknown as RawReportRow[]
  return rows.map((r) => {
    const images = r.annonces?.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: r.id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      annonce: r.annonces
        ? {
            id: r.annonces.id,
            slug: r.annonces.slug,
            title: r.annonces.title,
            status: r.annonces.status,
            main_image: main?.url ?? null,
          }
        : null,
      reporter: r.profiles,
    }
  })
}

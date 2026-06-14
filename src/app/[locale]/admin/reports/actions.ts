"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type ReportResult = { ok: true } | { ok: false; error: string }

async function adminClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  if (profile?.account_type !== "admin") return null
  return { supabase, adminId: user.id }
}

function revalidate() {
  revalidatePath("/admin/reports")
  revalidatePath("/admin")
}

const idSchema = z.uuid()

async function setReportStatus(
  input: unknown,
  status: "approved" | "rejected",
): Promise<ReportResult> {
  const parsed = idSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_id" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error } = await ctx.supabase
    .from("reports")
    .update({ status } as never)
    .eq("id", parsed.data)
  if (error) return { ok: false, error: error.message }

  revalidate()
  return { ok: true }
}

// Mark a report as handled (valid report, action taken / acknowledged).
export async function resolveReport(input: unknown): Promise<ReportResult> {
  return setReportStatus(input, "approved")
}

// Dismiss a report (not a valid concern — ignore it).
export async function dismissReport(input: unknown): Promise<ReportResult> {
  return setReportStatus(input, "rejected")
}

// ---------------------------------------------------------------------------
// Take down the reported annonce + resolve the report in one step
// ---------------------------------------------------------------------------
const takedownSchema = z.object({
  reportId: z.uuid(),
  annonceId: z.uuid(),
})

export async function takedownAnnonceFromReport(
  input: unknown,
): Promise<ReportResult> {
  const parsed = takedownSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const ctx = await adminClient()
  if (!ctx) return { ok: false, error: "forbidden" }

  const { error: annonceError } = await ctx.supabase
    .from("annonces")
    .update({
      status: "rejected",
      rejection_reason: "Annonce signalée et retirée par la modération",
    } as never)
    .eq("id", parsed.data.annonceId)
  if (annonceError) return { ok: false, error: annonceError.message }

  const { error: reportError } = await ctx.supabase
    .from("reports")
    .update({ status: "approved" } as never)
    .eq("id", parsed.data.reportId)
  if (reportError) return { ok: false, error: reportError.message }

  revalidate()
  revalidatePath("/annonces")
  revalidatePath("/admin/annonces")
  return { ok: true }
}

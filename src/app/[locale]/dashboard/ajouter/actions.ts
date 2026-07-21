"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { fullAnnonceSchema } from "@/lib/validations/annonce"
import { getRecipientById } from "@/lib/email/recipients"
import { sendAnnoncePendingEmail } from "@/lib/email/send"

export type PublishResult =
  | { ok: true; annonceId: string; slug: string }
  | { ok: false; error: string; field?: string }

export type UpdateResult =
  | { ok: true; slug: string }
  | { ok: false; error: string; field?: string }

const DEFAULT_DURATION_DAYS = 60

type DbClient = Awaited<ReturnType<typeof createClient>>

// Every account now gets the longer lifetime (formerly a Pro-only perk) —
// all features are free.
async function getDurationDays(supabase: DbClient): Promise<number> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "annonce_duration_days_pro")
    .maybeSingle<{ value: unknown }>()
  const raw = data?.value
  if (typeof raw === "number" && raw > 0) return raw
  if (typeof raw === "string" && !Number.isNaN(Number(raw)) && Number(raw) > 0) {
    return Number(raw)
  }
  return DEFAULT_DURATION_DAYS
}

// Promo videos are a professionals-only perk — enforced here so a crafted
// request from a non-pro can never persist a video on a listing.
async function isProAccount(supabase: DbClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle<{ account_type: string }>()
  return data?.account_type === "pro" || data?.account_type === "admin"
}

export async function publishAnnonce(input: unknown): Promise<PublishResult> {
  const parsed = fullAnnonceSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? "validation",
      field: first?.path?.join(".") ?? undefined,
    }
  }

  const v = parsed.data
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  // Publishing is unlimited and free for every account — no quota check.
  const days = await getDurationDays(supabase)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const pro = await isProAccount(supabase, user.id)

  const annoncePayload = {
    user_id: user.id,
    title: v.title,
    description: v.description,
    brand_id: v.brandId,
    model_id: v.modelId || null,
    city_id: v.cityId || null,
    secteur_id: v.secteurId || null,
    year: v.year,
    mileage: v.mileage,
    price: v.price,
    price_on_request: v.priceOnRequest,
    negotiable: v.negotiable,
    fuel_type: v.fuelType,
    transmission: v.transmission,
    color: v.color.trim() || null,
    origine: v.origine,
    doors: v.doors,
    seats: v.seats,
    engine_power: v.enginePower,
    engine_size: v.engineSize,
    first_owner: v.firstOwner,
    accident_free: v.accidentFree,
    condition: v.condition,
    options: v.options,
    contact_phone: v.contactPhone,
    contact_whatsapp: v.contactWhatsapp,
    video_url: pro ? (v.videoUrl ?? null) : null,
    status: "pending" as const,
    expires_at: expiresAt.toISOString(),
  }

  const { data: created, error: insertError } = await supabase
    .from("annonces")
    .insert(annoncePayload as never)
    .select("id, slug")
    .single<{ id: string; slug: string }>()

  if (insertError || !created) {
    return { ok: false, error: insertError?.message ?? "insert_failed" }
  }

  const imagesPayload = v.images.map((img, idx) => ({
    annonce_id: created.id,
    url: img.url,
    thumbnail_url: img.thumbnail_url,
    is_main: img.is_main || idx === 0,
    order_index: idx,
  }))

  const { error: imagesError } = await supabase
    .from("annonce_images")
    .insert(imagesPayload as never)

  if (imagesError) {
    // Roll back the annonce row so we don't leave it orphaned without images
    await supabase.from("annonces").delete().eq("id", created.id)
    return { ok: false, error: "images_insert_failed" }
  }

  // Fire-and-forget pending notification. Email failures must not break the
  // publish flow — the user already sees a success toast from the wizard.
  void getRecipientById(user.id).then((recipient) => {
    if (recipient) {
      void sendAnnoncePendingEmail({
        to: recipient.email,
        name: recipient.name,
        annonceTitle: v.title,
        lang: recipient.lang,
      })
    }
  })

  return { ok: true, annonceId: created.id, slug: created.slug }
}

// ---------------------------------------------------------------------------
// Update an existing annonce (owner only). Edits send the ad back to the
// moderation queue (status → pending) and replace its images.
// ---------------------------------------------------------------------------
export async function updateAnnonce(
  id: string,
  input: unknown,
): Promise<UpdateResult> {
  const parsed = fullAnnonceSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? "validation",
      field: first?.path?.join(".") ?? undefined,
    }
  }

  const v = parsed.data
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "auth_required" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle<{ account_type: string }>()
  const isAdmin = profile?.account_type === "admin"

  let ownershipQuery = supabase
    .from("annonces")
    .select("id, slug, user_id")
    .eq("id", id)
  if (!isAdmin) ownershipQuery = ownershipQuery.eq("user_id", user.id)
  const { data: existing } = await ownershipQuery.maybeSingle<{ id: string; slug: string; user_id: string }>()
  if (!existing) return { ok: false, error: "not_found" }

  const pro = await isProAccount(supabase, user.id)

  const updatePayload = {
    title: v.title,
    description: v.description,
    brand_id: v.brandId,
    model_id: v.modelId || null,
    city_id: v.cityId || null,
    secteur_id: v.secteurId || null,
    year: v.year,
    mileage: v.mileage,
    price: v.price,
    price_on_request: v.priceOnRequest,
    negotiable: v.negotiable,
    fuel_type: v.fuelType,
    transmission: v.transmission,
    color: v.color.trim() || null,
    origine: v.origine,
    doors: v.doors,
    seats: v.seats,
    engine_power: v.enginePower,
    engine_size: v.engineSize,
    first_owner: v.firstOwner,
    accident_free: v.accidentFree,
    condition: v.condition,
    options: v.options,
    contact_phone: v.contactPhone,
    contact_whatsapp: v.contactWhatsapp,
    video_url: pro ? (v.videoUrl ?? null) : null,
    ...(isAdmin ? {} : { status: "pending" as const, rejection_reason: null }),
  }

  const { error: updateError } = await supabase
    .from("annonces")
    .update(updatePayload as never)
    .eq("id", id)
  if (updateError) return { ok: false, error: updateError.message }

  // Replace images wholesale (simplest correct approach for an edit).
  await supabase.from("annonce_images").delete().eq("annonce_id", id)
  const imagesPayload = v.images.map((img, idx) => ({
    annonce_id: id,
    url: img.url,
    thumbnail_url: img.thumbnail_url,
    is_main: img.is_main || idx === 0,
    order_index: idx,
  }))
  const { error: imagesError } = await supabase
    .from("annonce_images")
    .insert(imagesPayload as never)
  if (imagesError) return { ok: false, error: imagesError.message }

  revalidatePath("/dashboard/annonces")
  revalidatePath(`/annonces/${existing.slug}`)
  return { ok: true, slug: existing.slug }
}

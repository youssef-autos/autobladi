import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getAllAdSlots,
  resolveAdSlot,
  type AdSlotOverrides,
} from "@/config/ads.config"
import type { AnnonceStatus, RequestStatus, Tables } from "@/types/database.types"

export type AdminCounts = {
  users: number
  newUsersMonth: number
  totalAnnonces: number
  activeAnnonces: number
  pendingAnnonces: number
  professionnels: number
  pendingVerification: number
  pendingSubs: number
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
    concRes,
    verifRes,
    subsRes,
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
    supabase.from("professionnels").select("id", { count: "exact", head: true }),
    supabase
      .from("verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("subscription_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
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
    professionnels: concRes.count ?? 0,
    pendingVerification: verifRes.count ?? 0,
    pendingSubs: subsRes.count ?? 0,
    pendingReports: reportsRes.count ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Pending annonces queue
// ---------------------------------------------------------------------------
export type PendingAnnonceRow = {
  id: string
  slug: string
  title: string
  price: number | null
  created_at: string
  main_image: string | null
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
    is_verified: boolean
  } | null
  brand: { name: string } | null
  model: { name: string } | null
  city: { name_ar: string; name_fr: string } | null
}

type RawPendingAnnonce = Tables<"annonces"> & {
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
    is_verified: boolean
  } | null
  brands: { name: string } | null
  car_models: { name: string } | null
  cities: { name_ar: string; name_fr: string } | null
}

export async function listPendingAnnonces(): Promise<PendingAnnonceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(`
      id, slug, title, price, created_at,
      annonce_images(url, is_main, order_index),
      profiles(id, full_name, avatar_url, account_type, is_verified),
      brands(name),
      car_models(name),
      cities(name_ar, name_fr)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
  const rows = (data ?? []) as unknown as RawPendingAnnonce[]
  return rows.map((r) => {
    const images = r.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      price: r.price,
      created_at: r.created_at,
      main_image: main?.url ?? null,
      user: r.profiles,
      brand: r.brands,
      model: r.car_models,
      city: r.cities,
    }
  })
}

// ---------------------------------------------------------------------------
// All annonces — admin management table (every status, newest first)
// ---------------------------------------------------------------------------
export type AdminAnnonceRow = {
  id: string
  slug: string
  title: string
  price: number | null
  status: AnnonceStatus
  featured: boolean
  views_count: number
  created_at: string
  main_image: string | null
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
  brand: { name: string } | null
  model: { name: string } | null
  city: { name_ar: string; name_fr: string } | null
}

type RawAdminAnnonce = Tables<"annonces"> & {
  annonce_images: { url: string; is_main: boolean; order_index: number }[] | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    account_type: Tables<"profiles">["account_type"]
  } | null
  brands: { name: string } | null
  car_models: { name: string } | null
  cities: { name_ar: string; name_fr: string } | null
}

export async function listAllAnnoncesAdmin(
  limit = 300,
): Promise<AdminAnnonceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(`
      id, slug, title, price, status, featured, views_count, created_at,
      annonce_images(url, is_main, order_index),
      profiles(id, full_name, avatar_url, account_type),
      brands(name),
      car_models(name),
      cities(name_ar, name_fr)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as unknown as RawAdminAnnonce[]
  return rows.map((r) => {
    const images = r.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      price: r.price,
      status: r.status,
      featured: r.featured,
      views_count: r.views_count,
      created_at: r.created_at,
      main_image: main?.url ?? null,
      user: r.profiles,
      brand: r.brands,
      model: r.car_models,
      city: r.cities,
    }
  })
}

export async function listFeaturedAnnoncesAdmin(): Promise<AdminAnnonceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("annonces")
    .select(`
      id, slug, title, price, status, featured, views_count, created_at,
      annonce_images(url, is_main, order_index),
      profiles(id, full_name, avatar_url, account_type),
      brands(name),
      car_models(name),
      cities(name_ar, name_fr)
    `)
    .eq("featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as unknown as RawAdminAnnonce[]
  return rows.map((r) => {
    const images = r.annonce_images ?? []
    const main = images.find((i) => i.is_main) ?? images[0] ?? null
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      price: r.price,
      status: r.status,
      featured: r.featured,
      views_count: r.views_count,
      created_at: r.created_at,
      main_image: main?.url ?? null,
      user: r.profiles,
      brand: r.brands,
      model: r.car_models,
      city: r.cities,
    }
  })
}

// ---------------------------------------------------------------------------
// Professionnels — admin list joined with city + owner + annonces count
// ---------------------------------------------------------------------------
export type AdminProfessionnelRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  rating: number
  reviews_count: number
  is_active: boolean
  created_at: string
  city: { name_ar: string; name_fr: string } | null
  owner: { id: string; full_name: string | null; avatar_url: string | null } | null
  annonces_count: number
}

type RawProfessionnel = Tables<"professionnels"> & {
  cities: { name_ar: string; name_fr: string } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listAllProfessionnelsAdmin(): Promise<
  AdminProfessionnelRow[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("professionnels")
    .select(`
      id, user_id, name, slug, logo_url, rating, reviews_count, is_active, created_at,
      cities(name_ar, name_fr),
      profiles(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as unknown as RawProfessionnel[]

  // Count active annonces per owner (professionnels & annonces both key on user_id)
  const { data: annonceRows } = await supabase
    .from("annonces")
    .select("user_id")
    .eq("status", "active")
  const countMap = new Map<string, number>()
  for (const a of (annonceRows ?? []) as Array<{ user_id: string | null }>) {
    if (!a.user_id) continue
    countMap.set(a.user_id, (countMap.get(a.user_id) ?? 0) + 1)
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logo_url: r.logo_url,
    rating: r.rating,
    reviews_count: r.reviews_count,
    is_active: r.is_active,
    created_at: r.created_at,
    city: r.cities,
    owner: r.profiles,
    annonces_count: countMap.get(r.user_id) ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Professionnel reviews — moderation (admins may delete abusive reviews)
// ---------------------------------------------------------------------------
export type AdminReviewRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  dealer: { id: string; name: string; slug: string; logo_url: string | null } | null
  author: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type RawReviewRow = Tables<"professionnel_reviews"> & {
  professionnels: { id: string; name: string; slug: string; logo_url: string | null } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listReviewsAdmin(): Promise<AdminReviewRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("professionnel_reviews")
    .select(`
      id, rating, comment, created_at,
      professionnels(id, name, slug, logo_url),
      profiles!user_id(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
  if (error) console.error("[listReviewsAdmin]", error.message)
  const rows = (data ?? []) as unknown as RawReviewRow[]
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    dealer: r.professionnels,
    author: r.profiles,
  }))
}

// ---------------------------------------------------------------------------
// Blog categories — admin CRUD (post counts include drafts)
// ---------------------------------------------------------------------------
export type AdminBlogCategoryRow = Tables<"blog_categories"> & {
  posts_count: number
}

export async function listBlogCategoriesAdmin(): Promise<AdminBlogCategoryRow[]> {
  const supabase = await createClient()
  const { data: cats } = await supabase
    .from("blog_categories")
    .select("*")
    .order("order_index", { ascending: true })
  if (!cats || cats.length === 0) return []

  // Count ALL posts per category (published + drafts) — local aggregate.
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("category_id")
  const counts = new Map<string, number>()
  for (const row of (posts ?? []) as Array<{ category_id: string | null }>) {
    if (!row.category_id) continue
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1)
  }

  return (cats as Tables<"blog_categories">[]).map((c) => ({
    ...c,
    posts_count: counts.get(c.id) ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Blog posts — admin CRUD (lists drafts + published)
// ---------------------------------------------------------------------------
export type AdminBlogPostRow = {
  id: string
  title: string
  slug: string
  is_published: boolean
  published_at: string | null
  views_count: number
  comments_count: number
  cover_image: string | null
  created_at: string
  category: { id: string; name_ar: string; name_fr: string } | null
  author: { id: string; full_name: string | null } | null
}

type RawAdminPostRow = Tables<"blog_posts"> & {
  blog_categories: { id: string; name_ar: string; name_fr: string } | null
  profiles: { id: string; full_name: string | null } | null
}

export async function listBlogPostsAdmin(): Promise<AdminBlogPostRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id, title, slug, is_published, published_at, views_count,
      comments_count, cover_image, created_at,
      blog_categories(id, name_ar, name_fr),
      profiles!author_id(id, full_name)
    `)
    .order("created_at", { ascending: false })
  if (error) console.error("[listBlogPostsAdmin]", error.message)
  const rows = (data ?? []) as unknown as RawAdminPostRow[]
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    is_published: r.is_published,
    published_at: r.published_at,
    views_count: r.views_count,
    comments_count: r.comments_count,
    cover_image: r.cover_image,
    created_at: r.created_at,
    category: r.blog_categories,
    author: r.profiles,
  }))
}

export type AdminBlogPostFull = Pick<
  Tables<"blog_posts">,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "content"
  | "title_fr"
  | "excerpt_fr"
  | "content_fr"
  | "cover_image"
  | "category_id"
  | "tags"
  | "is_published"
>

export async function getBlogPostAdmin(
  id: string,
): Promise<AdminBlogPostFull | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, content, title_fr, excerpt_fr, content_fr, cover_image, category_id, tags, is_published",
    )
    .eq("id", id)
    .maybeSingle()
  return (data as AdminBlogPostFull | null) ?? null
}

// ---------------------------------------------------------------------------
// Blog comments — moderation (approve / hide / delete)
// ---------------------------------------------------------------------------
export type AdminBlogCommentRow = {
  id: string
  content: string
  is_approved: boolean
  created_at: string
  is_reply: boolean
  post: { id: string; title: string; slug: string } | null
  author: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type RawAdminCommentRow = Tables<"blog_comments"> & {
  blog_posts: { id: string; title: string; slug: string } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listBlogCommentsAdmin(): Promise<AdminBlogCommentRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_comments")
    .select(`
      id, content, is_approved, created_at, parent_id,
      blog_posts(id, title, slug),
      profiles!user_id(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
  if (error) console.error("[listBlogCommentsAdmin]", error.message)
  const rows = (data ?? []) as unknown as RawAdminCommentRow[]
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    is_approved: r.is_approved,
    created_at: r.created_at,
    is_reply: r.parent_id != null,
    post: r.blog_posts,
    author: r.profiles,
  }))
}

// ---------------------------------------------------------------------------
// CMS content pages — admin CRUD
// ---------------------------------------------------------------------------
export type AdminPageRow = Pick<
  Tables<"pages">,
  | "id"
  | "slug"
  | "title_fr"
  | "title_ar"
  | "is_published"
  | "show_in_footer"
  | "order_index"
  | "updated_at"
>

export async function listPagesAdmin(): Promise<AdminPageRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pages")
    .select(
      "id, slug, title_fr, title_ar, is_published, show_in_footer, order_index, updated_at",
    )
    .order("order_index", { ascending: true })
  if (error) console.error("[listPagesAdmin]", error.message)
  return (data ?? []) as AdminPageRow[]
}

export async function getPageAdmin(id: string): Promise<Tables<"pages"> | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return (data as Tables<"pages"> | null) ?? null
}

// ---------------------------------------------------------------------------
// Contact messages — public contact-form submissions (unread first)
// ---------------------------------------------------------------------------
export type AdminContactMessage = Tables<"contact_messages">

export async function listContactMessages(): Promise<AdminContactMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false })
  return (data ?? []) as AdminContactMessage[]
}

// ---------------------------------------------------------------------------
// Subscription plans — admin list (cheapest first)
// ---------------------------------------------------------------------------
export type AdminPlanRow = Tables<"subscription_plans">

export async function listAllPlansAdmin(): Promise<AdminPlanRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("price", { ascending: true })
    .order("created_at", { ascending: true })
  return (data ?? []) as AdminPlanRow[]
}

// ---------------------------------------------------------------------------
// Subscriptions — full history (every request, newest first)
// ---------------------------------------------------------------------------
export type AdminSubscriptionRow = {
  id: string
  amount: number
  status: RequestStatus
  bank_reference: string | null
  rejection_reason: string | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
  plan: { name: string; name_ar: string | null; duration_days: number } | null
  user: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type RawSubHistoryRow = Tables<"subscription_requests"> & {
  subscription_plans: {
    name: string
    name_ar: string | null
    duration_days: number
  } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listAllSubscriptionsAdmin(
  limit = 300,
): Promise<AdminSubscriptionRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("subscription_requests")
    .select(`
      id, amount, status, bank_reference, rejection_reason,
      starts_at, ends_at, created_at,
      subscription_plans(name, name_ar, duration_days),
      profiles!user_id(id, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)
  const rows = (data ?? []) as unknown as RawSubHistoryRow[]
  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    status: r.status,
    bank_reference: r.bank_reference,
    rejection_reason: r.rejection_reason,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    created_at: r.created_at,
    plan: r.subscription_plans,
    user: r.profiles,
  }))
}

// ---------------------------------------------------------------------------
// Newsletter — subscriber stats
// ---------------------------------------------------------------------------
export type NewsletterStats = {
  subscribers: number
  unsubscribed: number
  total: number
}

export async function getNewsletterStats(): Promise<NewsletterStats> {
  const supabase = await createClient()
  const [totalRes, subRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("newsletter_subscribed", true),
  ])
  const total = totalRes.count ?? 0
  const subscribers = subRes.count ?? 0
  return { subscribers, unsubscribed: total - subscribers, total }
}

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

// ---------------------------------------------------------------------------
// Pending verification queue
// ---------------------------------------------------------------------------
export type VerificationReviewRow = {
  id: string
  user_id: string
  company_name: string
  manager_name: string | null
  rc_number: string | null
  rc_document_url: string | null
  id_card_url: string | null
  professional_phone: string | null
  address: string | null
  created_at: string
  user: { id: string; full_name: string | null; avatar_url: string | null } | null
}

type RawVerifRow = Tables<"verification_requests"> & {
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

export async function listPendingVerifications(): Promise<VerificationReviewRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("verification_requests")
    .select(`
      id, user_id, company_name, manager_name, rc_number,
      rc_document_url, id_card_url, professional_phone, address, created_at,
      profiles!user_id(id, full_name, avatar_url)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
  const rows = (data ?? []) as unknown as RawVerifRow[]
  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    company_name: r.company_name,
    manager_name: r.manager_name,
    rc_number: r.rc_number,
    rc_document_url: r.rc_document_url,
    id_card_url: r.id_card_url,
    professional_phone: r.professional_phone,
    address: r.address,
    created_at: r.created_at,
    user: r.profiles,
  }))
}

// ---------------------------------------------------------------------------
// Pending subscriptions queue
// ---------------------------------------------------------------------------
export type SubscriptionReviewRow = {
  id: string
  user_id: string
  amount: number
  bank_reference: string | null
  receipt_url: string | null
  created_at: string
  plan: { id: string; name: string; name_ar: string | null; duration_days: number } | null
  user: { id: string; full_name: string | null; avatar_url: string | null; account_type: Tables<"profiles">["account_type"] } | null
}

type RawSubRow = Tables<"subscription_requests"> & {
  subscription_plans: { id: string; name: string; name_ar: string | null; duration_days: number } | null
  profiles: { id: string; full_name: string | null; avatar_url: string | null; account_type: Tables<"profiles">["account_type"] } | null
}

export async function listPendingSubscriptions(): Promise<SubscriptionReviewRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("subscription_requests")
    .select(`
      id, user_id, amount, bank_reference, receipt_url, created_at,
      subscription_plans(id, name, name_ar, duration_days),
      profiles!user_id(id, full_name, avatar_url, account_type)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
  if (error) console.error("[listPendingSubscriptions]", error.message)
  const rows = (data ?? []) as unknown as RawSubRow[]
  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    amount: r.amount,
    bank_reference: r.bank_reference,
    receipt_url: r.receipt_url,
    created_at: r.created_at,
    plan: r.subscription_plans,
    user: r.profiles,
  }))
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export type AdminUserRow = Pick<
  Tables<"profiles">,
  | "id"
  | "full_name"
  | "phone"
  | "whatsapp"
  | "avatar_url"
  | "account_type"
  | "is_verified"
  | "city"
  | "created_at"
> & { email: string | null }

export async function listUsers(opts: {
  q?: string
  accountType?: Tables<"profiles">["account_type"] | null
  limit?: number
}): Promise<AdminUserRow[]> {
  const supabase = await createClient()
  const needle = opts.q?.trim().toLowerCase() ?? ""
  const hasQuery = needle.length > 0
  const limit = opts.limit ?? 100

  let q = supabase
    .from("profiles")
    .select(
      "id, full_name, phone, whatsapp, avatar_url, account_type, is_verified, city, created_at",
    )
    // Admin accounts are managed from each admin's own account page, not here.
    .neq("account_type", "admin")
    .order("created_at", { ascending: false })
    // When searching, pull a wider window so the in-memory filter — which also
    // matches the email (fetched separately from auth) — sees all candidates.
    .limit(hasQuery ? 1000 : limit)
  if (opts.accountType) q = q.eq("account_type", opts.accountType)
  const { data } = await q
  const rows = (data ?? []) as unknown as Omit<AdminUserRow, "email">[]

  // Emails live in auth.users — fetch them via the service-role admin client
  // and merge by id.
  const emailById = new Map<string, string | null>()
  try {
    const admin = createAdminClient()
    const { data: authData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    for (const u of authData?.users ?? []) {
      emailById.set(u.id, u.email ?? null)
    }
  } catch (e) {
    console.error("[listUsers] email fetch", (e as Error).message)
  }

  let merged: AdminUserRow[] = rows.map((r) => ({
    ...r,
    email: emailById.get(r.id) ?? null,
  }))

  // Search across name, phone, whatsapp, city and email (contains match).
  if (hasQuery) {
    merged = merged
      .filter((r) =>
        [r.full_name, r.phone, r.whatsapp, r.city, r.email].some((v) =>
          (v ?? "").toLowerCase().includes(needle),
        ),
      )
      .slice(0, limit)
  }

  return merged
}

// ---------------------------------------------------------------------------
// Cities — admin list (no pagination; ~50 rows total expected)
// ---------------------------------------------------------------------------
export type AdminCityRow = Tables<"cities">

export async function listAllCitiesAdmin(): Promise<AdminCityRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("cities")
    .select("*")
    .order("name_fr", { ascending: true })
  return (data ?? []) as AdminCityRow[]
}

// ---------------------------------------------------------------------------
// Secteurs — list for a specific city
// ---------------------------------------------------------------------------
export type AdminSecteurRow = Tables<"secteurs">

export async function listSecteursForCity(
  cityId: string,
): Promise<AdminSecteurRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("secteurs")
    .select("*")
    .eq("city_id", cityId)
    .order("name_fr", { ascending: true })
  return (data ?? []) as AdminSecteurRow[]
}

// ---------------------------------------------------------------------------
// Brands — admin list (sorted by manual order_index, ~50-100 rows expected)
// ---------------------------------------------------------------------------
export type AdminBrandRow = Tables<"brands">

export async function listAllBrandsAdmin(): Promise<AdminBrandRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("brands")
    .select("*")
    .order("order_index", { ascending: true })
    .order("name", { ascending: true })
  return (data ?? []) as AdminBrandRow[]
}

// ---------------------------------------------------------------------------
// Models — admin list joined with brand for display (brand name + slug).
// ---------------------------------------------------------------------------
export type AdminModelRow = Tables<"car_models"> & {
  brand: { id: string; name: string; slug: string; logo_url: string | null } | null
}

type RawModelRow = Tables<"car_models"> & {
  brands: { id: string; name: string; slug: string; logo_url: string | null } | null
}

// ---------------------------------------------------------------------------
// Placements — all 15 slots with ad count
// ---------------------------------------------------------------------------
export type AdminPlacementRow = Tables<"ad_placements"> & {
  ads_count: number
}

export async function listAllPlacementsAdmin(): Promise<AdminPlacementRow[]> {
  const supabase = await createClient()
  const { data: placements } = await supabase
    .from("ad_placements")
    .select("*")
    .order("slug", { ascending: true })

  // Count active ads per placement via a compact aggregate
  const { data: counts } = await supabase
    .from("advertisements")
    .select("placement_id")
    .eq("is_active", true)

  const countMap = new Map<string, number>()
  for (const row of (counts ?? []) as Array<{ placement_id: string }>) {
    countMap.set(row.placement_id, (countMap.get(row.placement_id) ?? 0) + 1)
  }

  return ((placements ?? []) as Tables<"ad_placements">[]).map((p) => ({
    ...p,
    ads_count: countMap.get(p.id) ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Full ad-slot settings for the admin editor — every slot in the config
// registry, merged with its saved DB overrides, plus its active-ad count.
// Driven by the config registry so the list is always the canonical set of
// slots (stray legacy rows in the DB are ignored).
// ---------------------------------------------------------------------------
export type AdSlotSettingsRow = {
  slug: string
  name: string
  is_active: boolean
  device: "mobile" | "desktop" | "both"
  default_provider: "adsense" | "direct"
  width: number
  height: number
  width_mobile: number
  height_mobile: number
  adsense_slot_id: string
  lazy: boolean
  ads_count: number
}

export async function listAdSlotSettings(): Promise<AdSlotSettingsRow[]> {
  const supabase = await createClient()

  const [{ data: rows }, { data: counts }] = await Promise.all([
    supabase.from("ad_placements").select("*"),
    supabase.from("advertisements").select("placement_id").eq("is_active", true),
  ])

  const countMap = new Map<string, number>()
  for (const c of (counts ?? []) as Array<{ placement_id: string }>) {
    countMap.set(c.placement_id, (countMap.get(c.placement_id) ?? 0) + 1)
  }

  const bySlug = new Map<string, { id: string } & AdSlotOverrides>()
  for (const r of (rows ?? []) as Array<{ id: string; slug: string } & AdSlotOverrides>) {
    bySlug.set(r.slug, r)
  }

  return getAllAdSlots().map((slot) => {
    const row = bySlug.get(slot.id)
    const r = resolveAdSlot(slot.id, (row ?? null) as AdSlotOverrides | null)!
    return {
      slug: slot.id,
      name: r.label,
      is_active: r.enabled,
      device: r.device,
      default_provider: r.defaultProvider,
      width: r.sizes.desktop.width,
      height: r.sizes.desktop.height,
      width_mobile: r.sizes.mobile.width,
      height_mobile: r.sizes.mobile.height,
      adsense_slot_id: r.adsenseSlotId,
      lazy: r.lazy,
      ads_count: row ? countMap.get(row.id) ?? 0 : 0,
    }
  })
}

// ---------------------------------------------------------------------------
// Advertisements — all with placement name + slug
// ---------------------------------------------------------------------------
export type AdminAdRow = Tables<"advertisements"> & {
  placement: { id: string; name: string; slug: string; width: number | null; height: number | null } | null
}

type RawAdRow = Tables<"advertisements"> & {
  ad_placements: { id: string; name: string; slug: string; width: number | null; height: number | null } | null
}

export async function listAllAdsAdmin(): Promise<AdminAdRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("advertisements")
    .select(
      `id, placement_id, title, image_url, link_url, starts_at, ends_at,
       is_active, clicks, impressions, created_at,
       ad_placements(id, name, slug, width, height)`,
    )
    .order("created_at", { ascending: false })
  const rows = (data ?? []) as unknown as RawAdRow[]
  return rows.map((r) => ({
    ...r,
    placement: r.ad_placements,
  }))
}

export async function listAllModelsAdmin(): Promise<AdminModelRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("car_models")
    .select(
      `id, brand_id, name, slug, is_active, created_at,
       brands(id, name, slug, logo_url)`,
    )
    .order("name", { ascending: true })
  const rows = (data ?? []) as unknown as RawModelRow[]
  return rows.map((r) => ({
    id: r.id,
    brand_id: r.brand_id,
    name: r.name,
    slug: r.slug,
    is_active: r.is_active,
    created_at: r.created_at,
    brand: r.brands,
  }))
}

// ---------------------------------------------------------------------------
// Ads Report — aggregated site stats for advertiser pitching
// ---------------------------------------------------------------------------
export type AdsReportData = {
  reach: {
    totalUsers: number
    newUsersThisMonth: number
    totalActiveListings: number
    totalPageViews: number
    newsletterSubscribers: number
    proUsers: number
  }
  monthlyGrowth: { month: string; users: number; listings: number }[]
  topCities: { city: string; count: number }[]
  placementStats: {
    name: string
    slug: string
    impressions: number
    clicks: number
    ctr: number
    activeAds: number
  }[]
}

export async function getAdsReport(): Promise<AdsReportData> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalUsersRes,
    newUsersRes,
    activeListingsRes,
    newsletterRes,
    proUsersRes,
    viewsRes,
    profileDatesRes,
    listingDatesRes,
    cityRes,
    placementRes,
    adRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("annonces")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("newsletter_subscribed", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "pro"),
    supabase.from("annonces").select("views_count").eq("status", "active"),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString()),
    supabase
      .from("annonces")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString()),
    supabase.from("profiles").select("city").not("city", "is", null),
    supabase.from("ad_placements").select("id, name, slug"),
    supabase
      .from("advertisements")
      .select("placement_id, impressions, clicks, is_active"),
  ])

  const views = (viewsRes.data ?? []) as Array<{ views_count: number }>
  const totalPageViews = views.reduce((sum, r) => sum + (r.views_count ?? 0), 0)

  // Build last-6-months bucket list
  const months: { month: string; users: number; listings: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      users: 0,
      listings: 0,
    })
  }

  for (const r of (profileDatesRes.data ?? []) as Array<{ created_at: string }>) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const m = months.find((x) => x.month === key)
    if (m) m.users += 1
  }

  for (const r of (listingDatesRes.data ?? []) as Array<{ created_at: string }>) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const m = months.find((x) => x.month === key)
    if (m) m.listings += 1
  }

  // Top cities by profile count
  const cityCounts = new Map<string, number>()
  for (const r of (cityRes.data ?? []) as Array<{ city: string | null }>) {
    if (!r.city) continue
    cityCounts.set(r.city, (cityCounts.get(r.city) ?? 0) + 1)
  }
  const topCities = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([city, count]) => ({ city, count }))

  // Placement performance
  const placements = (placementRes.data ?? []) as Array<{
    id: string
    name: string
    slug: string
  }>
  const adsByPlacement = new Map<
    string,
    { impressions: number; clicks: number; activeAds: number }
  >()
  for (const a of (adRes.data ?? []) as Array<{
    placement_id: string
    impressions: number
    clicks: number
    is_active: boolean
  }>) {
    const cur = adsByPlacement.get(a.placement_id) ?? {
      impressions: 0,
      clicks: 0,
      activeAds: 0,
    }
    cur.impressions += a.impressions
    cur.clicks += a.clicks
    if (a.is_active) cur.activeAds += 1
    adsByPlacement.set(a.placement_id, cur)
  }

  const placementStats = placements
    .map((p) => {
      const s = adsByPlacement.get(p.id) ?? {
        impressions: 0,
        clicks: 0,
        activeAds: 0,
      }
      return {
        name: p.name,
        slug: p.slug,
        impressions: s.impressions,
        clicks: s.clicks,
        ctr: s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0,
        activeAds: s.activeAds,
      }
    })
    .sort((a, b) => b.impressions - a.impressions)

  return {
    reach: {
      totalUsers: totalUsersRes.count ?? 0,
      newUsersThisMonth: newUsersRes.count ?? 0,
      totalActiveListings: activeListingsRes.count ?? 0,
      totalPageViews,
      newsletterSubscribers: newsletterRes.count ?? 0,
      proUsers: proUsersRes.count ?? 0,
    },
    monthlyGrowth: months,
    topCities,
    placementStats,
  }
}

import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// Merged into the unified settings page (/admin/parametres).
export default async function RedirectLogo({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/admin/parametres`)
}

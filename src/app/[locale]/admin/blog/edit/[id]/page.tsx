import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { BlogPostEditor } from "@/components/admin/blog/posts/BlogPostEditor"
import { getBlogPostAdmin, listBlogCategoriesAdmin } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.blogPostsPage")

  const [post, categories] = await Promise.all([
    getBlogPostAdmin(id),
    listBlogCategoriesAdmin(),
  ])
  if (!post) notFound()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("editTitle")}
        </h1>
      </header>

      <BlogPostEditor mode="edit" categories={categories} initial={post} />
    </div>
  )
}

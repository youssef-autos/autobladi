import { getTranslations, setRequestLocale } from "next-intl/server"

import { BlogPostEditor } from "@/components/admin/blog/posts/BlogPostEditor"
import { listBlogCategoriesAdmin } from "@/lib/queries/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminBlogNewPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("adminPanel.blogPostsPage")
  const categories = await listBlogCategoriesAdmin()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t("newPost")}
        </h1>
      </header>

      <BlogPostEditor mode="create" categories={categories} />
    </div>
  )
}

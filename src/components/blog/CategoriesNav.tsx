import { getLocale, getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import type { BlogCategoryWithCount } from "@/lib/queries/blog"
import { cn } from "@/lib/utils"

type Props = {
  categories: BlogCategoryWithCount[]
  /** Active category slug, or null for "all". */
  activeSlug: string | null
}

export async function CategoriesNav({ categories, activeSlug }: Props) {
  const t = await getTranslations("blog")
  const locale = await getLocale()

  return (
    <nav
      aria-label="Blog categories"
      className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <CategoryPill href="/blog" active={!activeSlug}>
        {t("filters.all")}
      </CategoryPill>
      {categories.map((cat) => (
        <CategoryPill
          key={cat.id}
          href={`/blog/category/${cat.slug}`}
          active={activeSlug === cat.slug}
        >
          {locale === "fr" ? cat.name_fr : cat.name_ar}
          {cat.posts_count > 0 && (
            <span className="ms-1.5 text-[10px] opacity-70">
              ({cat.posts_count})
            </span>
          )}
        </CategoryPill>
      ))}
    </nav>
  )
}

function CategoryPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 inline-flex items-center rounded-full px-4 h-9 text-sm font-medium transition-colors",
        active
          ? "bg-moroccan-red-500 text-white"
          : "bg-card border border-border text-foreground hover:bg-moroccan-sand-50",
      )}
    >
      {children}
    </Link>
  )
}

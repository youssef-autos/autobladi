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
      className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border -mx-4 px-4 md:mx-0 md:px-0"
    >
      <CategoryTab href="/blog" active={!activeSlug}>
        {t("filters.all")}
      </CategoryTab>
      {categories.map((cat) => (
        <CategoryTab
          key={cat.id}
          href={`/blog/category/${cat.slug}`}
          active={activeSlug === cat.slug}
        >
          {locale === "fr" ? cat.name_fr : cat.name_ar}
          {cat.posts_count > 0 && (
            <span className="ms-1 text-[10px] opacity-60">({cat.posts_count})</span>
          )}
        </CategoryTab>
      ))}
    </nav>
  )
}

function CategoryTab({
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
        "shrink-0 inline-flex items-center h-10 px-3 sm:px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        active
          ? "border-moroccan-red-500 text-moroccan-red-500"
          : "border-transparent text-foreground/60 hover:text-foreground hover:border-border",
      )}
    >
      {children}
    </Link>
  )
}

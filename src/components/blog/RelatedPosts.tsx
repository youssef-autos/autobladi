import { getTranslations } from "next-intl/server"

import { BlogCard } from "@/components/blog/BlogCard"
import { GoldAccent } from "@/components/ui/GoldAccent"
import type { BlogPostCard } from "@/lib/queries/blog"

type Props = {
  posts: BlogPostCard[]
}

export async function RelatedPosts({ posts }: Props) {
  const t = await getTranslations("blog.related")
  if (posts.length === 0) return null

  return (
    <section className="py-12 md:py-16 border-t border-border bg-moroccan-sand-50/40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <header className="text-center space-y-2 mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t("title")}
          </h2>
          <GoldAccent className="mx-auto" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}

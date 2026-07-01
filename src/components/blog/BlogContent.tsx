import { Suspense } from "react"
import { marked } from "marked"

import { AdBanner } from "@/components/ads/AdBanner"
import { cn } from "@/lib/utils"

marked.use({ gfm: true, breaks: false })

type Props = {
  content: string | null
  injectAdAfterWords?: number | null
  className?: string
}

export function BlogContent({ content, injectAdAfterWords = 800, className }: Props) {
  if (!content?.trim()) return null

  const wordTarget = injectAdAfterWords ?? 0
  let firstHalf = content
  let secondHalf = ""

  if (wordTarget > 0) {
    const paragraphs = content.split(/\n{2,}/)
    let runningWords = 0
    let cutIndex = -1
    for (let i = 0; i < paragraphs.length; i++) {
      runningWords += (paragraphs[i]?.trim().split(/\s+/).filter(Boolean).length) ?? 0
      if (runningWords >= wordTarget && i < paragraphs.length - 1) {
        cutIndex = i + 1
        break
      }
    }
    if (cutIndex > 0) {
      firstHalf = paragraphs.slice(0, cutIndex).join("\n\n")
      secondHalf = paragraphs.slice(cutIndex).join("\n\n")
    }
  }

  const firstHtml = marked.parse(firstHalf) as string
  const secondHtml = secondHalf ? (marked.parse(secondHalf) as string) : ""

  return (
    <div
      className={cn(
        "max-w-[720px] mx-auto text-foreground/90",
        "[&_h1]:font-display [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-10 [&_h1]:mb-4",
        "[&_h2]:font-display [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4",
        "[&_h3]:font-display [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3",
        "[&_p]:text-base [&_p]:md:text-lg [&_p]:leading-relaxed [&_p]:my-5",
        "[&_a]:text-moroccan-red-500 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-moroccan-red-600",
        "[&_strong]:text-foreground [&_strong]:font-semibold",
        "[&_ul]:my-5 [&_ul]:ps-6 [&_ul]:list-disc [&_ul]:space-y-2",
        "[&_ol]:my-5 [&_ol]:ps-6 [&_ol]:list-decimal [&_ol]:space-y-2",
        "[&_li]:leading-relaxed",
        "[&_blockquote]:my-6 [&_blockquote]:border-s-4 [&_blockquote]:border-moroccan-gold-500 [&_blockquote]:bg-moroccan-gold-50/50 [&_blockquote]:ps-5 [&_blockquote]:py-3 [&_blockquote]:rounded-e-xl [&_blockquote]:italic",
        "[&_code]:bg-moroccan-sand-50 [&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono",
        "[&_pre]:bg-brand-dark [&_pre]:text-white [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:text-white [&_pre_code]:p-0",
        "[&_hr]:my-10 [&_hr]:border-border",
        "[&_table]:w-full [&_table]:my-6 [&_table]:border [&_table]:border-border [&_table]:rounded-xl [&_table]:overflow-hidden",
        "[&_th]:bg-moroccan-sand-50 [&_th]:text-start [&_th]:px-4 [&_th]:py-2 [&_th]:font-semibold",
        "[&_td]:px-4 [&_td]:py-2 [&_td]:border-t [&_td]:border-border",
        "[&_img]:w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-6",
        "[&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-6",
        "[&_table]:max-w-full",
        "overflow-x-hidden",
        className,
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: firstHtml }} />

      {secondHtml && (
        <div className="my-10 not-prose">
          <Suspense fallback={<div className="h-[90px] md:h-[120px] rounded-2xl bg-muted animate-pulse" />}>
            <AdBanner placement="blog_post_inline" heightClass="h-[90px] md:h-[120px]" />
          </Suspense>
        </div>
      )}

      {secondHtml && <div dangerouslySetInnerHTML={{ __html: secondHtml }} />}
    </div>
  )
}

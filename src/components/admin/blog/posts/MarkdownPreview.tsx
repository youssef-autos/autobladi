"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type Props = {
  content: string
  className?: string
}

/**
 * Lightweight client-side markdown preview for the blog editor.
 * Mirrors the public BlogContent prose styling but without next/image,
 * ads, or syntax highlighting (kept small for the editor bundle).
 */
export function MarkdownPreview({ content, className }: Props) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground italic">
        — Aperçu vide —
      </p>
    )
  }

  return (
    <div
      className={cn(
        "max-w-none text-foreground/90",
        "[&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3",
        "[&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3",
        "[&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-2",
        "[&_p]:text-sm [&_p]:leading-relaxed [&_p]:my-3",
        "[&_a]:text-moroccan-red-500 [&_a]:underline [&_a]:underline-offset-2",
        "[&_strong]:text-foreground [&_strong]:font-semibold",
        "[&_ul]:my-3 [&_ul]:ps-6 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:text-sm",
        "[&_ol]:my-3 [&_ol]:ps-6 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:text-sm",
        "[&_blockquote]:my-4 [&_blockquote]:border-s-4 [&_blockquote]:border-moroccan-gold-500 [&_blockquote]:bg-moroccan-gold-50/50 [&_blockquote]:ps-4 [&_blockquote]:py-2 [&_blockquote]:rounded-e-lg [&_blockquote]:italic [&_blockquote]:text-sm",
        "[&_code]:bg-moroccan-sand-50 [&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono",
        "[&_pre]:bg-brand-dark [&_pre]:text-white [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:text-white [&_pre_code]:p-0",
        "[&_img]:rounded-xl [&_img]:my-4 [&_img]:max-w-full [&_img]:h-auto",
        "[&_hr]:my-6 [&_hr]:border-border",
        "[&_table]:w-full [&_table]:my-4 [&_table]:border [&_table]:border-border [&_table]:text-sm",
        "[&_th]:bg-moroccan-sand-50 [&_th]:text-start [&_th]:px-3 [&_th]:py-1.5 [&_th]:font-semibold",
        "[&_td]:px-3 [&_td]:py-1.5 [&_td]:border-t [&_td]:border-border",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

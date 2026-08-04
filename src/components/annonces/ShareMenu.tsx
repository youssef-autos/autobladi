"use client"

import { useEffect, useState } from "react"
import { Link2, Share2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FacebookIcon } from "@/components/layout/SocialIcons"
import { cn } from "@/lib/utils"

type Props = {
  url: string
  title: string
  /** Blurb prepended to the shared text/WhatsApp message, e.g. "Check out this car on autobladi.ma". */
  shareText: string
  className?: string
  /** Icon-only square button, for tight spaces like the mobile contact bar. */
  compact?: boolean
}

export function ShareMenu({ url, title, shareText, className, compact }: Props) {
  const t = useTranslations("annonceDetail.share")
  const tContact = useTranslations("annonceDetail.contact")
  // Defaults to the dropdown (SSR-safe); upgrades to the OS-native share
  // sheet after mount when the browser supports the Web Share API.
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // navigator.share is a browser-only API; canShare defaults to false for
    // SSR, then this corrects it right after mount. No effect-free way to
    // read it safely.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator.share === "function")
  }, [])

  const text = `${shareText} — ${title}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t("linkCopied"))
    } catch {
      toast.error(t("linkCopied"))
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: shareText, url })
    } catch {
      // User dismissed the native share sheet — nothing to do.
    }
  }

  const triggerClassName = cn(
    compact
      ? "inline-flex items-center justify-center size-12 shrink-0 rounded-xl border border-border bg-background text-foreground hover:bg-moroccan-sand-50"
      : "inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl border border-border bg-background font-medium text-sm text-foreground hover:bg-moroccan-sand-50",
    className,
  )

  const label = compact ? (
    <span className="sr-only">{tContact("share")}</span>
  ) : (
    tContact("share")
  )

  if (canShare) {
    return (
      <button type="button" onClick={nativeShare} className={triggerClassName}>
        <Share2 className="size-4" aria-hidden="true" />
        {label}
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClassName}>
        <Share2 className="size-4" aria-hidden="true" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          render={<a href={waUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <svg viewBox="0 0 24 24" className="size-4 me-2 text-moroccan-mint-500" fill="currentColor" aria-hidden="true">
            <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1s-.8.9-1 1.1c-.2.2-.4.2-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5 0 1.5 1.1 2.9 1.2 3.1.1.2 2.2 3.3 5.3 4.6 2.6 1 3 .8 3.6.8.6 0 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.1-.6-.2zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.4 1.2 4.8L2 22l5.3-1.2C8.7 21.6 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
          </svg>
          {t("whatsapp")}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href={fbUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <FacebookIcon className="size-4 me-2 text-blue-600" />
          {t("facebook")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <Link2 className="size-4 me-2" />
          {t("copyLink")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "light"
  /**
   * Optional uploaded logo image (admin-configured, per language). When set,
   * the image replaces the text wordmark. Falls back to the wordmark when empty.
   */
  imageUrl?: string | null
}

const sizes = {
  sm: "text-lg",
  md: "text-xl md:text-2xl",
  lg: "text-3xl md:text-4xl",
}

// Image heights matched to the wordmark sizes above.
const imageHeights = {
  sm: "h-7",
  md: "h-8 md:h-10",
  lg: "h-12 md:h-14",
}

/**
 * Brand logo. Renders the admin-uploaded image when provided, otherwise the
 * brand wordmark. The "i" in "autobladi" has a custom gold dot replacing the
 * natural diacritic mark (hidden by the gold disc).
 */
export function Logo({
  className,
  size = "md",
  variant = "default",
  imageUrl,
}: Props) {
  const baseTextColor = variant === "light" ? "text-white" : "text-foreground"
  const accentColor =
    variant === "light" ? "text-moroccan-gold-500" : "text-moroccan-red-500"

  if (imageUrl) {
    return (
      <Link
        href="/"
        aria-label="autobladi.ma"
        className={cn("inline-flex items-center", className)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="autobladi.ma"
          className={cn("w-auto min-h-[28px] object-contain", imageHeights[size])}
        />
      </Link>
    )
  }

  return (
    <Link
      href="/"
      aria-label="autobladi.ma"
      className={cn(
        "inline-flex items-baseline font-display font-bold tracking-tight",
        sizes[size],
        baseTextColor,
        className,
      )}
    >
      <span>autoblad</span>
      <span className="relative inline-block">
        <span>i</span>
        <span
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -top-[0.05em] size-[0.22em] rounded-full bg-moroccan-gold-500"
        />
      </span>
      <span className={accentColor}>.ma</span>
    </Link>
  )
}

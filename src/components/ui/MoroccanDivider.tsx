import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

/**
 * Subtle gold separator: thin gold gradient lines on either side of a small
 * 8-point star. Use sparingly — once or twice per page at most.
 */
export function MoroccanDivider({ className }: Props) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={cn("flex items-center justify-center gap-4 my-12", className)}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-moroccan-gold-500/40" />
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        className="text-moroccan-gold-500 shrink-0"
        aria-hidden="true"
      >
        <path
          d="M12 2L13.53 8.30L19.07 4.93L15.70 10.47L22 12L15.70 13.53L19.07 19.07L13.53 15.70L12 22L10.47 15.70L4.93 19.07L8.30 13.53L2 12L8.30 10.47L4.93 4.93L10.47 8.30Z"
          fill="currentColor"
        />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-moroccan-gold-500/40" />
    </div>
  )
}

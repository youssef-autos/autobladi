import { cn } from "@/lib/utils"

type Props = {
  className?: string
  width?: "sm" | "md" | "lg"
}

const widths = {
  sm: "w-8",
  md: "w-16",
  lg: "w-24",
}

export function GoldAccent({ className, width = "md" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-1 rounded-full bg-moroccan-gold-500",
        widths[width],
        className,
      )}
    />
  )
}

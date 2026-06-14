import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"

const sizes: Record<Size, string> = {
  sm: "size-5 border-2",
  md: "size-8 border-[3px]",
  lg: "size-12 border-4",
}

type Props = {
  size?: Size
  className?: string
  label?: string
}

export function LoadingSpinner({ size = "md", className, label = "Loading" }: Props) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block rounded-full",
        "border-moroccan-red-500/20 border-t-moroccan-red-500",
        "animate-spin",
        sizes[size],
        className,
      )}
    />
  )
}

import * as React from "react"

import { cn } from "@/lib/utils"

type Props = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
  padded?: boolean
}

export const MoroccanCard = React.forwardRef<HTMLDivElement, Props>(
  ({ className, interactive = false, padded = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-border bg-card shadow-card transition-all duration-200",
          padded && "p-6",
          interactive &&
            "hover:border-moroccan-gold-500 hover:shadow-soft hover:-translate-y-0.5 cursor-pointer",
          className,
        )}
        {...props}
      />
    )
  },
)
MoroccanCard.displayName = "MoroccanCard"

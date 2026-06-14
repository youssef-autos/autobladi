"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type Size = "sm" | "md" | "lg"
type Variant = "primary" | "outline" | "ghost"

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-12 px-8 text-base",
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-moroccan-gradient text-white shadow-moroccan hover:brightness-105 hover:-translate-y-0.5",
  outline:
    "border-2 border-moroccan-red-500 text-moroccan-red-500 bg-transparent hover:bg-moroccan-red-50",
  ghost:
    "bg-transparent text-moroccan-red-500 hover:bg-moroccan-red-50",
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: Size
  variant?: Variant
  loading?: boolean
}

export const MoroccanButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, size = "md", variant = "primary", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-moroccan-red-500/40",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
          sizeStyles[size],
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    )
  },
)
MoroccanButton.displayName = "MoroccanButton"

import * as React from "react"

import { cn } from "@/lib/utils"

type Padding = "none" | "sm" | "md" | "lg" | "xl"
type Shadow = "card" | "soft" | "none"

const paddingStyles: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 md:p-8",
  xl: "p-8 md:p-12",
}

const shadowStyles: Record<Shadow, string> = {
  card: "shadow-card",
  soft: "shadow-soft",
  none: "",
}

type OwnProps<T extends React.ElementType> = {
  /**
   * Underlying element or component — a string tag ("article", "li", ...) or
   * a component like next-intl's `Link` for cards that are themselves the
   * clickable element. Defaults to "div".
   */
  as?: T
  padding?: Padding
  shadow?: Shadow
  /** Clips children to the rounded corners (e.g. for an edge-to-edge image). */
  clip?: boolean
  className?: string
  children?: React.ReactNode
}

type Props<T extends React.ElementType> = OwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof OwnProps<T>>

/**
 * The one card surface for the whole app: `rounded-2xl bg-card border shadow`.
 * Replaces the ~90 hand-copied variants of this exact class string.
 */
export function Card<T extends React.ElementType = "div">({
  as,
  padding = "lg",
  shadow = "card",
  clip = false,
  className,
  ...props
}: Props<T>) {
  const Tag = as || "div"
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-border bg-card",
        shadowStyles[shadow],
        paddingStyles[padding],
        clip && "overflow-hidden",
        className,
      )}
      {...props}
    />
  )
}

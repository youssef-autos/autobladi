import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type Props = {
  label: string
  help?: string
  error?: string
  required?: boolean
  /** Optional control rendered next to the label (e.g. a toggle or link). */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Label + control + help/error text, wrapped in a <label> so the control is
 * associated with it automatically (no id/htmlFor plumbing needed). `error`
 * takes precedence over `help` when both are set.
 */
export function Field({
  label,
  help,
  error,
  required,
  action,
  className,
  children,
}: Props) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-moroccan-red-500"> *</span>}
        </span>
        {action}
      </span>
      {children}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : help ? (
        <span className="block text-xs text-muted-foreground">{help}</span>
      ) : null}
    </label>
  )
}

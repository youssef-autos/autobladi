import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 space-y-4",
        className,
      )}
    >
      {Icon && (
        <div className="rounded-full bg-moroccan-sand-50 p-5">
          <Icon
            className="size-10 text-moroccan-red-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}

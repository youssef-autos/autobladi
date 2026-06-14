import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  href?: string
}

type Props = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-foreground/70",
        className,
      )}
    >
      <Link
        href="/"
        className="inline-flex items-center text-moroccan-red-500 hover:text-moroccan-red-600 transition-colors"
        aria-label="Home"
      >
        <Home className="size-4" aria-hidden="true" />
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <Fragment key={`${item.label}-${i}`}>
            <ChevronRight
              className="size-4 shrink-0 text-foreground/30 rtl:rotate-180"
              aria-hidden="true"
            />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="font-medium hover:text-moroccan-red-500 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(isLast && "text-foreground font-semibold")}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

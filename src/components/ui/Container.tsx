import * as React from "react"

import { cn } from "@/lib/utils"

type ContainerProps = React.HTMLAttributes<HTMLDivElement>

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("max-w-7xl mx-auto px-4 md:px-6 lg:px-8", className)}
      {...props}
    />
  )
}

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  pattern?: boolean
}

export function Section({ className, pattern, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        "py-12 md:py-16 lg:py-20",
        pattern && "bg-subtle-pattern",
        className,
      )}
      {...props}
    />
  )
}

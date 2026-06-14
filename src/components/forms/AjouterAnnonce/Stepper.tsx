import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type Step = {
  id: number
  label: string
}

type Props = {
  steps: Step[]
  current: number
  className?: string
}

export function Stepper({ steps, current, className }: Props) {
  return (
    <ol
      className={cn(
        "flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2",
        className,
      )}
      aria-label="Progress"
    >
      {steps.map((step, idx) => {
        const isCurrent = step.id === current
        const isDone = step.id < current
        return (
          <li
            key={step.id}
            className="flex items-center gap-2 sm:gap-3 min-w-0"
            aria-current={isCurrent ? "step" : undefined}
          >
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                isDone
                  ? "bg-moroccan-mint-500 text-white"
                  : isCurrent
                    ? "bg-moroccan-gradient text-white shadow-moroccan"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {isDone ? <Check className="size-4" aria-hidden="true" /> : step.id}
            </span>
            <span
              className={cn(
                "text-sm font-medium hidden sm:inline truncate",
                isCurrent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden md:block h-px w-8 lg:w-16 shrink-0",
                  step.id < current ? "bg-moroccan-mint-500" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

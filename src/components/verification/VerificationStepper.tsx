import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type Step = "info" | "documents" | "review" | "approved"

type Props = {
  current: Step
  labels: { info: string; documents: string; review: string; approved: string }
  className?: string
}

const ORDER: Step[] = ["info", "documents", "review", "approved"]

export function VerificationStepper({ current, labels, className }: Props) {
  const currentIndex = ORDER.indexOf(current)

  return (
    <ol
      className={cn(
        "flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2",
        className,
      )}
      aria-label="Verification progress"
    >
      {ORDER.map((step, idx) => {
        const isDone = idx < currentIndex
        const isCurrent = idx === currentIndex
        return (
          <li
            key={step}
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
              {isDone ? <Check className="size-4" aria-hidden="true" /> : idx + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium hidden sm:inline truncate",
                isCurrent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {labels[step]}
            </span>
            {idx < ORDER.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden md:block h-px w-8 lg:w-12 shrink-0",
                  idx < currentIndex ? "bg-moroccan-mint-500" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

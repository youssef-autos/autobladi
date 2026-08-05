"use client"

import * as React from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { useTranslations } from "next-intl"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Password input with a leading lock icon and a show/hide toggle. */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const t = useTranslations("auth")
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Lock
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("h-11 rounded-xl border-border bg-background ps-9 pe-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
})
PasswordInput.displayName = "PasswordInput"

import { ArrowLeft } from "lucide-react"

import { Logo } from "@/components/layout/Logo"
import { Link } from "@/i18n/navigation"

type Props = {
  children: React.ReactNode
  logoUrl?: string | null
}

/** Single-column auth shell: a slim top bar with the logo, and a centered card. */
export function AuthShell({ children, logoUrl }: Props) {
  return (
    <div className="min-h-dvh flex flex-col bg-muted/40">
      <div className="flex items-center gap-4 p-6">
        <Link
          href="/"
          aria-label="autobladi.ma"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
        </Link>
        <Logo size="md" imageUrl={logoUrl} />
      </div>
      <div className="flex flex-1 items-center justify-center p-6 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

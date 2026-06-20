import { setRequestLocale } from "next-intl/server"

import { CodePlayground } from "@/components/admin/CodePlayground"

export const dynamic = "force-dynamic"

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="p-4 md:p-6 lg:p-8 h-[calc(100dvh-1rem)] flex flex-col gap-4">
      <header className="shrink-0">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {locale === "ar" ? "محرر الأكواد" : "Éditeur de code"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {locale === "ar"
            ? "اكتب HTML و CSS و JavaScript وشاهد النتيجة مباشرة"
            : "Écrivez du HTML, CSS et JavaScript et voyez le résultat en direct"}
        </p>
      </header>

      <CodePlayground />
    </div>
  )
}

import "./globals.css"

/**
 * Root-level 404 fallback. The middleware redirects normal paths to a locale,
 * and the per-locale catch-all renders the styled localized 404 — so this only
 * catches rare non-locale paths (e.g. with a dot) that bypass the middleware.
 * It's self-contained because the root layout renders just `children`.
 */
export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-screen flex-col items-center justify-center bg-brand-dark px-6 py-16 text-center text-white">
        <p className="font-display text-7xl font-bold text-moroccan-gold-500 tabular-nums">
          404
        </p>
        <h1 className="mt-4 text-xl font-bold">الصفحة غير موجودة · Page introuvable</h1>
        <p className="mt-2 text-white/70">
          الرابط الذي طلبته غير صحيح. · L’adresse demandée est introuvable.
        </p>
        {/* Raw anchor on purpose — this self-contained <html> renders outside
            the app router, so next/link isn't applicable here. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/ar"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-moroccan-gradient px-6 text-sm font-semibold text-white shadow-moroccan hover:brightness-105"
        >
          autobladi.ma
        </a>
      </body>
    </html>
  )
}

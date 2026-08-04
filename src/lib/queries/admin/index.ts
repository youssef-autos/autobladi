// Barrel re-export — the admin query layer is split into one file per
// domain (dashboard, annonces, showrooms, blog, pages, ...). Existing
// `@/lib/queries/admin` imports keep working unchanged.
export * from "./dashboard"
export * from "./annonces"
export * from "./showrooms"
export * from "./blog"
export * from "./pages"
export * from "./contact"
export * from "./newsletter"
export * from "./reports"
export * from "./users"
export * from "./taxonomy"
export * from "./ads"

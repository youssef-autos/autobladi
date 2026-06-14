// Canonical list of toggleable / reorderable home-page sections. The hero,
// ad banners and decorative dividers are fixed and not managed here.
export const HOME_SECTION_KEYS = [
  "featured",
  "brands",
  "latest",
  "why",
  "dealers",
  "estimation",
  "blog",
  "newsletter",
] as const

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number]

export type HomeSectionConfig = {
  key: HomeSectionKey
  visible: boolean
}

const KEY_SET = new Set<string>(HOME_SECTION_KEYS)

export const DEFAULT_HOME_SECTIONS: HomeSectionConfig[] = HOME_SECTION_KEYS.map(
  (key) => ({ key, visible: true }),
)

/**
 * Normalises a stored config (possibly partial, stale, or invalid) into a
 * complete, deduped, ordered list. Unknown keys are dropped; any section that
 * isn't present in the stored config is appended (visible) so new sections
 * surface automatically.
 */
export function mergeHomeSections(stored: unknown): HomeSectionConfig[] {
  const arr = Array.isArray(stored) ? stored : []
  const seen = new Set<string>()
  const result: HomeSectionConfig[] = []

  for (const item of arr) {
    if (item && typeof item === "object" && "key" in item) {
      const key = (item as { key: unknown }).key
      if (typeof key === "string" && KEY_SET.has(key) && !seen.has(key)) {
        seen.add(key)
        result.push({
          key: key as HomeSectionKey,
          visible: (item as { visible?: unknown }).visible !== false,
        })
      }
    }
  }

  for (const key of HOME_SECTION_KEYS) {
    if (!seen.has(key)) result.push({ key, visible: true })
  }

  return result
}

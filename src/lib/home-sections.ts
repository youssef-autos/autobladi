// Fixed order the home page's managed sections render in. The hero, ad
// banners, and decorative dividers are handled separately by the page itself.
export const HOME_SECTION_KEYS = [
  "brands",
  "latest",
  "why",
  "dealers",
  "estimation",
  "blog",
  "newsletter",
] as const

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number]

/**
 * ============================================================================
 * Centralized ad configuration — single source of truth for ad *slots*.
 * ============================================================================
 *
 * This file defines WHERE ads can appear on the site, on which device, at what
 * size, and which network fills them by default. It is intentionally code-level
 * (not a database) because slot *definitions* change rarely and benefit from
 * type-safety + version control.
 *
 * Two ad networks are supported per slot:
 *   - "direct"  → house / contracted-company campaigns, managed in the database
 *                 (`advertisements` table) and the admin panel. These always win
 *                 when an active campaign exists for the slot.
 *   - "adsense" → Google AdSense, shown as a fallback when no direct campaign is
 *                 running. The AdSense *ad-unit id* lives here in `adsenseSlotId`.
 *
 * Adding a 3rd network later (e.g. Ezoic, Media.net) only requires:
 *   1. a new value in `AdProvider`
 *   2. a renderer branch in <AdSlotClient/>
 *   3. (optionally) a per-slot unit id field
 * …without touching any page or the resolution logic.
 *
 * The slot `id` is the bridge to the database: it MUST equal the matching
 * `ad_placements.slug`, so a direct campaign attached to that placement is
 * resolved automatically.
 */

export type AdDevice = "desktop" | "mobile" | "both"
export type AdProvider = "adsense" | "direct"

export interface AdSize {
  width: number
  height: number
}

export interface AdSlotConfig {
  /** Unique id — MUST match `ad_placements.slug` for direct campaigns to bind. */
  id: string
  /** Human label shown in the admin overview. */
  label: string
  /** Master on/off switch. `false` → <AdSlot/> renders nothing, no layout shift. */
  enabled: boolean
  /** Which viewports this slot is shown on. */
  device: AdDevice
  /**
   * Preferred network when NO direct campaign is active:
   *   - "adsense" → fall back to the AdSense unit (`adsenseSlotId`)
   *   - "direct"  → reserved for a contracted company only; stays empty until one
   *                 is booked (no AdSense house ad).
   */
  defaultProvider: AdProvider
  /** Google AdSense ad-unit id (the data-ad-slot value). Required for AdSense. */
  adsenseSlotId?: string
  /** Reserved box size per device — drives the CLS-safe placeholder. */
  sizes: {
    desktop: AdSize
    mobile: AdSize
  }
  /** Lazy-load below the fold via IntersectionObserver. Default true. */
  lazy?: boolean
}

/**
 * Global AdSense account configuration. The publisher id is read from the
 * environment so it never has to be hard-coded, and AdSense is automatically
 * disabled (no script, no <ins>) when the id is absent — handy for local dev.
 *
 *   NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
 */
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? ""

export const ADSENSE = {
  clientId: ADSENSE_CLIENT_ID,
  /** Only treat AdSense as configured when a real publisher id is present. */
  enabled: ADSENSE_CLIENT_ID.startsWith("ca-pub-"),
} as const

/**
 * The slot registry. Keyed by id for O(1) lookup.
 *
 * Sizes use standard IAB units so both AdSense and direct creatives fit:
 *   728×90  Leaderboard        300×250 Medium Rectangle
 *   970×250 Billboard          300×600 Half-page
 *   336×280 Large Rectangle    320×100 Large Mobile Banner
 *   320×50  Mobile Banner
 */
export const AD_SLOTS: Record<string, AdSlotConfig> = {
  // ---- Home -------------------------------------------------------------
  home_top: {
    id: "home_top",
    label: "Accueil — Haut",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 300, height: 250 } },
    lazy: false, // above the fold → load immediately
  },
  home_middle: {
    id: "home_middle",
    label: "Accueil — Milieu",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },
  home_bottom: {
    id: "home_bottom",
    label: "Accueil — Bas",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 970, height: 250 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },

  // ---- Listings (/annonces) ---------------------------------------------
  listings_top: {
    id: "listings_top",
    label: "Annonces — Haut",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 320, height: 100 } },
    lazy: false,
  },
  listings_sidebar: {
    id: "listings_sidebar",
    label: "Annonces — Colonne latérale",
    enabled: true,
    device: "desktop",
    defaultProvider: "direct",
    adsenseSlotId: "",
    sizes: { desktop: { width: 300, height: 600 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },
  listings_inline: {
    id: "listings_inline",
    label: "Annonces — Entre les résultats",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },

  // ---- Annonce detail ----------------------------------------------------
  annonce_top: {
    id: "annonce_top",
    label: "Détail annonce — Haut",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 320, height: 100 } },
    lazy: false,
  },
  annonce_sidebar: {
    id: "annonce_sidebar",
    label: "Détail annonce — Colonne latérale",
    enabled: true,
    device: "desktop",
    defaultProvider: "direct",
    adsenseSlotId: "",
    sizes: { desktop: { width: 300, height: 250 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },
  annonce_bottom: {
    id: "annonce_bottom",
    label: "Détail annonce — Bas",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },

  // ---- Professionnel detail ---------------------------------------------
  professionnel_top: {
    id: "professionnel_top",
    label: "Professionnel — Haut",
    enabled: true,
    device: "both",
    defaultProvider: "direct",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 320, height: 100 } },
    lazy: false,
  },
  professionnel_sidebar: {
    id: "professionnel_sidebar",
    label: "Professionnel — Colonne latérale",
    enabled: true,
    device: "desktop",
    defaultProvider: "direct",
    adsenseSlotId: "",
    sizes: { desktop: { width: 300, height: 600 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },

  // ---- Blog --------------------------------------------------------------
  blog_top: {
    id: "blog_top",
    label: "Blog — Haut",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 300, height: 250 } },
    lazy: false,
  },
  blog_sidebar: {
    id: "blog_sidebar",
    label: "Blog — Colonne latérale",
    enabled: true,
    device: "desktop",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 300, height: 600 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },
  blog_post_inline: {
    id: "blog_post_inline",
    label: "Blog — Dans l'article",
    enabled: true,
    device: "both",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 336, height: 280 }, mobile: { width: 300, height: 250 } },
    lazy: true,
  },

  // ---- Global ------------------------------------------------------------
  footer_banner: {
    id: "footer_banner",
    label: "Pied de page",
    enabled: true,
    device: "both",
    defaultProvider: "direct",
    adsenseSlotId: "",
    sizes: { desktop: { width: 970, height: 90 }, mobile: { width: 320, height: 50 } },
    lazy: true,
  },
  mobile_sticky: {
    id: "mobile_sticky",
    label: "Mobile — Barre fixe en bas",
    enabled: false, // opt-in: enable when you have a mobile anchor unit
    device: "mobile",
    defaultProvider: "adsense",
    adsenseSlotId: "",
    sizes: { desktop: { width: 320, height: 50 }, mobile: { width: 320, height: 50 } },
    lazy: false,
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a slot by id. Returns undefined for unknown ids. */
export function getAdSlot(id: string): AdSlotConfig | undefined {
  return AD_SLOTS[id]
}

/** All slots as an array (admin overview, sitemaps of slots, etc.). */
export function getAllAdSlots(): AdSlotConfig[] {
  return Object.values(AD_SLOTS)
}

/**
 * The fully-resolved settings of a slot — code defaults with any admin-saved
 * database overrides applied. This is what both the public <AdSlot/> and the
 * admin editor consume, so they always agree.
 */
export interface ResolvedAdSlot {
  id: string
  label: string
  enabled: boolean
  device: AdDevice
  defaultProvider: AdProvider
  adsenseSlotId: string
  sizes: { desktop: AdSize; mobile: AdSize }
  lazy: boolean
}

/**
 * Admin-editable overrides, shaped like the `ad_placements` DB row. Every field
 * is optional/nullable: a NULL means "use the code default". `??` is used so a
 * real `false` (e.g. a disabled slot) is never overwritten by the default.
 */
export interface AdSlotOverrides {
  name?: string | null
  is_active?: boolean | null
  device?: AdDevice | null
  width?: number | null
  height?: number | null
  width_mobile?: number | null
  height_mobile?: number | null
  default_provider?: AdProvider | null
  adsense_slot_id?: string | null
  lazy?: boolean | null
}

/**
 * Merge DB overrides over the code defaults for a slot. Returns null only when
 * the id is unknown AND there is no DB row to describe it.
 */
export function resolveAdSlot(
  id: string,
  o?: AdSlotOverrides | null,
): ResolvedAdSlot | null {
  const base = AD_SLOTS[id]
  if (!base && !o) return null

  // Fallback skeleton for a slot that exists only in the DB (no code default).
  const b: AdSlotConfig =
    base ?? {
      id,
      label: id,
      enabled: true,
      device: "both",
      defaultProvider: "adsense",
      adsenseSlotId: "",
      sizes: { desktop: { width: 728, height: 90 }, mobile: { width: 300, height: 250 } },
      lazy: true,
    }

  return {
    id,
    label: o?.name ?? b.label,
    enabled: o?.is_active ?? b.enabled,
    device: (o?.device ?? b.device) as AdDevice,
    defaultProvider: (o?.default_provider ?? b.defaultProvider) as AdProvider,
    adsenseSlotId: (o?.adsense_slot_id ?? b.adsenseSlotId ?? "").trim(),
    sizes: {
      desktop: {
        width: o?.width ?? b.sizes.desktop.width,
        height: o?.height ?? b.sizes.desktop.height,
      },
      mobile: {
        width: o?.width_mobile ?? b.sizes.mobile.width,
        height: o?.height_mobile ?? b.sizes.mobile.height,
      },
    },
    lazy: o?.lazy ?? b.lazy ?? true,
  }
}

/**
 * Whether a slot can render on a given concrete device.
 * `both` matches everything; otherwise an exact match is required.
 */
export function deviceMatches(
  slotDevice: AdDevice,
  current: "desktop" | "mobile",
): boolean {
  return slotDevice === "both" || slotDevice === current
}

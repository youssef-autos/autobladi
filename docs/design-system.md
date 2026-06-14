# autobladi.ma — Design System

Sober, professional Moroccan visual language: red `#c1272d`, gold `#e5c547`, sand `#fdfaf5`, with restrained gold accents — no zellige patterns, no clutter.

> **Tailwind v4 note:** there is **no `tailwind.config.ts`**. All design tokens live in [`src/app/globals.css`](../src/app/globals.css) inside `@theme` blocks. Edit them there.

---

## 1. Tokens

### Colors (use as `bg-*`, `text-*`, `border-*`, `from-*`, etc.)

| Family | Scale | Hex |
|---|---|---|
| `moroccan-red` | `50 / 100 / 500 / 600 / 700 / 900` | `#c1272d` at `500` |
| `moroccan-gold` | `50 / 100 / 500 / 600 / 700` | `#e5c547` at `500` |
| `moroccan-sand` | `50 / 100 / 200 / 500` | `#fdfaf5` at `50` |
| `moroccan-clay` | `500 / 600` | `#b85c38` |
| `moroccan-mint` | `500` | `#0d7a5f` |
| `brand-primary` / `brand-secondary` / `brand-dark` / `brand-muted` | — | aliases of red-500, gold-500, `#1a1a1a`, `#f5f5f4` |

**Usage rule:** red for CTAs only. Gold as accent (borders, underlines, badges) — never as a large background. Body backgrounds are white or `bg-moroccan-sand-50`.

### Typography

| Class | Family | Use |
|---|---|---|
| `font-sans` | Inter | French body (default) |
| `font-arabic` | Cairo → Tajawal fallback | Arabic body |
| `font-display` | Playfair Display | Headings only (H1, H2) |
| `font-mono` | Geist Mono | Code |

Font is auto-switched per locale via `html[lang="ar"]` / `html[lang="fr"]` in `globals.css`.

### Hierarchy

- **H1**: `text-4xl md:text-5xl lg:text-6xl font-display font-bold` (48–60 px)
- **H2**: `text-3xl md:text-4xl font-display font-bold` (32–40 px)
- **Body**: `text-base` (16 px)
- **Small**: `text-sm` (14 px)

### Radii / Shadows / Gradients

| Token | Value |
|---|---|
| `rounded-xl` | `1rem` |
| `rounded-2xl` | `1.5rem` |
| `rounded-3xl` | `2rem` |
| `shadow-soft` | layered subtle |
| `shadow-card` | card lift |
| `shadow-moroccan` | red-tinted glow |
| `bg-moroccan-gradient` | 135° red→red-dark |
| `bg-gold-gradient` | 135° gold→gold-dark |
| `bg-subtle-pattern` | 3% gold star tile (use rarely) |

### Spacing

Use **`<Container>`** and **`<Section>`** components for consistent page layout (`max-w-7xl mx-auto px-4 md:px-6 lg:px-8` / `py-12 md:py-16 lg:py-20`).

---

## 2. Components

All components live in `src/components/ui/`. Import via `@/components/ui/<name>`.

### `<MoroccanButton>`

Primary CTA with red gradient. Supports `loading`.

```tsx
import { MoroccanButton } from "@/components/ui/MoroccanButton"

<MoroccanButton size="lg" loading={pending} onClick={submit}>
  نشر الإعلان
</MoroccanButton>

<MoroccanButton variant="outline">Annuler</MoroccanButton>
<MoroccanButton variant="ghost" size="sm">Voir plus</MoroccanButton>
```

Props: `size: "sm" | "md" | "lg"`, `variant: "primary" | "outline" | "ghost"`, `loading?: boolean` + all native button attrs.

### `<GoldAccent>`

A thin gold horizontal bar. Use as a divider beneath a heading.

```tsx
import { GoldAccent } from "@/components/ui/GoldAccent"

<GoldAccent />                           // 64px centered
<GoldAccent width="sm" className="mx-0"/> // 32px, left-aligned
```

### `<SectionTitle>`

A heading + gold accent + optional subtitle. Auto-uses `font-display`.

```tsx
import { SectionTitle } from "@/components/ui/SectionTitle"

<SectionTitle
  title="السيارات المميزة"
  subtitle="اختيارات منتقاة بعناية من البائعين الموثقين"
/>

<SectionTitle title="Catégories" align="start" as="h3" />
```

### `<MoroccanCard>`

Padded card with soft shadow. `interactive` adds gold border + lift on hover.

```tsx
import { MoroccanCard } from "@/components/ui/MoroccanCard"

<MoroccanCard>{children}</MoroccanCard>

<MoroccanCard interactive padded={false}>
  <img className="rounded-t-2xl ..." />
  <div className="p-4">...</div>
</MoroccanCard>
```

### `<MoroccanDivider>`

Thin gold lines around a small 8-point star. **Use sparingly** — once or twice per page max.

```tsx
import { MoroccanDivider } from "@/components/ui/MoroccanDivider"

<MoroccanDivider />
```

### `<PriceTag>`

Formatted price with currency suffix. Auto-detects locale from `next-intl`.

```tsx
import { PriceTag } from "@/components/ui/PriceTag"

<PriceTag price={145000} />            // "145 000 DH" (fr) / "145 000 درهم" (ar)
<PriceTag price={145000} size="xl" />
<PriceTag price={null} />              // "—"
```

### `<LoadingSpinner>`

Two-tone red spinner.

```tsx
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

<LoadingSpinner />
<LoadingSpinner size="lg" label="جاري التحميل" />
```

### `<EmptyState>`

Centered empty/empty-result placeholder with optional action.

```tsx
import { EmptyState } from "@/components/ui/EmptyState"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import { SearchX } from "lucide-react"

<EmptyState
  icon={SearchX}
  title="لا توجد نتائج"
  description="جرّب تعديل الفلاتر أو وسّع نطاق البحث"
  action={<MoroccanButton variant="outline">إعادة ضبط</MoroccanButton>}
/>
```

### `<Container>` / `<Section>`

Page-level wrappers enforcing the spacing system.

```tsx
import { Container, Section } from "@/components/ui/Container"

<Section pattern>          {/* optional subtle gold pattern */}
  <Container>
    <SectionTitle title="..." />
    <div className="grid md:grid-cols-3 gap-6 mt-12">...</div>
  </Container>
</Section>
```

### `<Badge>` — new variants

The shadcn `Badge` was extended with four domain variants on top of the defaults:

```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="featured">مميّز</Badge>      // gold
<Badge variant="verified">موثّق</Badge>      // mint green
<Badge variant="pro">PRO</Badge>             // red
<Badge variant="new">جديد</Badge>            // blue
```

---

## 3. Formatters — `@/lib/utils/format`

```tsx
import {
  formatPrice,
  formatMileage,
  formatDate,
  formatPhone,
  arabicNumerals,
} from "@/lib/utils/format"

formatPrice(145000)              // "145 000 DH"
formatPrice(145000, "ar")        // "145 000 درهم"

formatMileage(85000)             // "85 000 km"
formatMileage(85000, "ar")       // "85 000 كم"

formatDate("2026-05-20", "ar")   // "20 ماي 2026"
formatDate("2026-05-20", "fr")   // "20 mai 2026"
formatDate(new Date(), "fr", "dd/MM/yyyy") // "20/05/2026"

formatPhone("+212612345678")     // "0612-34-56-78"
formatPhone("0612345678")        // "0612-34-56-78"

arabicNumerals(145000)           // "١٤٥٠٠٠"
arabicNumerals(formatPrice(145000, "ar")) // "١٤٥ ٠٠٠ درهم"
```

---

## 4. Design rules (do / don't)

✅ **Do**

- Lean on whitespace.
- Reserve red for the primary CTA on a screen — one per view ideally.
- Use gold as a thin accent: borders, small badges, the `GoldAccent` line.
- Use `font-display` (Playfair) for **H1 / H2 only**, never for body.
- Soft shadows (`shadow-soft`, `shadow-card`) — avoid heavy drop shadows.
- 200–300 ms transitions on hover/focus.

❌ **Don't**

- No zellige tiles, mosque silhouettes, henna borders, or other heavy "Morocco" clichés.
- No large gold backgrounds — gold is a highlight, not a hero color.
- Don't use `font-display` on paragraphs.
- Don't sprinkle `<MoroccanDivider>` everywhere — at most twice per page.
- Don't mix red CTAs with red destructive — use shadcn's `destructive` variant for delete/danger.

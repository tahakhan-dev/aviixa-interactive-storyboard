/**
 * The typed names over the product-shell token layer defined in
 * `app/globals.css` (the block headed "PRODUCT SHELL TOKENS (Task 9)").
 *
 * WHY THIS FILE EXISTS. A CSS custom property is just a string to
 * TypeScript — `var(--suface)` (typo'd) and `var(--surface)` are equally
 * valid template-literal content, and the first one silently renders
 * nothing. Every accessor below is typed over a closed union read from the
 * const arrays, so a component can only ask for a token this file — and
 * therefore the CSS — actually defines; a typo is a compile error instead
 * of an invisible one.
 *
 * NOT `StatusTone`. `src/ui/primitives/StatusPill.tsx` already exports a
 * `StatusTone` union (six members: ok/info/attention/blocked/stale/
 * neutral) for the existing pill component. The CSS status family this file
 * types is a different, ten-member vocabulary (adds warn/danger/offline/
 * queued/pending/conflict, splits attention into warn+danger, blocked
 * stays). Naming both `StatusTone` would make one shadow the other on any
 * import that needs both; this file's is `StatusToken`.
 */

export const COLOR_TOKENS = [
  'surface',
  'raised',
  'sunken',
  'ink',
  'ink-muted',
  'ink-subtle',
  'border',
  'border-strong',
  'accent',
  'accent-ink',
] as const
export type ColorToken = (typeof COLOR_TOKENS)[number]

export const STATUS_TOKENS = [
  'ok',
  'info',
  'warn',
  'danger',
  'stale',
  'offline',
  'queued',
  'pending',
  'conflict',
  'blocked',
] as const
export type StatusToken = (typeof STATUS_TOKENS)[number]

export const SPACE_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const
export type SpaceStep = (typeof SPACE_STEPS)[number]

export const RADIUS_TOKENS = ['sm', 'md', 'lg', 'pill'] as const
export type RadiusToken = (typeof RADIUS_TOKENS)[number]

export const ELEVATION_STEPS = [0, 1, 2, 3] as const
export type ElevationStep = (typeof ELEVATION_STEPS)[number]

/** Paired with a minimum interactive-target size — see `densityControlMinVar`. */
export const DENSITY_TOKENS = ['compact', 'comfortable', 'spacious'] as const
export type DensityToken = (typeof DENSITY_TOKENS)[number]

export const Z_TOKENS = ['nav', 'header', 'dropdown', 'drawer', 'modal', 'toast'] as const
export type ZToken = (typeof Z_TOKENS)[number]

/* ── Raw `var(--x)` accessors, for inline styles and for building the
 * Tailwind arbitrary-value fragments below. ─────────────────────────────── */

const cssVar = (name: string): string => `var(--${name})`

export const colorVar = (token: ColorToken): string => cssVar(token)
export const statusVar = (token: StatusToken): string => cssVar(`status-${token}`)
export const statusBgVar = (token: StatusToken): string => cssVar(`status-${token}-bg`)
export const spaceVar = (step: SpaceStep): string => cssVar(`space-${step}`)
export const radiusVar = (token: RadiusToken): string => cssVar(`radius-${token}`)
export const elevationVar = (step: ElevationStep): string => cssVar(`elevation-${step}`)
export const densityGapVar = (token: DensityToken): string => cssVar(`density-${token}-gap`)
export const densityControlMinVar = (token: DensityToken): string =>
  cssVar(`density-${token}-control-min`)
export const zVar = (token: ZToken): string => cssVar(`z-${token}`)

/* ── Tailwind arbitrary-value classes, matching the `bg-[var(--x)]`
 * convention already used across `src/ui/primitives` (see e.g. Button.tsx's
 * `VARIANT_CLASS`, StatusPill.tsx's `TONE_CLASS`). Every accessor below is a
 * closed-Record LOOKUP over a literal string written directly in this file,
 * never a template literal built from the token at call time.
 *
 * THAT DISTINCTION IS LOAD-BEARING, NOT STYLE. Tailwind's build does not
 * execute this code — it scans source files as plain text for complete
 * utility-class substrings. `` `bg-[${colorVar(token)}]` `` never places the
 * literal text "bg-[var(--surface)]" anywhere a scanner can read it (the
 * class is assembled from two nested interpolations at runtime), so the
 * utility is silently never generated — this shipped once, was caught before
 * verification, and is exactly why every table below spells its class names
 * out by hand instead of composing them from the `*Var` accessors above. A
 * Record lookup keeps the literal text present in this file regardless of
 * which key a caller passes; a template literal does not. */

const BG_CLASS: Readonly<Record<ColorToken, string>> = {
  surface: 'bg-[var(--surface)]',
  raised: 'bg-[var(--raised)]',
  sunken: 'bg-[var(--sunken)]',
  ink: 'bg-[var(--ink)]',
  'ink-muted': 'bg-[var(--ink-muted)]',
  'ink-subtle': 'bg-[var(--ink-subtle)]',
  border: 'bg-[var(--border)]',
  'border-strong': 'bg-[var(--border-strong)]',
  accent: 'bg-[var(--accent)]',
  'accent-ink': 'bg-[var(--accent-ink)]',
}
export const bg = (token: ColorToken): string => BG_CLASS[token]

const TEXT_CLASS: Readonly<Record<ColorToken, string>> = {
  surface: 'text-[var(--surface)]',
  raised: 'text-[var(--raised)]',
  sunken: 'text-[var(--sunken)]',
  ink: 'text-[var(--ink)]',
  'ink-muted': 'text-[var(--ink-muted)]',
  'ink-subtle': 'text-[var(--ink-subtle)]',
  border: 'text-[var(--border)]',
  'border-strong': 'text-[var(--border-strong)]',
  accent: 'text-[var(--accent)]',
  'accent-ink': 'text-[var(--accent-ink)]',
}
export const textColor = (token: ColorToken): string => TEXT_CLASS[token]

const BORDER_CLASS: Readonly<Record<ColorToken, string>> = {
  surface: 'border-[var(--surface)]',
  raised: 'border-[var(--raised)]',
  sunken: 'border-[var(--sunken)]',
  ink: 'border-[var(--ink)]',
  'ink-muted': 'border-[var(--ink-muted)]',
  'ink-subtle': 'border-[var(--ink-subtle)]',
  border: 'border-[var(--border)]',
  'border-strong': 'border-[var(--border-strong)]',
  accent: 'border-[var(--accent)]',
  'accent-ink': 'border-[var(--accent-ink)]',
}
export const borderColor = (token: ColorToken): string => BORDER_CLASS[token]

const STATUS_BG_CLASS: Readonly<Record<StatusToken, string>> = {
  ok: 'bg-[var(--status-ok-bg)]',
  info: 'bg-[var(--status-info-bg)]',
  warn: 'bg-[var(--status-warn-bg)]',
  danger: 'bg-[var(--status-danger-bg)]',
  stale: 'bg-[var(--status-stale-bg)]',
  offline: 'bg-[var(--status-offline-bg)]',
  queued: 'bg-[var(--status-queued-bg)]',
  pending: 'bg-[var(--status-pending-bg)]',
  conflict: 'bg-[var(--status-conflict-bg)]',
  blocked: 'bg-[var(--status-blocked-bg)]',
}
export const statusBg = (token: StatusToken): string => STATUS_BG_CLASS[token]

const STATUS_TEXT_CLASS: Readonly<Record<StatusToken, string>> = {
  ok: 'text-[var(--status-ok)]',
  info: 'text-[var(--status-info)]',
  warn: 'text-[var(--status-warn)]',
  danger: 'text-[var(--status-danger)]',
  stale: 'text-[var(--status-stale)]',
  offline: 'text-[var(--status-offline)]',
  queued: 'text-[var(--status-queued)]',
  pending: 'text-[var(--status-pending)]',
  conflict: 'text-[var(--status-conflict)]',
  blocked: 'text-[var(--status-blocked)]',
}
export const statusText = (token: StatusToken): string => STATUS_TEXT_CLASS[token]

const RADIUS_CLASS: Readonly<Record<RadiusToken, string>> = {
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  pill: 'rounded-[var(--radius-pill)]',
}
export const radiusClass = (token: RadiusToken): string => RADIUS_CLASS[token]

const SHADOW_CLASS: Readonly<Record<ElevationStep, string>> = {
  0: 'shadow-[var(--elevation-0)]',
  1: 'shadow-[var(--elevation-1)]',
  2: 'shadow-[var(--elevation-2)]',
  3: 'shadow-[var(--elevation-3)]',
}
export const shadowClass = (step: ElevationStep): string => SHADOW_CLASS[step]

const Z_CLASS: Readonly<Record<ZToken, string>> = {
  nav: 'z-[var(--z-nav)]',
  header: 'z-[var(--z-header)]',
  dropdown: 'z-[var(--z-dropdown)]',
  drawer: 'z-[var(--z-drawer)]',
  modal: 'z-[var(--z-modal)]',
  toast: 'z-[var(--z-toast)]',
}
export const zIndexClass = (token: ZToken): string => Z_CLASS[token]

const GAP_CLASS: Readonly<Record<DensityToken, string>> = {
  compact: 'gap-[var(--density-compact-gap)]',
  comfortable: 'gap-[var(--density-comfortable-gap)]',
  spacious: 'gap-[var(--density-spacious-gap)]',
}
export const gapClass = (token: DensityToken): string => GAP_CLASS[token]

/** Applies the density's minimum interactive-target size to both axes. */
const CONTROL_MIN_CLASS: Readonly<Record<DensityToken, string>> = {
  compact: 'min-h-[var(--density-compact-control-min)] min-w-[var(--density-compact-control-min)]',
  comfortable:
    'min-h-[var(--density-comfortable-control-min)] min-w-[var(--density-comfortable-control-min)]',
  spacious: 'min-h-[var(--density-spacious-control-min)] min-w-[var(--density-spacious-control-min)]',
}
export const controlMinClass = (token: DensityToken): string => CONTROL_MIN_CLASS[token]

/** The hover-state counterpart of `bg('sunken')` — recorded here, spelled
 *  out in full, for the same reason every table above is: `hover:${bg(...)}`
 *  builds a variant-prefixed candidate no scanner can find as literal text. */
export const hoverBgSunken = 'hover:bg-[var(--sunken)]'

/**
 * Pins every product-shell colour token to its LIGHT value, as a React
 * inline-style object of CSS custom-property overrides.
 *
 * FIX ROUND 2: no longer used by `Nav.tsx`. It was the fix round 1 patch
 * for `Drawer`'s content — `Drawer.tsx` itself has since been migrated onto
 * this token layer (fix round 2) and now sets its own dark-mode-aware
 * default, so its content adapts on its own instead of needing to be pinned.
 * KEPT, NOT DELETED: fix round 2's own primitive inventory (Task 9 report)
 * found the identical shape — an explicit legacy-fixed text colour with no
 * matching background of its own — in `Breadcrumbs.tsx`, `Checkbox.tsx`,
 * `Field.tsx`, `Table.tsx`, `Tabs.tsx` and more, none of which this task
 * migrates. Any of them, mounted directly under the new shell before its own
 * migration lands, is this exact bug waiting to happen again; this is the
 * documented escape hatch for whichever task hits one next, applied via
 * `style` (an inline declaration always wins the cascade over the
 * `:root`-level rules in `app/globals.css`, regardless of which theme is
 * active) rather than a className, since no Tailwind utility sets a custom
 * property.
 *
 * Values are the same literals as the bare `:root` block in
 * `app/globals.css` — this is the one place outside that file duplicating
 * them, and only because "the light value of --ink" has no other token name
 * to ask for; see that file's own comment on the block this mirrors before
 * changing either one without the other.
 */
export const LIGHT_TOKEN_STYLE: Readonly<Record<string, string>> = {
  '--surface': '#ffffff',
  '--raised': '#ffffff',
  '--sunken': '#f1f5f9',
  '--ink': '#0f172a',
  '--ink-muted': '#475569',
  '--ink-subtle': '#54637a',
  '--border': '#7c8ba1',
  '--border-strong': '#64748b',
  '--accent': '#1d4ed8',
  '--accent-ink': '#ffffff',
}

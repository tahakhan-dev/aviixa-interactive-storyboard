/**
 * OPERATIONAL SEVERITY — AND THE VOCABULARY IT MUST NEVER TOUCH.
 *
 * `AC-43-103` (L89975): "Operational severity and manufacturing severity are
 * separate fields with separate vocabularies and never share a rendering
 * component." `TEST-43-103` (L89981) asserts that no code path maps one onto
 * the other.
 *
 * Operational severity is platform-side. It says how badly the PLATFORM is
 * hurt by an artificial-intelligence failure. Manufacturing severity is
 * tenant-facing and says how badly a PART is out of specification; it arms lot
 * holds and drives the quality record. Slices 6 and 9 shipped the
 * manufacturing vocabulary and its screens. Nothing here reaches them, nothing
 * here converts between them, and the two overlap on the literal `Critical` —
 * which is precisely why a shared component would be undetectable by eye.
 *
 * ── THE OVERLAP IS REAL AND THE GATE IS NOT A STRING SCAN ──────────────────
 * `Critical` is a band in BOTH vocabularies, and the source's own operational
 * catalogue quotes manufacturing severity inside two of its cells. So the
 * separation cannot be enforced by forbidding a word. It is enforced by
 * `tests/unit/ai-failures.test.ts` in two halves that fail independently: an
 * import allowlist over this whole directory, and a scan for the manufacturing
 * SYMBOL names listed below.
 *
 * This module is a vocabulary and one parser. It renders nothing, and there is
 * no severity component in this directory for a manufacturing band to be
 * passed to.
 */

/**
 * The bands, from the spine's own item-2 line. Declared in the source's order,
 * which is its order of decreasing harm.
 */
export type OperationalSeverityBand = 'Critical' | 'Major' | 'Minor' | 'Informational'

export const OPERATIONAL_SEVERITY_BANDS = [
  'Critical',
  'Major',
  'Minor',
  'Informational',
] as const satisfies readonly OperationalSeverityBand[]

export interface OperationalSeverityBandRecord {
  readonly band: OperationalSeverityBand
  /** The parenthesised gloss the source gives the band, verbatim. */
  readonly meaning: string
  readonly locator: string
}

/**
 * `Informational` is declared here and — measured across the whole catalogue —
 * selected by no catalogued row. It is kept because the spine declares it: a
 * vocabulary trimmed to what today's rows happen to use stops being the
 * source's vocabulary. The absence is asserted rather than left implicit.
 */
export const OPERATIONAL_SEVERITY = [
  {
    band: 'Critical',
    meaning: 'tenant-visible loss of an artificial-intelligence capability across a surface',
    locator: 'L89927',
  },
  { band: 'Major', meaning: 'degradation with a working fallback', locator: 'L89927' },
  { band: 'Minor', meaning: 'self-healing within the retry budget', locator: 'L89927' },
  { band: 'Informational', meaning: 'recorded, no user-visible effect', locator: 'L89927' },
] as const satisfies readonly OperationalSeverityBandRecord[]

/**
 * What a catalogued row's severity cell resolves to. Two shapes, because the
 * source writes two: a band, and — on one measured row — a condition naming
 * two bands and the circumstance that separates them.
 */
export type SeverityAssignment =
  | { readonly kind: 'band'; readonly band: OperationalSeverityBand; readonly cell: string }
  | {
      readonly kind: 'conditional'
      readonly bands: readonly OperationalSeverityBand[]
      readonly cell: string
    }

/**
 * Parses a severity cell. Returns `null` where the cell resolves to no band at
 * all — that is `AC-43-101`'s unmodelled case, and returning null is how it
 * stays unmodelled instead of being defaulted to a band nobody chose.
 *
 * A single band is a `band`; a cell naming more than one is a `conditional`
 * that keeps every band it names. It never picks one.
 */
export function severityAssignment(cell: string): SeverityAssignment | null {
  const named = OPERATIONAL_SEVERITY_BANDS.filter((band) =>
    new RegExp(`\\b${band}\\b`).test(cell),
  )
  if (named.length === 0) return null
  if (named.length === 1 && cell === named[0]) return { kind: 'band', band: named[0]!, cell }
  if (named.length === 1) return null
  return { kind: 'conditional', bands: named, cell }
}

/**
 * WHERE THE FORBIDDEN-SYMBOL LIST LIVES, AND WHY NOT HERE. The manufacturing
 * severity symbol names are declared in `tests/unit/ai-failures.test.ts`, not
 * in this module. Declaring them here put the names inside the directory the
 * scan reads, so the gate reddened on its own expectation — measured, on the
 * first run. A gate's expectation belongs to the gate.
 */

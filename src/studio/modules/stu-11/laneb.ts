import { CONFIGURATION_SECTIONS, type ConfigurationSection } from '@/studio/vocab'

/**
 * `DEC-LANEB-001` (L33253) — the value classifier, and **only** the
 * classifier. Nothing here asserts which reading the source meant.
 *
 * The disclosure is `DecisionDisclosure id="D14"` and it renders both
 * readings with both locator sets. `AC-STU-097` (L33397) and `AC-STU-138`
 * (L34332) **cannot both hold for one package-borne Lane-B value**, and the
 * only instruction binding both sides is `AC-STU-104` (L33404) /
 * `AC-STU-143` (L34337): surface it, never implement it silently.
 *
 * What this file implements is the source's own recommended hybrid, adopted
 * as this build's working position under APP-012 and labelled as such
 * wherever it renders: reading (b) restricted to values that cannot alter *a
 * specification limit, a severity mapping, or a gate rule*, with anything
 * touching those three routed through the full chain.
 *
 * ### Why it is an interface over a SEEDED map
 *
 * `DEC-PKGFIELD-001` (L33807) is open: "the authoritative field-by-field
 * assignment is carried in the package contract of Part VII; Part VII does
 * not enumerate it", and without it "an approved Lane-B value cannot be
 * routed deterministically". So the classifier is a named interface, the map
 * behind it is seeded, and the seed's provenance renders on screen beside
 * every answer it gives.
 *
 * The seed is not invented. It is the **nine configuration sections**
 * (L32216-L32226) — the source's own division of what a screen holds — read
 * against the three value classes `DEC-LANEB-001`'s recommendation names.
 * Three sections map onto the three protected classes exactly; the other six
 * do not touch them.
 *
 * ### The unclassified default fails CLOSED
 *
 * A field the seed does not carry is `unclassified`, and an unclassified
 * value routes through the **full chain**. Asserting that a value "cannot
 * alter a specification limit" requires knowing what the value is; not
 * knowing is not the same as knowing it is safe. A gate that waves through
 * what it cannot classify is not a gate.
 */

export type LaneBValueClass =
  | 'specification-limit'
  | 'severity-mapping'
  | 'gate-rule'
  | 'outside-the-three-protected-classes'
  | 'unclassified'

export const LANE_B_VALUE_CLASSES = [
  'specification-limit',
  'severity-mapping',
  'gate-rule',
  'outside-the-three-protected-classes',
  'unclassified',
] as const satisfies readonly LaneBValueClass[]

type MissingFromValueClasses = Exclude<LaneBValueClass, (typeof LANE_B_VALUE_CLASSES)[number]>
const _valueClassesExhaustive: MissingFromValueClasses extends never ? true : never = true
void _valueClassesExhaustive

/** The three `DEC-LANEB-001`'s recommendation names, in its own order. */
export const LANE_B_PROTECTED_CLASSES = [
  'specification-limit',
  'severity-mapping',
  'gate-rule',
] as const satisfies readonly LaneBValueClass[]

/**
 * The seed: the nine configuration sections against the three protected
 * classes. Total over `ConfigurationSection`, so a tenth section fails to
 * compile here rather than resolving to `undefined` and taking the
 * single-approver path by accident.
 */
export const SEEDED_LANE_B_FIELD_MAP = {
  'Screen content': 'outside-the-three-protected-classes',
  'Input type': 'outside-the-three-protected-classes',
  Timing: 'outside-the-three-protected-classes',
  'Gate and proof': 'gate-rule',
  'Specification limits': 'specification-limit',
  'Coaching content': 'outside-the-three-protected-classes',
  'Deviation rules and severity mapping': 'severity-mapping',
  'Tool and equipment': 'outside-the-three-protected-classes',
  'Qualification override': 'outside-the-three-protected-classes',
} as const satisfies Readonly<Record<ConfigurationSection, LaneBValueClass>>

export interface LaneBValueClassifier {
  /** Renders beside every answer. Never a bare "classified as X". */
  readonly provenance: string
  /** The open decision that would replace the seed with an authority. */
  readonly openDecision: 'DEC-PKGFIELD-001'
  readonly classify: (field: string) => LaneBValueClass
}

function isSection(field: string): field is ConfigurationSection {
  return (CONFIGURATION_SECTIONS as readonly string[]).includes(field)
}

export const seededLaneBClassifier: LaneBValueClassifier = {
  provenance:
    'Seeded from the nine configuration sections the source enumerates at L32216-L32226, read against the three value classes DEC-LANEB-001’s own recommendation names (L33253). It is a seed, not an authority: DEC-PKGFIELD-001 (L33807) leaves the field-by-field package-borne assignment unstated, and a field this seed does not carry is treated as unclassified and routed through the full chain.',
  openDecision: 'DEC-PKGFIELD-001',
  classify: (field) => (isSection(field) ? SEEDED_LANE_B_FIELD_MAP[field] : 'unclassified'),
}

export interface LaneBRouting {
  readonly valueClass: LaneBValueClass
  readonly routesThroughChain: boolean
  readonly reason: string
  readonly sourceRefs: readonly string[]
}

const PROTECTED = new Set<LaneBValueClass>(LANE_B_PROTECTED_CLASSES)

/**
 * Whether a Lane-B-approved value of this class still passes Author, Reviewer
 * and Release Authority. One implementation; the screen renders what it says
 * and decides nothing itself.
 */
export function laneBEntersTheChain(valueClass: LaneBValueClass): LaneBRouting {
  const refs = ['DEC-LANEB-001 L33253', 'AC-STU-097 L33397', 'AC-STU-138 L34332', 'AC-STU-104 L33404']
  if (PROTECTED.has(valueClass)) {
    return {
      valueClass,
      routesThroughChain: true,
      reason:
        'This value can alter a specification limit, a severity mapping or a gate rule, so it routes through the full three-stage chain. Reading (a) governs it: the separation-of-duties floor is the same for every value that can change what a worker is told to do.',
      sourceRefs: refs,
    }
  }
  if (valueClass === 'unclassified') {
    return {
      valueClass,
      routesThroughChain: true,
      reason:
        'Nothing here can say what this value touches, because DEC-PKGFIELD-001 leaves the field-by-field assignment unstated. Not knowing is not the same as knowing it is safe, so it routes through the full chain.',
      sourceRefs: [...refs, 'DEC-PKGFIELD-001 L33807'],
    }
  }
  return {
    valueClass,
    routesThroughChain: false,
    reason:
      'This value cannot alter a specification limit, a severity mapping or a gate rule, so the working position lets reading (b) stand: the Lane-B decision by a Quality Manager in the Client Command Center is the human sign-off. It is a client-delegated choice under APP-012, not a position the source settled — under reading (a) this value would wait for two more people.',
    sourceRefs: refs,
  }
}

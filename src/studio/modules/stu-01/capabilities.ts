import { scenarioRunId, tenantId, type TenantId } from '@/domain/ids'
import { emptyDomainState, withTenant, type ScenarioDomainState } from '@/domain/state'
import { CONFIGURATION_SECTIONS, type ConfigurationSection } from '@/studio/vocab'
import { JOURNEY_AS_OF, WHEEL_BOLT_DRAFT_CONTENT } from '@/studio/journey/fixture'
import type { PublishCheckImplementation, PublishCheckVerdict } from '@/studio/publish/register'

/**
 * The Atomic Capability area's data, and the two rules S8 turns on it:
 * configuration follows capability, and an unresolvable capability state
 * FREEZES a section rather than deleting it.
 *
 * WHERE THE SIX ROWS COME FROM. The frozen source states the mapping itself,
 * as a table of six rows at L33975-L33982: "If a tenant enables this
 * capability | This configuration surface appears on the relevant screens".
 * Those six rows are transcribed here, left column and right column both.
 * They are NOT the atom registry: L43112 says "there is no fixed atom count"
 * and L43116's fourteen atoms are "illustrative, not a committed set". This
 * register is the source's own six illustrative rows, and the screen says so.
 *
 * WHY EVERY ENTITLED CAPABILITY IS SEEDED ENABLED. L33984: "At launch the
 * three standard agents and their capabilities are present by default, which
 * is why the nine sections appear as described in MOD-STU-05." D12 turns that
 * into this build's seed, so all nine configuration sections exist and the
 * mechanism `AC-STU-006` and `AC-STU-008` require to be visible is visible.
 *
 * DETERMINISM. No clock is read anywhere in this file. The retrieval stamp is
 * the journey fixture's fixed as-of date, so two renders are byte-identical.
 */

/* ==================================================================== *
 * THE VOCABULARY.
 * ==================================================================== */

export type AtomicCapabilityId =
  | 'CAP-COACHING'
  | 'CAP-TOLERANCE'
  | 'CAP-CONTAINMENT'
  | 'CAP-QUALIFICATION'
  | 'CAP-TOOLING'
  | 'CAP-EQUIPMENT-SIGNAL'

export const ATOMIC_CAPABILITY_IDS = [
  'CAP-COACHING',
  'CAP-TOLERANCE',
  'CAP-CONTAINMENT',
  'CAP-QUALIFICATION',
  'CAP-TOOLING',
  'CAP-EQUIPMENT-SIGNAL',
] as const satisfies readonly AtomicCapabilityId[]

type MissingFromCapabilityIds = Exclude<AtomicCapabilityId, (typeof ATOMIC_CAPABILITY_IDS)[number]>
const _capabilityIdsExhaustive: MissingFromCapabilityIds extends never ? true : never = true
void _capabilityIdsExhaustive

/** Whether the tenant's entitlement set carries the capability at all. */
export type EntitlementState = 'included' | 'not-included'

/**
 * Three, not two. `unresolvable` is the FB-STU-07 state — the registry or the
 * entitlement service could not be read — and it renders OPPOSITELY to
 * `disabled`: a disabled section disappears, an unresolvable one freezes
 * read-only with its value intact. Collapsing the two is how a section that
 * was removed on purpose comes back frozen, and how a value an author typed
 * is silently discarded.
 */
export type EnablementState = 'enabled' | 'disabled' | 'unresolvable'

export const ENABLEMENT_STATES = [
  'enabled',
  'disabled',
  'unresolvable',
] as const satisfies readonly EnablementState[]

type MissingFromEnablementStates = Exclude<EnablementState, (typeof ENABLEMENT_STATES)[number]>
const _enablementStatesExhaustive: MissingFromEnablementStates extends never ? true : never = true
void _enablementStatesExhaustive

/** AC-STU-008 (L30783) and SB-STU-02 (L30751), word for word. */
export const NOT_ENTITLED_REASON = 'Not included in this tenant’s entitlement'

/* ==================================================================== *
 * THE ROW.
 * ==================================================================== */

export interface AtomicCapabilityRow {
  readonly id: AtomicCapabilityId
  /** SB-STU-02's first column: "capability name in full words". */
  readonly name: string
  /** The source table's left cell, verbatim (L33977-L33982). */
  readonly sourceWording: string
  /** The source table's right cell, verbatim. */
  readonly surfaceWording: string
  /**
   * Which of the nine configuration sections this capability switches on.
   *
   * DERIVED, AND CORROBORATED. The source's own table names surfaces in prose
   * ("Timing thresholds and the coaching-content section"), not by section
   * number; the nine-section table's fourth column ("Which capability it
   * serves", L32218-L32226) names the capability each section serves, and the
   * two agree row for row. `sectionMappingNote` carries both locators.
   */
  readonly sections: readonly ConfigurationSection[]
  readonly sectionMappingNote: string
  readonly entitlement: EntitlementState
  /** Non-null exactly where `entitlement` is `not-included`. */
  readonly notIncludedReason: string | null
  readonly enablement: EnablementState
  /** SB-STU-02's fourth column: "the Workflows currently relying on it". */
  readonly reliedOnBy: readonly string[]
  /** The surfaces named as a consequence line would name them. */
  readonly consequenceWording: string
  /** Where those surfaces sit, in the consequence line's own words. */
  readonly consequenceScope: string
  readonly sourceRef: string
}

export interface CapabilityRegister {
  readonly tenant: TenantId
  /**
   * FB-STU-07's first fallback shows the last-retrieved state "labelled with
   * its retrieval timestamp and marked 'last retrieved' rather than 'current'"
   * (L30772). The stamp is data, never a clock read.
   */
  readonly retrievedAt: string
  readonly rows: readonly AtomicCapabilityRow[]
}

/* ==================================================================== *
 * THE SEED.
 * ==================================================================== */

export const STU01_TENANT: TenantId = tenantId('TEN-BRIGHT-BIKES')

export const STU01_SEED_STATE: ScenarioDomainState = withTenant(
  emptyDomainState(scenarioRunId('RUN-STU-CHARTER')),
  STU01_TENANT,
  (p) => ({ ...p, displayName: 'Bright Bikes', lifecycleState: 'ACTIVE', tier: 'Enterprise' }),
)

const WHEEL_BOLT = WHEEL_BOLT_DRAFT_CONTENT.workflowName

const MAPPING_NOTE =
  'The source names the surface in prose (L33977-L33982); the section names are the nine-section table’s own ' +
  '(L32216-L32226), whose “Which capability it serves” column names the same capability. Derived Clarification.'

export const CAPABILITY_REGISTER: CapabilityRegister = {
  tenant: STU01_TENANT,
  retrievedAt: JOURNEY_AS_OF,
  rows: [
    {
      id: 'CAP-COACHING',
      name: 'Real-time coaching',
      sourceWording: 'Real-time coaching, the Prevention Agent',
      surfaceWording: 'Timing thresholds and the coaching-content section',
      sections: ['Timing', 'Coaching content'],
      sectionMappingNote: MAPPING_NOTE,
      entitlement: 'included',
      notIncludedReason: null,
      enablement: 'enabled',
      reliedOnBy: [WHEEL_BOLT],
      consequenceWording: 'Timing and Coaching Content',
      consequenceScope: 'every screen carrying a coaching trigger',
      sourceRef: 'L33977',
    },
    {
      id: 'CAP-TOLERANCE',
      name: 'Tolerance validation',
      sourceWording: 'Tolerance validation, part of deviation handling',
      surfaceWording: 'Specification Limits: lower limit, upper limit, unit, drawing reference',
      sections: ['Specification limits'],
      sectionMappingNote: MAPPING_NOTE,
      entitlement: 'included',
      notIncludedReason: null,
      enablement: 'enabled',
      reliedOnBy: [WHEEL_BOLT],
      consequenceWording: 'Specification Limits',
      consequenceScope: 'all measurement screens',
      sourceRef: 'L33978',
    },
    {
      id: 'CAP-CONTAINMENT',
      name: 'Containment response',
      sourceWording: 'Containment response, Deviation and Containment',
      surfaceWording: 'Severity mapping, containment-checklist picker, escalation routing',
      sections: ['Deviation rules and severity mapping'],
      sectionMappingNote: MAPPING_NOTE,
      entitlement: 'included',
      notIncludedReason: null,
      enablement: 'enabled',
      reliedOnBy: [WHEEL_BOLT],
      consequenceWording: 'Deviation Rules and Severity Mapping',
      consequenceScope: 'every screen that can deviate',
      sourceRef: 'L33979',
    },
    {
      id: 'CAP-QUALIFICATION',
      name: 'Elevated qualification enforcement',
      sourceWording: 'Elevated qualification enforcement',
      surfaceWording: 'Screen-level qualification override',
      sections: ['Qualification override'],
      sectionMappingNote: MAPPING_NOTE,
      entitlement: 'included',
      notIncludedReason: null,
      enablement: 'enabled',
      reliedOnBy: [WHEEL_BOLT],
      consequenceWording: 'Qualification Override',
      consequenceScope: 'every screen carrying a screen-level certification',
      sourceRef: 'L33980',
    },
    {
      id: 'CAP-TOOLING',
      name: 'Tool and equipment control',
      sourceWording: 'Tool and equipment control',
      surfaceWording: 'Tool barcode and calibration-confirmation requirements',
      sections: ['Tool and equipment'],
      sectionMappingNote: MAPPING_NOTE,
      entitlement: 'included',
      notIncludedReason: null,
      // Entitled and enabled, and no published Workflow relies on it yet. The
      // column says exactly that rather than going blank.
      enablement: 'enabled',
      reliedOnBy: [],
      consequenceWording: 'Tool and Equipment',
      consequenceScope: 'every screen requiring a tool',
      sourceRef: 'L33981',
    },
    {
      id: 'CAP-EQUIPMENT-SIGNAL',
      name: 'Equipment-signal monitoring',
      sourceWording: 'A future capability, for example equipment-signal monitoring',
      surfaceWording:
        'A new configuration surface for that capability, appearing only where relevant',
      // Outside entitlement, so it switches on none of the nine.
      sections: [],
      sectionMappingNote: MAPPING_NOTE,
      entitlement: 'not-included',
      notIncludedReason: NOT_ENTITLED_REASON,
      enablement: 'disabled',
      reliedOnBy: [],
      consequenceWording: 'no configuration surface',
      consequenceScope: 'any screen',
      sourceRef: 'L33982',
    },
  ],
}

/* ==================================================================== *
 * READERS. Every one takes its register as a PARAMETER: nothing here
 * closes over a module-load snapshot.
 * ==================================================================== */

/**
 * SCOPE, ENFORCED IN THE READ. A screen that draws only its own tenant's rows
 * but READS another tenant's register has already crossed the boundary
 * (L31668: "a request naming another tenant's capability enablement is
 * refused and audited"). This is the only way rows reach a screen.
 */
export function capabilitiesForTenant(
  registers: readonly CapabilityRegister[],
  tenant: TenantId,
): readonly AtomicCapabilityRow[] {
  return registers.filter((r) => r.tenant === tenant).flatMap((r) => r.rows)
}

export function capabilityById(
  rows: readonly AtomicCapabilityRow[],
  id: AtomicCapabilityId,
): AtomicCapabilityRow | null {
  return rows.find((r) => r.id === id) ?? null
}

/** Which capability gates a section, or `null` where none does. */
export function capabilityForSection(
  rows: readonly AtomicCapabilityRow[],
  section: ConfigurationSection,
): AtomicCapabilityRow | null {
  return rows.find((r) => r.sections.includes(section)) ?? null
}

/**
 * SB-STU-02's "plain-language consequence line", produced FROM the row rather
 * than pasted beside it, so it cannot drift from the data it describes. The
 * source prints one of these in full at L30751 and the covering test pins that
 * sentence against this function's output — a live check, not a dead string.
 */
export function consequenceLine(row: AtomicCapabilityRow): string {
  if (row.entitlement === 'not-included') {
    return (
      `${row.name} is not included in this tenant’s entitlement, so no configuration surface for it exists on ` +
      'any screen. Including it is a commercial change followed by a platform engineering registration, not a ' +
      'Studio setting.'
    )
  }
  const plural = row.sections.length > 1 ? 'sections' : 'section'
  return (
    `Disabling ${row.name.toLowerCase()} removes the ${row.consequenceWording} ${plural} from ` +
    `${row.consequenceScope} and blocks publication of any Workflow that depends on it.`
  )
}

/**
 * `SB-STU-04`'s reason clause, produced from the row. The source prints one of
 * these in full at L31640 — "Requires the containment response capability,
 * which is not enabled for this tenant." — and the covering test pins it.
 */
export function notAvailableReason(row: AtomicCapabilityRow): string {
  return `Requires the ${row.name.toLowerCase()} capability, which is not enabled for this tenant.`
}

/* ==================================================================== *
 * S8 — CONFIGURATION FOLLOWS CAPABILITY, AND THE FREEZE RULE.
 * ==================================================================== */

export type SectionRendering<T> =
  | { readonly kind: 'present' }
  | { readonly kind: 'not-available'; readonly reason: string; readonly capability: string }
  /**
   * `FUNC-STU-01-01-B-1` (L31597): under `FB-STU-07`, "surfaces freeze
   * read-only rather than disappearing, so an author is never shown an empty
   * section that silently discarded a value." The value travels THROUGH this
   * branch — that is what "discarded nothing" means, and the covering test
   * round-trips it.
   */
  | { readonly kind: 'frozen-read-only'; readonly reason: string; readonly value: T }

export function sectionRendering<T>(
  section: ConfigurationSection,
  rows: readonly AtomicCapabilityRow[],
  configuredValue: T,
): SectionRendering<T> {
  const capability = capabilityForSection(rows, section)
  if (capability === null) return { kind: 'present' }

  if (capability.enablement === 'unresolvable') {
    return {
      kind: 'frozen-read-only',
      reason:
        `The enablement state of ${capability.name.toLowerCase()} could not be read, so this section is frozen ` +
        'read-only rather than removed. Nothing configured here has been discarded, and nothing here can be ' +
        'changed until the capability registry can be read again.',
      value: configuredValue,
    }
  }
  if (capability.enablement === 'enabled' && capability.entitlement === 'included') {
    return { kind: 'present' }
  }
  return {
    kind: 'not-available',
    reason: notAvailableReason(capability),
    capability: capability.name,
  }
}

/** Every one of the nine, answered. Used by the view and by Task 15's panel. */
export function sectionRenderings<T>(
  rows: readonly AtomicCapabilityRow[],
  configuredValue: T,
): readonly { readonly section: ConfigurationSection; readonly rendering: SectionRendering<T> }[] {
  return CONFIGURATION_SECTIONS.map((section) => ({
    section,
    rendering: sectionRendering(section, rows, configuredValue),
  }))
}

/* ==================================================================== *
 * PUBLISH CHECK #9 — AC-STU-007 (L30782).
 * ==================================================================== */

export interface CapabilityDependentScreen {
  readonly screenId: string
  readonly requires: AtomicCapabilityId
}

export interface CapabilityPublishSubject {
  readonly workflowName: string
  readonly register: CapabilityRegister
  readonly screens: readonly CapabilityDependentScreen[]
}

/**
 * Blocks publication of any Workflow whose screens depend on a capability the
 * tenant has disabled, NAMING the dependent screens (L30782).
 *
 * Two refusals, kept apart because they are different answers. A screen whose
 * capability is DISABLED is a refusal the author can act on. A screen whose
 * capability state cannot be READ is a check that could not run, and
 * `FB-STU-07`'s terminal safe state blocks there too (L30774) — "publishing a
 * Workflow whose capability dependencies cannot be verified would place
 * unverifiable content on the floor."
 */
export const capabilityDependencyCheck: PublishCheckImplementation<CapabilityPublishSubject> = {
  checkId: 'capability-dependency',
  implementedBy: 'MOD-STU-01',
  run: (subject): PublishCheckVerdict => {
    const unreadable: string[] = []
    const blocked: string[] = []

    for (const screen of subject.screens) {
      const capability = capabilityById(subject.register.rows, screen.requires)
      if (capability === null || capability.enablement === 'unresolvable') {
        unreadable.push(`${screen.screenId} (${screen.requires})`)
        continue
      }
      if (capability.enablement !== 'enabled' || capability.entitlement !== 'included') {
        blocked.push(`${screen.screenId} (${capability.name})`)
      }
    }

    if (unreadable.length > 0) {
      return {
        outcome: 'cannot-run',
        reason:
          `the capability state could not be read for ${unreadable.join(', ')}, so the dependency cannot be ` +
          'verified; publication is blocked rather than assumed',
      }
    }
    if (blocked.length > 0) {
      return { outcome: 'blocked', blockingElement: `dependent screens: ${blocked.join(', ')}` }
    }
    return { outcome: 'passed' }
  },
}

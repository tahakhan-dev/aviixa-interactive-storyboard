import type { RoleId } from '@/domain/roles'

/**
 * MOD-SA-19 — The Tenant-Configuration Registry (§8.19, Band B).
 *
 * Every value below is a seeded fixture, and every row carries the frozen
 * source line it came from. Nothing here is computed, nothing is fetched,
 * and nothing reads a clock: the as-of labels are fixture strings, not
 * `Date.now()`.
 *
 * The one thing this module must get right is the REJECTION, because the
 * source is unusually precise about it — `AC-SA-19-03` (L46318): "a
 * looser-than-floor value is rejected at the point of entry with the bound
 * stated and is not stored". Rejected at entry, so never accepted and then
 * logged as a setting: the register rejects; it does not log (L44568). That
 * is a different sentence from "the refusal is not recorded" —
 * FB-FLOOR-001 (L12917) and FB-TA-001 (L11815) both state
 * that refused attempts ARE recorded. What is never recorded is the value as
 * a setting. Both are rendered, because collapsing them loses the design.
 */

/* ------------------------------------------------------------------ *
 * The four console roles, as a view-switcher (spec §8: not a login).
 * ------------------------------------------------------------------ */

export interface RegistryPlatformRole {
  readonly id: RoleId
  readonly name: string
  readonly roleAnnotation: string
}

export const REGISTRY_PLATFORM_ROLES = [
  { id: 'ROOT_SUPER_ADMIN', name: 'Root Super Admin', roleAnnotation: 'ROLE-PLAT-ROOT' },
  { id: 'ADMIN', name: 'Admin', roleAnnotation: 'ROLE-PLAT-ADMIN' },
  { id: 'PLATFORM_ENGINEER', name: 'Platform Engineer', roleAnnotation: 'ROLE-PLAT-ENG' },
  { id: 'SUPPORT', name: 'Support', roleAnnotation: 'ROLE-PLAT-SUP' },
] as const satisfies readonly RegistryPlatformRole[]

/* ------------------------------------------------------------------ *
 * OBJ-SA-REGENTRY — the five registry-entry states (L46265, L46266).
 * `as const satisfies` keeps every member literal-narrowed, so the
 * exhaustiveness check below is real rather than vacuous.
 * ------------------------------------------------------------------ */

export type RegistryEntryState =
  | 'at default'
  | 'tenant-set stricter'
  | 'platform-set'
  | 'non-conforming after a bound tightening'
  | 'reconciled'

export const REGISTRY_ENTRY_STATES = [
  'at default',
  'tenant-set stricter',
  'platform-set',
  'non-conforming after a bound tightening',
  'reconciled',
] as const satisfies readonly RegistryEntryState[]

type MissingEntryState = Exclude<RegistryEntryState, (typeof REGISTRY_ENTRY_STATES)[number]>
const _entryStatesExhaustive: MissingEntryState extends never ? true : never = true
void _entryStatesExhaustive

/* ------------------------------------------------------------------ *
 * The three write classes — AC-SA-19-07 (L46318). Three different
 * approval routes on one table, which is the interesting design problem
 * in this module.
 * ------------------------------------------------------------------ */

export type WriteClassId = 'current-value' | 'default' | 'bound'

export interface WriteClassDefinition {
  readonly id: WriteClassId
  readonly name: string
  /** The class name the source gives the change, not a severity of our own. */
  readonly changeClass: string
  /** Per-control allowed roles (D16) — never the module-level roles_allowed. */
  readonly allowedRoles: readonly RoleId[]
  /** True only for the critical class: the action bar becomes a class badge. */
  readonly critical: boolean
  readonly approvalRoute: string
  readonly sourceRef: string
}

export const WRITE_CLASSES = [
  {
    id: 'current-value',
    name: 'Current tenant value, platform-side',
    changeClass: 'Admin action',
    allowedRoles: ['ROOT_SUPER_ADMIN', 'ADMIN'],
    critical: false,
    approvalRoute:
      'Applies on acceptance, with its audit event in the same transaction. No second approver is named for this class.',
    sourceRef: 'AC-SA-19-07, L46318',
  },
  {
    id: 'default',
    name: 'Platform default',
    changeClass: 'Engineering class',
    allowedRoles: ['ROOT_SUPER_ADMIN', 'PLATFORM_ENGINEER'],
    critical: false,
    approvalRoute:
      'The Platform Engineer is the maker and submits into the approval cycle; the Admin is the checker (AC-SA-19-07, D14, L11684). A maker never approves its own change.',
    sourceRef: 'AC-SA-19-07, L46318',
  },
  {
    id: 'bound',
    name: 'Floor-register bound',
    changeClass: 'Critical class',
    allowedRoles: ['ROOT_SUPER_ADMIN'],
    critical: true,
    approvalRoute:
      'Opens a critical-class request that only the root approves. Floor-register changes are one of the eleven critical-class actions (L55942).',
    sourceRef: 'AC-SA-19-07, L46318; L55942',
  },
] as const satisfies readonly WriteClassDefinition[]

type MissingWriteClass = Exclude<WriteClassId, (typeof WRITE_CLASSES)[number]['id']>
const _writeClassesExhaustive: MissingWriteClass extends never ? true : never = true
void _writeClassesExhaustive

/* ------------------------------------------------------------------ *
 * The governed settings, each with its three values.
 * ------------------------------------------------------------------ */

/** A bound this screen can evaluate a typed value against. */
export type NumericBound =
  | { readonly kind: 'range'; readonly min: number; readonly max: number; readonly unit: string; readonly statement: string }
  | { readonly kind: 'ceiling'; readonly max: number; readonly unit: string; readonly statement: string }
  | { readonly kind: 'floor'; readonly min: number; readonly unit: string; readonly statement: string }

export type SettingBound =
  | NumericBound
  | { readonly kind: 'stated-in-words'; readonly statement: string }
  | { readonly kind: 'not-stated-in-source'; readonly statement: string }

export interface GovernedSetting {
  readonly id: string
  readonly name: string
  readonly platformDefault: string
  readonly bound: SettingBound
  readonly currentValue: string
  readonly stricterDirection: string
  readonly entryState: RegistryEntryState
  readonly sourceRef: string
}

export const GOVERNED_SETTINGS = [
  {
    id: 'record-finish-window',
    name: 'Record-finish window',
    platformDefault: '48 hours',
    bound: {
      kind: 'range',
      min: 24,
      max: 168,
      unit: 'hours',
      statement: 'a floor of 24 hours and a ceiling of 7 days (168 hours)',
    },
    currentValue: '48 hours',
    stricterDirection: 'Shorter is stricter.',
    entryState: 'at default',
    sourceRef: 'L46207, L44543 — bounds carried under DEC-FINISH-001',
  },
  {
    id: 'offline-credential-trust-window',
    name: 'Offline credential-trust window',
    platformDefault: 'approximately 24 hours',
    bound: {
      kind: 'ceiling',
      max: 72,
      unit: 'hours',
      statement: 'a ceiling of 72 hours',
    },
    currentValue: '12 hours',
    stricterDirection: 'Shorter is stricter — it is the control that stops a suspended worker continuing on a dark tablet.',
    entryState: 'tenant-set stricter',
    sourceRef: 'L44540, L17131, L45466',
  },
  {
    id: 'clock-skew-threshold',
    name: 'Clock-skew threshold',
    platformDefault: 'approximately 5 minutes',
    bound: {
      kind: 'ceiling',
      max: 60,
      unit: 'minutes',
      statement: 'a ceiling of 60 minutes',
    },
    currentValue: '3 minutes',
    stricterDirection: 'Smaller is stricter.',
    entryState: 'platform-set',
    sourceRef: 'L42704, L11558, L17157',
  },
  {
    id: 'command-center-board-refresh-interval',
    name: 'Command Center board refresh interval',
    platformDefault: '60 seconds',
    bound: {
      kind: 'floor',
      min: 30,
      unit: 'seconds',
      statement: 'a floor of 30 seconds',
    },
    currentValue: '20 seconds',
    stricterDirection:
      'The source records the direction as "shorter is stricter" (L12899) while the floor forbids shorter — that tension is DEC-REFRESH-001 itself, and it is carried, not resolved here.',
    entryState: 'non-conforming after a bound tightening',
    sourceRef: 'L12899, DEC-REFRESH-001 at L35839',
  },
  {
    id: 'minimum-genealogy-depth',
    name: 'Minimum genealogy depth',
    platformDefault: 'one level plus full rework history',
    bound: {
      kind: 'floor',
      min: 1,
      unit: 'levels',
      statement: 'a floor of one level plus full rework history, which a tenant may not reduce',
    },
    currentValue: 'two levels plus full rework history',
    stricterDirection: 'Deeper is stricter.',
    entryState: 'reconciled',
    sourceRef: 'L44539, L111442',
  },
  {
    id: 'qualification-expiry-warning-schedule',
    name: 'Qualification-expiry warning schedule',
    platformDefault: '14, 7, 1 and 0 days before expiry',
    bound: {
      kind: 'stated-in-words',
      statement:
        'the four stages fire at 14, 7, 1 and 0 days; a tenant may add earlier stages and may never remove or delay one',
    },
    currentValue: '30, 14, 7, 1 and 0 days before expiry',
    stricterDirection: 'Earlier is stricter; later is impossible.',
    entryState: 'tenant-set stricter',
    sourceRef: 'L46207, L12900, L19540',
  },
  {
    id: 'severity-1-action-bundle',
    name: 'Severity 1 minimum action bundle',
    platformDefault: 'automatic lot freeze, Quality-Manager-only release, escalation',
    bound: {
      kind: 'stated-in-words',
      statement:
        'the three floor actions may never be removed or weakened; an attempt is rejected at entry with the floor stated',
    },
    currentValue: 'the three floor actions plus a tenant-added line-stop notification',
    stricterDirection: 'Adding actions is stricter; removing one is rejected.',
    entryState: 'tenant-set stricter',
    sourceRef: 'L44538, L20450, AC-SA-07-11-02 at L44490',
  },
  {
    id: 'qualification-gate-posture',
    name: 'Qualification gate posture',
    platformDefault: 'strict blocking',
    bound: {
      kind: 'stated-in-words',
      statement: 'notify-only is the floor; no silent posture exists',
    },
    currentValue: 'strict blocking',
    stricterDirection:
      'Blocking is stricter than notify-only. This is the only configurable gate on the platform.',
    entryState: 'at default',
    sourceRef: 'L8314',
  },
  {
    id: 'hot-retrievability-retention-horizon',
    name: 'Hot-retrievability retention horizon',
    platformDefault: '15 years',
    bound: {
      kind: 'not-stated-in-source',
      statement:
        'no floor-register row for this value appears in the extraction. The one bound the source does state is adjacent, not identical: audit retention is never shorter than the tenant data it evidences (AC-SA-18-08, L46193). AC-SA-19-05 requires a bound here, so the gap is named rather than filled.',
    },
    currentValue: '15 years',
    stricterDirection: 'Longer is stricter. Nothing is purged; beyond the horizon data tiers and stays retrievable.',
    entryState: 'at default',
    sourceRef: 'L18924, L21266',
  },
] as const satisfies readonly GovernedSetting[]

/**
 * The count is source-stated (17 governed settings, L46308, and "seventeen
 * setting families", L50194) and the enumeration does not reach it. Spec
 * §2.4 admits a closed count as a build input only where the enumeration
 * matches; here it does not, so the count is rendered WITH the shortfall
 * rather than padded to seventeen by inventing names. The same discipline
 * D12 applied to the critical-class list, in the opposite direction.
 */
export const GOVERNED_SETTING_COUNT_NOTE =
  'The frozen source states seventeen governed settings, each with a floor-register bound (AC-SA-19-05, L46318; the count again at L46308 and L50194). The extraction names nine of them. The eight unnamed settings are not invented here: a plausible invented setting reads back as a requirement, and a registry padded to a round number would be a fiction with a bound attached to it.'

/** Settings whose bound this screen can evaluate a typed value against. */
export type WritableSetting = GovernedSetting & { readonly bound: NumericBound }

// Generic in the element type: `GOVERNED_SETTINGS` is a literal-narrowed
// const, so a guard written as `(s: GovernedSetting): s is WritableSetting`
// silently fails to apply (WritableSetting does not extend the narrowed
// element type, so TypeScript falls back to the non-guard `filter` overload
// and the filter stops narrowing anything at all).
function hasNumericBound<T extends GovernedSetting>(
  setting: T,
): setting is T & { readonly bound: NumericBound } {
  return setting.bound.kind === 'range' || setting.bound.kind === 'ceiling' || setting.bound.kind === 'floor'
}

export const WRITABLE_SETTINGS: readonly WritableSetting[] = GOVERNED_SETTINGS.filter(hasNumericBound)

/* ------------------------------------------------------------------ *
 * The write itself. A typed outcome, never a thrown exception — the
 * rejection is an outcome of the workflow, not an error afterthought.
 * ------------------------------------------------------------------ */

export type WriteRejectionReason = 'out-of-bound' | 'not-a-number' | 'bound-unreadable'

export type WriteOutcome =
  | { readonly kind: 'accepted'; readonly value: number; readonly statement: string }
  | { readonly kind: 'rejected'; readonly reason: WriteRejectionReason; readonly statement: string }

/** The two sentences the source keeps apart, kept apart here too. */
const NOT_STORED =
  'The value is not stored: no out-of-bound value is ever accepted and logged (AC-SA-19-03, L46318), and the register rejects rather than logs (L44568). The refusal is recorded as a refusal (FB-FLOOR-001, L12917); what is never recorded is the value as a setting.'

function withinBound(bound: NumericBound, value: number): boolean {
  switch (bound.kind) {
    case 'range':
      return value >= bound.min && value <= bound.max
    case 'ceiling':
      return value <= bound.max
    case 'floor':
      return value >= bound.min
    default: {
      const exhaustive: never = bound
      return exhaustive
    }
  }
}

/**
 * `boundReadable` is the FB-SA-10 axis (L46316): when bound validation
 * against the platform floor register is unavailable, the behaviour is to
 * retry and then REJECT with the bound stated — accepting an unvalidated
 * value would breach the configurability principle at its one enforcement
 * point. Refusing is the design, not the failure.
 */
export function validateWrite(
  setting: WritableSetting,
  raw: string,
  boundReadable: boolean,
): WriteOutcome {
  if (!boundReadable) {
    return {
      kind: 'rejected',
      reason: 'bound-unreadable',
      statement: `Refused. The bound cannot be read from the platform floor register in this state, so after one retry the write is refused rather than accepted unvalidated (FB-SA-10, L46316). The existing ${setting.name.toLowerCase()} is unchanged, and nothing is stored.`,
    }
  }
  const trimmed = raw.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return {
      kind: 'rejected',
      reason: 'not-a-number',
      statement: `Rejected at the point of entry. ${setting.name} is a number of ${setting.bound.unit}, and "${raw}" is not one. The bound is ${setting.bound.statement}. ${NOT_STORED}`,
    }
  }
  const value = Number(trimmed)
  if (!withinBound(setting.bound, value)) {
    return {
      kind: 'rejected',
      reason: 'out-of-bound',
      statement: `Rejected at the point of entry. ${setting.name} is bounded at ${setting.bound.statement}; ${trimmed} ${setting.bound.unit} falls outside it. ${NOT_STORED}`,
    }
  }
  // The statement is the BOUND CHECK only. Whether the write then applies or
  // merely enters an approval cycle belongs to the write class, not to the
  // validator — a maker-checker change that reads "Accepted" would be a
  // queued action rendered as a completed one (STATE-09).
  return {
    kind: 'accepted',
    value,
    statement: `${trimmed} ${setting.bound.unit} is inside the bound of ${setting.bound.statement}.`,
  }
}

/* ------------------------------------------------------------------ *
 * The conformance panel — the one control the extraction defines for
 * this module (L46246, all four roles).
 * ------------------------------------------------------------------ */

export interface NonConformingEntry {
  readonly settingName: string
  readonly tenantLabel: string
  readonly currentValue: string
  readonly tightenedBound: string
  readonly sourceRef: string
}

export const NON_CONFORMING_ENTRIES = [
  {
    settingName: 'Command Center board refresh interval',
    tenantLabel: 'TEN-BRIGHTBIKES',
    currentValue: '20 seconds',
    tightenedBound: 'floor raised to 30 seconds',
    sourceRef: 'L12899, AC-SA-19-09 at L46318',
  },
  {
    settingName: 'Command Center board refresh interval',
    tenantLabel: 'TEN-NORTHFIELD',
    currentValue: '15 seconds',
    tightenedBound: 'floor raised to 30 seconds',
    sourceRef: 'L12899, AC-SA-19-09 at L46318',
  },
] as const satisfies readonly NonConformingEntry[]

/* ------------------------------------------------------------------ *
 * The seven platform-fixed items (L3606, enumerated at L12100). A closed
 * set whose enumeration matches its stated count, so it is counted on
 * screen. AC-FLOOR-003 (L12939): platform-fixed items present NO control
 * anywhere, INCLUDING no disabled control.
 * ------------------------------------------------------------------ */

export interface PlatformFixedItem {
  readonly name: string
  readonly note: string
}

export const PLATFORM_FIXED_ITEMS = [
  {
    name: 'Specification gates',
    note: 'Hard and platform-fixed with no tenant off switch; a failed specification capture blocks progression (L8814).',
  },
  {
    name: 'The evaluation gate',
    note: 'One of the six enforced invariants. No off position for any account including the root (L2143).',
  },
  {
    name: "Severity 1's minimum action bundle",
    note: 'Automatic lot freeze, Quality-Manager-only release, escalation. A tenant may add actions and may never remove one (L20450).',
  },
  {
    name: 'On-device severity classification',
    note: 'Fixed for everyone, always (L12100).',
  },
  {
    name: 'Evidence immutability',
    note: 'Fixed for everyone, always (L12100).',
  },
  {
    name: 'Cross-tenant data isolation',
    note: 'Fixed for everyone, always (L12100).',
  },
  {
    name: 'Audit completeness',
    note: 'The one-transaction guarantee. An action that cannot be audited does not happen (FB-SA-03, L46191).',
  },
] as const satisfies readonly PlatformFixedItem[]

/* ------------------------------------------------------------------ *
 * Prohibitions rendered ABSENT — nothing drawn, a one-line note where a
 * control would sit.
 * ------------------------------------------------------------------ */

export interface AbsentControl {
  readonly label: string
  readonly note: string
}

export const REGISTRY_ABSENT_CONTROLS = [
  {
    label: 'Write a value looser than the platform floor',
    note: 'No such control exists for any account, including the root: every role including the Root Super Admin may not write a looser-than-floor configuration value (L3606). Nothing is drawn here, because a disabled control would imply an enabled state exists somewhere.',
  },
  {
    label: 'Grant a per-tenant exception to a bound',
    note: 'No exception control exists. A request to move a platform-fixed value is refused as a configuration matter and recorded as a platform product decision of critical class (L12104, FB-TIER-003).',
  },
  {
    label: 'Rewrite non-conforming values after tightening a bound',
    note: 'Tightening a bound surfaces non-conforming values rather than rewriting them (AC-SA-19-09, L46318). No bulk-correct, no force-conform and no auto-migrate control is offered to any role.',
  },
  {
    label: 'Apply a write without passing the registry',
    note: 'Every write path, tenant-side and platform-side, lands at the registry, and no bypass exists (AC-SA-19-02, L46318). There is no direct-apply affordance to draw.',
  },
  {
    label: 'Open the tenant record behind a row',
    note: 'No row on this console opens tenant content. There is no ambient browsing anywhere on this surface (AC-SA-000-07, AC-SEC-801); tenant content is reachable only through a named access session.',
  },
  {
    label: 'Enable or disable a feature for a tenant',
    note: 'Not offered here. Global feature control stays with Platform Settings and the per-tenant override is a flag on the tenant record in Tiers, Entitlements and Caps (D7, AC-SA-11-04). DEC-FEAT-001 is open on which class that change belongs to, so no control is drawn on the strength of one reading.',
  },
] as const satisfies readonly AbsentControl[]

/* ------------------------------------------------------------------ *
 * Affordances the source does not define. Named, never invented.
 * ------------------------------------------------------------------ */

export interface UnspecifiedAffordance {
  readonly affordance: string
  readonly note: string
}

export const REGISTRY_UNSPECIFIED_IN_SOURCE = [
  {
    affordance: 'The eight unnamed governed settings',
    note: 'Seventeen are stated; nine are named. The remaining eight have no name, no default, no bound and no direction of strictness anywhere in the extraction.',
  },
  {
    affordance: 'Which eight rows the platform floor register carries',
    note: 'The row count is stated twice (L44534, L66626) and the rows are never listed together. This screen shows the bounds it can name and does not assert which eight the register holds.',
  },
  {
    affordance: 'A bound for the hot-retrievability retention horizon',
    note: 'AC-SA-19-05 requires every governed setting to have a floor-register bound. No row for this one appears in the extraction, so its bound cell states the gap instead of carrying a number.',
  },
  {
    affordance: 'The entry form itself',
    note: 'The source states the outcome of a write precisely and names no input: no field shape, no unit selector, no per-setting message text, no confirmation step. The form here is the minimum the acceptance criteria force and is labelled as such.',
  },
  {
    affordance: 'Any action on a non-conforming row',
    note: 'The conformance panel is defined as a list (L46246). No acknowledge, no dismiss, no schedule-a-correction and no notify-the-tenant control is named, so none is drawn.',
  },
  {
    affordance: 'The transition into the reconciled entry state',
    note: 'OBJ-SA-REGENTRY carries a reconciled state (L46265). Nothing in the source says who moves an entry into it, or through what control.',
  },
  {
    affordance: 'Re-driving a write after FB-SA-10 recovery',
    note: 'Recovery is stated as "re-drive the write" (L46316). No retry affordance, and no queue of refused writes, is defined on this screen.',
  },
  {
    affordance: 'Whether a bound may be loosened at all',
    note: 'AC-SA-19-09 describes only tightening. Whether the floor register itself can move outward, and what happens to tenant values if it does, is unstated — so the bound write class routes to root approval without this screen asserting a direction.',
  },
] as const satisfies readonly UnspecifiedAffordance[]

/* ------------------------------------------------------------------ *
 * Conflicts in the source, recorded rather than resolved silently.
 * ------------------------------------------------------------------ */

export interface SourceConflict {
  readonly topic: string
  readonly conflict: string
  readonly resolution: string
}

export const REGISTRY_SOURCE_CONFLICTS = [
  {
    topic: 'DEC-FINISH-001 — record-finish window bounds',
    conflict:
      '§2.4 marks 24 hours to 7 days as an open drafting value; §4.6.8 and §8.19 state the same numbers as settled (L46211, L7066).',
    resolution:
      'Both readings preserved. The bound is rendered with the decision reference attached, and the screen does not present it as closed.',
  },
  {
    topic: 'DEC-REFRESH-001 — the 30-second board refresh floor',
    conflict:
      'The floor is recorded as a per-tenant floor of 30 seconds while the direction of strictness is recorded as "shorter is stricter" (L12899) — and the open decision asks whether a faster value is rejected, clamped, or served degraded (L35839).',
    resolution:
      'Rejected at entry, matching this module\'s single rule, with the decision reference shown. No clamping behaviour is built: clamping would silently store a value the tenant did not ask for.',
  },
  {
    topic: 'DEC-FEAT-001 — who changes feature enablement',
    conflict:
      '§8.19 makes platform-side current-value changes, including feature enablement, an Admin action; §8.2.2 makes atom enablement a Platform Engineer change requiring Admin approval (L46211, L4638).',
    resolution:
      'Split by kind (D14) and no feature-enablement control is drawn on this module at all. The registry renders the write classes; the feature surface belongs to Platform Settings and Tiers, Entitlements and Caps.',
  },
  {
    topic: '"Never accepted and logged" against "refused attempts are recorded"',
    conflict:
      'AC-SA-19-03 says the value is never accepted and logged and the register rejects rather than logs (L46318, L44568); FB-FLOOR-001 and FB-TA-001 say refused attempts are recorded (L12917, L11815).',
    resolution:
      'Not a contradiction once the objects are separated: the VALUE is never stored as a setting, and the REFUSAL is recorded as a refusal. The rejection panel states both, in those words.',
  },
  {
    topic: 'Seventeen governed settings, nine named',
    conflict:
      'The count is stated three times (L46318, L46308, L50194) and the enumeration never reaches it.',
    resolution:
      'Nine rendered, the count stated, the shortfall named. No setting was invented to reach seventeen.',
  },
  {
    topic: 'Module-level roles_allowed',
    conflict:
      'Five extraction chunks give five different answers for this module: Admin only (L2442), Root only (L11676), Admin plus Platform Engineer plus Root plus Tenant Admin (L4630), all four console roles (L21096, L42753), and all four plus Tenant Admin (L46250).',
    resolution:
      'Module-level roles_allowed is authoritative nowhere (D16). Every affordance on this screen is driven by per-control allowed roles through the policy evaluator, and all four console roles read every panel.',
  },
  {
    topic: 'DEC-SESSION-001 — session lifetime as a governed setting',
    conflict:
      'One option models session timeout and concurrency as a tenant setting bounded by the floor register; two others do not (L19272). The decision is open.',
    resolution:
      'Not rendered as a registry row. Adding it would assert the open option as settled, and a row with an unset bound reads as a requirement to build one.',
  },
] as const satisfies readonly SourceConflict[]

/* ------------------------------------------------------------------ *
 * Workflows. The extraction attaches no module identifier to any
 * workflow, so each row states how it was matched.
 * ------------------------------------------------------------------ */

export interface RegistryWorkflow {
  readonly id: string
  readonly name: string
  readonly actor: string
  readonly trigger: string
  readonly terminalStates: readonly string[]
  readonly matchedBy: string
}

export const REGISTRY_WORKFLOWS = [
  {
    id: 'unnumbered — 23.19 registry write (L46213)',
    name: 'A write, from either side, validated against the floor register',
    actor: "Tenant Admin or the client's platform team",
    trigger: 'A write is attempted from the tenant admin area or from the console',
    terminalStates: [
      'accepted and committed with its audit event',
      'rejected at the point of entry with the bound stated, nothing stored',
    ],
    matchedBy:
      'line proximity and name — the workflow sits at L46213, inside the §23.19 / §8.19 block whose module row is at L46250, and its own identifier names 23.19',
  },
  {
    id: 'unstated — "Changing a tenant setting" (L11755)',
    name: 'Changing a tenant setting',
    actor: 'Tenant Admin',
    trigger: 'The Tenant Admin opens the tenant administration area',
    terminalStates: ['accepted and written with audit', 'rejected as looser than floor'],
    matchedBy:
      'terminal states — the workflow is owned by the tenant administration area on the Delivery Operations Hub, and its rejection terminal state is this registry acting as the single enforcement point (AC-SA-19-02). Shown here as the tenant-side half of the same write path, not as a console workflow',
  },
] as const satisfies readonly RegistryWorkflow[]

/* ------------------------------------------------------------------ *
 * Aggregate framing. Fixture strings — nothing here reads a clock.
 * ------------------------------------------------------------------ */

/**
 * STATE-13. One string, used by the recovery banner AND by every aggregate
 * that degrades in that state, so the banner can never say "two of nine
 * re-read" while a panel below it reports all nine as current.
 */
export const REGISTRY_RECOVERY_NOTE =
  'Two settings of nine have been re-read so far. Nothing is presented as conforming until every setting has been re-read against its bound.'

export const REGISTRY_TENANT_LABEL = 'TEN-BRIGHTBIKES'
export const REGISTRY_AS_OF = 'as of 2026-08-17 08:00 UTC'
export const REGISTRY_STALE_AS_OF = 'as of 2026-08-15 02:00 UTC — 54 hours old'
export const REGISTRY_ORIGIN = 'origin: seeded registry fixture, not a connected store'

import type { DifficultyLevel, Locale, PackageState } from '@/studio/vocab'
import { DIFFICULTY_LEVELS } from '@/studio/vocab'

/**
 * `MOD-STU-14` — the work-package definition, its manifest, and the pinning
 * contract. Frozen source §5.14, card L33783-L33959.
 *
 * ### WHAT THIS FILE DOES NOT DO, AND CANNOT
 *
 * **It never fires a build.** L33823's row 2 reads `Not applicable — the
 * build fires at run assignment in the Delivery Operations Hub` for the
 * Quality Manager while BOTH Supervisor columns read `Allowed with
 * conditions`. Those are CROSS-SURFACE statements (R22): the Allowed cells
 * describe an act performed through run assignment on `SURF-DOH`, not a
 * control this surface offers. Slice 5 builds the definition, the manifest
 * and the pinning contract; `MOD-DOH-06` fires the build in slice 6, and the
 * seam registry carries that row.
 *
 * **It cannot rebase a pin, because it reaches nothing that could.** There is
 * no import of the publication machinery, no version register, no lookup of
 * "the latest published version" anywhere in this module. That is deliberate
 * and it is the protection: a guard can be deleted by a later refactor along
 * with the test that covered it, and an absent reference cannot. `AC-STU-125`
 * — "a package is pinned per Run and is never swapped mid-Run by any actor or
 * publication" — is held by omission rather than by a check.
 *
 * ### D8 — FIVE AGAINST SIX, AND NEITHER COUNT WINS (R17)
 *
 * `AC-STU-120` (L33941) asserts "all five stated content classes"; the five
 * are numbered at L33793-L33797. `AC-WF-AUT-009-01` (L53647) asserts six, and
 * `TEST-WF-AUT-009-01` (L53648) is "Manifest assertion for the six mandatory
 * content classes". The six-way list splits class 3 into three and class 2
 * into two, and drops screen content and coaching entirely. Both are
 * test-strength assertions about ONE manifest and the source gave the
 * conflict no `DEC-*` identifier at all.
 *
 * So the contents are ONE closed element set, and each criterion is recorded
 * as a GROUPING over it. Both criteria are satisfiable against the same
 * package and neither count is asserted as *the* count. **The gate asserts
 * contents, not cardinality** — there is deliberately no exported class
 * count, and `packageManifestLines` prints no number of classes.
 *
 * ### `Quarantined` IS A FLAG, NOT A SIXTH STATE (D21)
 *
 * L33839 enumerates five states — Defined, Built, Delivered, Pinned,
 * Superseded — and puts Quarantined in the prose beside them: "A package that
 * fails integrity verification is Quarantined and is never Delivered." D21's
 * ruling is that the identity cards govern the enumerations and the three
 * prose states are modelled as flags, each attached where the source attaches
 * it. `PackageState` therefore stays five members long and `IntegrityVerdict`
 * carries `quarantined` beside the state it did not reach.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state.
 */

/* ==================================================================== *
 * THE CONTENTS — one closed element set, two source groupings.
 * ==================================================================== */

/**
 * The atomic things a package carries. Every element appears in the five
 * numbered classes of L33793-L33797; six of the eight also appear in
 * `AC-WF-AUT-009-01`'s six-way list. The set is the JOIN between the two
 * criteria — which is what makes both checkable without either count
 * becoming the answer.
 */
export type PackageContentElement =
  | 'screen-content'
  | 'specification-limits'
  | 'gate-rules'
  | 'severity-mappings'
  | 'catalog-definitions'
  | 'tenant-action-bundles'
  | 'deviation-capture-forms'
  | 'coaching-defaults'

export const PACKAGE_CONTENT_ELEMENTS = [
  'screen-content',
  'specification-limits',
  'gate-rules',
  'severity-mappings',
  'catalog-definitions',
  'tenant-action-bundles',
  'deviation-capture-forms',
  'coaching-defaults',
] as const satisfies readonly PackageContentElement[]

type MissingFromElements = Exclude<PackageContentElement, (typeof PACKAGE_CONTENT_ELEMENTS)[number]>
const _elementsExhaustive: MissingFromElements extends never ? true : never = true
void _elementsExhaustive

export interface PackageContentGroup {
  /** The criterion's own words for this group, verbatim. */
  readonly text: string
  readonly elements: readonly PackageContentElement[]
}

export type PackageGroupingId = 'five-numbered-classes' | 'six-mandatory-content-classes'

export interface PackageContentGrouping {
  readonly id: PackageGroupingId
  /** The acceptance criterion that asserts this grouping. */
  readonly criterion: string
  readonly locator: string
  /** What this grouping is, in one sentence, for the reader on the screen. */
  readonly note: string
  readonly groups: readonly PackageContentGroup[]
}

/**
 * L33793-L33797, quoted whole. The lead-in sentence is the source's own:
 * "The package contains everything the device must render, evaluate, and
 * enforce alone".
 */
const FIVE_NUMBERED_CLASSES: PackageContentGrouping = {
  id: 'five-numbered-classes',
  criterion: 'AC-STU-120 — “The package carries all five stated content classes”',
  locator: 'L33793-L33797 · AC-STU-120 L33941',
  note:
    'The module card’s own numbered list. It is the only one of the two that covers the whole ' +
    'element set: screen content and coaching appear here and nowhere in the six-way list.',
  groups: [
    {
      text:
        'all screen content, including instruction text at the difficulty levels — all levels ' +
        'pending the packaging decision of DEC-WIDIFF-001 — in the Run’s locale',
      elements: ['screen-content'],
    },
    { text: 'specification limits and gate rules', elements: ['specification-limits', 'gate-rules'] },
    {
      text:
        'the screen severity mappings together with the severity-catalog definitions and tenant ' +
        'action bundles needed to classify and act at capture',
      elements: ['severity-mappings', 'catalog-definitions', 'tenant-action-bundles'],
    },
    {
      text:
        'the platform deviation-capture forms, so the default gate-failure path works offline',
      elements: ['deviation-capture-forms'],
    },
    {
      text:
        'the designated coaching defaults and short-form coaching assets, included subject to ' +
        'available device storage',
      elements: ['coaching-defaults'],
    },
  ],
}

/**
 * `AC-WF-AUT-009-01` (L53647), whose list `TEST-WF-AUT-009-01` (L53648) calls
 * "the six mandatory content classes". Recorded as a SECOND GROUPING of the
 * same contents rather than as a rival list, because both are test-strength
 * assertions about one manifest.
 */
const SIX_MANDATORY_CLASSES: PackageContentGrouping = {
  id: 'six-mandatory-content-classes',
  criterion:
    'AC-WF-AUT-009-01 — “Every package carries specification limits, gate rules, severity ' +
    'mappings, catalog definitions, tenant action bundles, and deviation-capture forms”',
  locator: 'AC-WF-AUT-009-01 L53647 · TEST-WF-AUT-009-01 L53648',
  note:
    'The workflow chapter’s own list. It splits the third numbered class into three and the ' +
    'second into two, and it names neither screen content nor coaching — so it is a narrower ' +
    'grouping of the same package, never a different package.',
  groups: [
    { text: 'specification limits', elements: ['specification-limits'] },
    { text: 'gate rules', elements: ['gate-rules'] },
    { text: 'severity mappings', elements: ['severity-mappings'] },
    { text: 'catalog definitions', elements: ['catalog-definitions'] },
    { text: 'tenant action bundles', elements: ['tenant-action-bundles'] },
    { text: 'deviation-capture forms', elements: ['deviation-capture-forms'] },
  ],
}

export const PACKAGE_CONTENT_GROUPINGS = [
  FIVE_NUMBERED_CLASSES,
  SIX_MANDATORY_CLASSES,
] as const satisfies readonly PackageContentGrouping[]

export function contentGrouping(id: PackageGroupingId): PackageContentGrouping {
  const found = PACKAGE_CONTENT_GROUPINGS.find((g) => g.id === id)
  if (found === undefined) throw new Error(`MOD-STU-14: no content grouping "${id}".`)
  return found
}

/** L33799, the two exclusions, in the source's own words. */
export interface PackageExclusion {
  readonly id: 'training-library-content' | 'escalation-delivery'
  readonly text: string
  readonly reason: string
  readonly sourceRef: string
}

export const PACKAGE_EXCLUSIONS = [
  {
    id: 'training-library-content',
    text: 'Training Library content is excluded.',
    reason:
      'Training never competes for run-critical storage, and no training item ever enters a work ' +
      'package — which limits its exposure to devices (FUNC-STU-14-01-C-1, L33852).',
    sourceRef: 'L33799 · AC-STU-080 L32922',
  },
  {
    id: 'escalation-delivery',
    text: 'Escalation delivery is server-side and is not packaged.',
    reason:
      'What waits for reconnection is delivery, not evaluation. The device earns the escalation ' +
      'offline and the server delivers it at sync.',
    sourceRef: 'L33799 · L33801',
  },
] as const satisfies readonly PackageExclusion[]

/* ==================================================================== *
 * THE PACKAGE AND ITS MANIFEST — OBJ-045 and OBJ-046.
 * ==================================================================== */

/**
 * `OBJ-STU-PACKAGE` (L33837) = `OBJ-045` Work package (L8760) plus `OBJ-046`
 * Package manifest (L8779). One record, because the manifest is the contents
 * list of the package and the source gives them one lifecycle.
 *
 * `newerPublishedVersion` is here ON PURPOSE and it is a display fact, never
 * an input to the pin. It exists so a reader can see the pinning line hold
 * against a real newer version rather than against nothing —
 * `packageManifestLines` reports `pinnedVersion` and does not consult it.
 */
export interface WorkPackage {
  readonly packageId: string
  readonly runId: string
  readonly deviceId: string
  /** Fixed at assignment. Nothing in this module can change it. */
  readonly pinnedVersion: string
  /** A version published after this Run started, where one exists. Display only. */
  readonly newerPublishedVersion: string | null
  readonly locale: Locale
  /** D16: all three ship, under DEC-WIDIFF-001's interim rule. */
  readonly difficultyLevels: readonly DifficultyLevel[]
  readonly screenCount: number
  /** What the build actually assembled. The manifest's own contents list. */
  readonly elements: readonly PackageContentElement[]
  readonly specificationLimits: readonly string[]
  readonly severityCatalogLevels: readonly string[]
  readonly tenantActionBundles: readonly string[]
  readonly deviationCaptureForms: readonly string[]
  readonly coachingIncluded: readonly string[]
  /** `AC-STU-127` — by asset NAME, never a count and never a category. */
  readonly coachingOmittedForStorage: readonly string[]
  /** Must be empty. `AC-STU-080`: no work package, in any configuration. */
  readonly trainingItems: readonly string[]
  readonly state: PackageState
}

/**
 * The source's own illustrative package (L33907): `RUN-2026-08-14-A` on
 * `TAB-014`, built from `v2.1.0` in Maya's locale, "carrying all eleven
 * screens, the 44 to 47 Newton metre limits with drawing DWG-A441, the hard
 * gates, the Severity 2 and Severity 1 band mappings with the Torque
 * Out-of-Tolerance containment checklist, the tenant action bundles, the
 * platform deviation-capture forms, and four short coaching clips; one longer
 * clip is omitted for storage and the omission is listed by name."
 *
 * The omitted clip's NAME is the source's own subject and the source does not
 * spell it, so it carries this build's identifier and says which asset it is.
 */
export const RUN_2026_08_14_A_PACKAGE: WorkPackage = {
  packageId: 'PKG-BB-2026-08-14-A',
  runId: 'RUN-2026-08-14-A',
  deviceId: 'TAB-014',
  pinnedVersion: 'v2.1.0',
  newerPublishedVersion: null,
  locale: 'English',
  difficultyLevels: DIFFICULTY_LEVELS,
  screenCount: 11,
  elements: PACKAGE_CONTENT_ELEMENTS,
  specificationLimits: ['44 to 47 Newton metres, drawing DWG-A441'],
  severityCatalogLevels: ['Severity 1', 'Severity 2'],
  tenantActionBundles: ['Torque Out-of-Tolerance containment checklist'],
  deviationCaptureForms: ['Platform deviation-capture form'],
  coachingIncluded: [
    'CLIP-TORQUE-SEATING',
    'CLIP-WRENCH-CALIBRATION',
    'CLIP-BOLT-PATTERN',
    'CLIP-HOLD-HANDOFF',
  ],
  coachingOmittedForStorage: ['CLIP-WHEEL-STATION-WALKTHROUGH-LONG'],
  trainingItems: [],
  state: 'Pinned',
}

/** Whether the built package carries this element. The contents question. */
export function manifestContains(pkg: WorkPackage, element: PackageContentElement): boolean {
  return pkg.elements.includes(element)
}

/** Test seams — a package with an element corrupted out of it, or a training item smuggled in. */
export function withElementsRemoved(
  pkg: WorkPackage,
  removed: readonly PackageContentElement[],
): WorkPackage {
  return { ...pkg, elements: pkg.elements.filter((e) => !removed.includes(e)) }
}

export function withTrainingItem(pkg: WorkPackage, itemId: string): WorkPackage {
  return { ...pkg, trainingItems: [...pkg.trainingItems, itemId] }
}

/* ==================================================================== *
 * THE TWO VERIFICATION ACTS — and they are not the same act.
 * ==================================================================== */

/**
 * `SEQ-013` step 3, L68396: "The platform, checking the package before it is
 * publishable, verifies that the specification limits, the severity mappings,
 * the gate rules and the deviation-capture forms are all present. If any were
 * missing the package could not be built and the version could not be
 * distributed."
 *
 * FOUR elements, the source's own four — narrower than the integrity set
 * below, because this act runs BEFORE the build and gates whether a VERSION
 * is distributable at all. L68465: "`Versioned` and `Distributable` are
 * different states, so a version can exist in history without ever having
 * been safe to run."
 */
export const COMPLETENESS_REQUIRED_ELEMENTS = [
  'specification-limits',
  'severity-mappings',
  'gate-rules',
  'deviation-capture-forms',
] as const satisfies readonly PackageContentElement[]

export interface CompletenessVerdict {
  /** The D21 flag, attached where the source attaches it — to the VERSION. */
  readonly distributable: boolean
  readonly missing: readonly PackageContentElement[]
  readonly statement: string
}

export function verifyCompleteness(pkg: WorkPackage): CompletenessVerdict {
  const missing = COMPLETENESS_REQUIRED_ELEMENTS.filter((e) => !manifestContains(pkg, e))
  return {
    distributable: missing.length === 0,
    missing,
    statement:
      missing.length === 0
        ? `Version ${pkg.pinnedVersion} is Distributable: the specification limits, the severity mappings, the gate rules and the deviation-capture forms are all present.`
        : `Version ${pkg.pinnedVersion} is Versioned but not Distributable — ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing, so the package could not be built and the version could not be distributed.`,
  }
}

/**
 * The run-critical contents — everything except the storage-conditional
 * coaching assets. Each of these carries the card's own "no role may exclude
 * them" and the quarantine consequence (`FUNC-STU-14-01-A-2`,
 * `FUNC-STU-14-01-A-3`, L33846-L33847): "their absence is a package integrity
 * failure and the package is quarantined, never delivered partial."
 *
 * Coaching is deliberately NOT here. `FUNC-STU-14-01-B-1` (L33850): "where
 * storage forces omission, the omission is reported and the run proceeds,
 * because coaching is assistance rather than enforcement."
 */
export const INTEGRITY_REQUIRED_ELEMENTS = PACKAGE_CONTENT_ELEMENTS.filter(
  (e): e is Exclude<PackageContentElement, 'coaching-defaults'> => e !== 'coaching-defaults',
)

/** L31322, quoted, because a quarantine that destroys is a different thing. */
export const QUARANTINE_MEANING =
  'Quarantine, in simple words, means the suspect item is set aside where it cannot be used but ' +
  'is not destroyed, so it can be inspected; it matters because silently discarding a bad ' +
  'package would hide a distribution fault.'

export interface IntegrityVerdict {
  /**
   * The state the package is in. NEVER `Delivered` on a failure, and never
   * `Quarantined` either — that is a flag, not a member of the enumeration
   * (D21, L33839).
   */
  readonly state: PackageState
  readonly quarantined: boolean
  readonly delivered: boolean
  /** L31322 — set aside, not destroyed. Always false, and asserted. */
  readonly destroyed: boolean
  /** `TEST-STU-126` — the failing element is NAMED, never a bare refusal. */
  readonly failingElements: readonly string[]
  readonly statement: string
}

/**
 * L33839 and L32918. Two failure sources, one verdict:
 *
 * - a training item in the package — `AC-STU-080` (L32922, L32918): "On restoration,
 *   package definitions are re-verified to confirm no training item was
 *   included; any inclusion is treated as a package integrity failure and the
 *   package is quarantined rather than delivered";
 * - a missing run-critical element — because "a package without severity
 *   mappings could omit a hold".
 */
export function verifyIntegrity(pkg: WorkPackage): IntegrityVerdict {
  const failingElements = [
    ...INTEGRITY_REQUIRED_ELEMENTS.filter((e) => !manifestContains(pkg, e)),
    ...pkg.trainingItems,
  ]
  const quarantined = failingElements.length > 0
  return {
    state: quarantined ? 'Built' : 'Delivered',
    quarantined,
    delivered: !quarantined,
    destroyed: false,
    failingElements,
    statement: quarantined
      ? `Package ${pkg.packageId} failed integrity verification on ${failingElements.join(', ')}. It is quarantined and is never Delivered; the Run cannot start on ${pkg.deviceId}. ${QUARANTINE_MEANING}`
      : `Package ${pkg.packageId} passed integrity verification and was delivered to ${pkg.deviceId} before the shift.`,
  }
}

/* ==================================================================== *
 * OFFLINE SEVERITY — stated correctly, once (R10).
 * ==================================================================== */

/**
 * L33801, the superseding statement. The discovery-stage description this
 * replaces is a DEFECT if it reappears in any delivered artefact (L33803,
 * `AC-STU-030`, `AC-STU-126`) — which is why the superseded sentence is not
 * quoted here, not even to disown it. The covering test scans this module's
 * own source and its rendered markup for it.
 */
export const OFFLINE_SEVERITY_STATEMENT =
  'Severity classification is on-device, at the moment of capture — always, including fully ' +
  'offline. A Severity 1 classification places the lot hold at once, on the device, without ' +
  'waiting for connectivity. What waits for reconnection is delivery: escalation notifications ' +
  'route to the people on shift, and the server-side record is written, at sync. Server-side ' +
  'atoms mirror the on-device classification; they are never the trigger.'

/** L33803 — the supersession itself, stated without repeating what it supersedes. */
export const SUPERSESSION_NOTE =
  'The discovery-stage description of offline deviations is explicitly superseded by Part V: ' +
  'evaluation happens at capture, and only escalation delivery happens at sync. Any delivered ' +
  'artefact repeating the superseded description is a defect (AC-STU-030, AC-STU-126).'

/* ==================================================================== *
 * THE PIN, AND THE MANIFEST SB-STU-17 DESCRIBES.
 * ==================================================================== */

/** `SB-STU-17` (L33905), the line the manifest reads, verbatim. */
export const PINNING_LINE =
  'This Run executes this package. A newer published version does not change it.'

export interface ManifestLine {
  readonly label: string
  readonly value: string
}

/**
 * `AC-STU-127` — by asset NAME. A count or a category here is the defect the
 * criterion exists to prevent, so the names are the value and there is no
 * summary form of this function.
 */
export function coachingOmissionLines(pkg: WorkPackage): readonly string[] {
  if (pkg.coachingOmittedForStorage.length === 0) {
    return ['No coaching asset was omitted for storage on this device.']
  }
  return pkg.coachingOmittedForStorage.map(
    (name) => `${name} — omitted for device storage. Named, never silently dropped.`,
  )
}

/**
 * `SB-STU-17`'s own field list (L33905): "the pinned Workflow version, the
 * locale, the difficulty levels carried, the count of screens, the presence
 * of specification limits and gate rules, the severity mappings with their
 * catalog levels and tenant action bundles, the deviation-capture forms, and
 * the coaching assets included with any storage-driven omission listed
 * explicitly by asset name."
 *
 * `pinnedVersion` is read straight off the record. `newerPublishedVersion` is
 * NOT consulted — the pin is what the Run was assigned, and resolving it
 * through anything else is how a manifest starts reporting the newest version
 * instead of the pinned one.
 */
export function packageManifestLines(pkg: WorkPackage): readonly ManifestLine[] {
  const presence = (present: boolean, items: readonly string[]): string =>
    present ? `Present — ${items.join('; ')}` : 'Absent — this package would not verify'

  return [
    {
      label: 'Pinned Workflow version',
      value: `${pkg.pinnedVersion}, pinned to ${pkg.runId} on ${pkg.deviceId}`,
    },
    { label: 'Run locale', value: pkg.locale },
    {
      label: 'Difficulty levels carried',
      value: `${pkg.difficultyLevels.join(', ')} — all levels, under DEC-WIDIFF-001’s interim rule`,
    },
    { label: 'Screens', value: `${pkg.screenCount}` },
    {
      label: 'Specification limits and gate rules',
      value: presence(
        manifestContains(pkg, 'specification-limits') && manifestContains(pkg, 'gate-rules'),
        pkg.specificationLimits,
      ),
    },
    {
      label: 'Severity mappings, catalog levels and tenant action bundles',
      value: presence(manifestContains(pkg, 'severity-mappings'), [
        ...pkg.severityCatalogLevels,
        ...pkg.tenantActionBundles,
      ]),
    },
    {
      label: 'Deviation-capture forms',
      value: presence(manifestContains(pkg, 'deviation-capture-forms'), pkg.deviationCaptureForms),
    },
    { label: 'Coaching assets included', value: pkg.coachingIncluded.join(', ') },
    { label: 'Coaching omitted for storage', value: coachingOmissionLines(pkg).join(' ') },
  ]
}

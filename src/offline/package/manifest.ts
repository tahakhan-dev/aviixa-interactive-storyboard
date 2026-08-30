/**
 * THE PROPOSED PACKAGE MANIFEST — §35.3, "The package manifest", heading at
 * L79247.
 *
 * ── READ THIS BEFORE YOU USE ANYTHING BELOW ────────────────────────────────
 * L79253 opens the section, and it is the whole reason this file exists in the
 * shape it does. Quoted whole, tags and all, because the tags are the half
 * that says what IS contractual:
 *
 *   "**The Statement of Work does not define a manifest schema.** It names
 *   package contents `[SoW Fact — §5.14.1]`, per-run pinning `[SoW Fact —
 *   §5.14.1, §7.10.6]`, and the per-device package inventory with per-run
 *   pinned versions as platform telemetry `[SoW Fact — §8.13.2]`, but it
 *   defines no fields, no format, no signature, no checksum and no
 *   compatibility contract. Everything in this section is therefore
 *   `Recommendation — R&D`, and the schema's ratification is raised as
 *   `DEC-PKGMAN-001`, a new decision."
 *
 * So the twenty-two fields transcribed here are A PROPOSAL AWAITING
 * RATIFICATION, not product fact. L79334 says the same again — "The
 * twenty-two-field manifest, the entity model, the verification behaviour and
 * the rendering proposal are `Recommendation — R&D`" — and `DEC-PKGMAN-001`
 * (L79652) is the decision that would ratify it.
 *
 * ── AND THIS BUILD ALREADY SHIPS A DIFFERENT PACKAGE MANIFEST ──────────────
 * `ManifestLine` in `@/studio/modules/stu-14/package` is a rendered view: nine
 * label-and-value lines built from `SB-STU-17`'s own contents list (L33905) —
 * pinned version, locale, difficulty levels, screen count, and the presence of
 * each content class. It is on a screen a client is reviewing, and every one
 * of its lines is `SoW Fact`.
 *
 * THE TWO OBJECTS ARE NOT THE SAME OBJECT AND NEITHER REPLACES THE OTHER.
 *   - Replacing the Studio view with these twenty-two fields would put an
 *     unratified R&D proposal on that screen as though the source had settled
 *     it. Nothing here is imported by the Studio and nothing here renders.
 *   - Holding only the Studio view loses signature, checksum, expiry,
 *     minimum application version, the revocation handle and the tenant, site,
 *     area and job scope — which are precisely the fields §35.6's integrity
 *     rules (L79579-L79591) key their failure classes on. Task 11 builds those
 *     and reads this transcription.
 *
 * THEY ARE KEPT APART BY THE TYPES RATHER THAN BY A CONVENTION.
 * `ProposedManifestField` and `ManifestLine` share no property name at all, so
 * assignment fails in BOTH directions and no amount of spreading launders one
 * into the other. The covering suite pins that with `@ts-expect-error` so the
 * separation goes red if a later edit gives either type the other's shape.
 *
 * ── THREE FIELD COUNTS FOR ONE MANIFEST ────────────────────────────────────
 * The source proposes this manifest TWICE, in two chapters, and the two
 * proposals differ. All three numbers were counted out of the frozen source:
 *
 *     24   fields, §33.4 "The Complete Package Manifest" (L77510), one bolded
 *          heading each across L77526-L77582
 *     22   rows, §35.3's table                              L79261-L79282
 *     21   rows, §33.4's own "at a glance" summary table    L77611-L77631
 *
 * §35.3 drops exactly two of §33.4's fields — "Location identifier where the
 * tenant's hierarchy includes it" (L77532) and "Qualification gate posture and
 * clearance duration" (L77544) — and says nothing about dropping them. §33.4's
 * summary reaches 21 by folding site, area and location into one row (L77612)
 * and job and run into another (L77613). `MANIFEST_FIELD_COUNTS` records all
 * three with their locators and NONE is asserted as the count; this file
 * transcribes §35.3's twenty-two because that is the table `DEC-PKGMAN-001`
 * names, and `FIELDS_ONLY_IN_CHAPTER_33` names the two that fall out.
 *
 * ── PACKAGE SIGNING IS NOT A BASELINE HERE, AND IT IS CLASSIFIED THREE WAYS ─
 * `PACKAGE_SIGNING_CLASSIFICATIONS` carries all three readings and chooses
 * none. Nothing in this file or in `lifecycle.ts` treats a package as trusted
 * because it is signed, and `Signature` is one of the twenty-two proposed
 * fields rather than a property any record here holds.
 *
 * DETERMINISM: no clock, no random source, no module-level mutable state. This
 * module is data plus two total functions over it.
 */
import type { DecisionReading } from '@/disclosure/decisions'

/* ── the honest statement, and the classification it fixes ─────────────── */

/** L79253, the section's own opening claim. */
export const MANIFEST_SCHEMA_ABSENCE =
  'The Statement of Work does not define a manifest schema.'

/**
 * L79253 and L79334 both. Every field below carries it; there is deliberately
 * no per-field classification column, because the source gives the whole
 * section one classification and a per-field one would invite a reader to
 * think some fields are firmer than others.
 */
export const PROPOSED_MANIFEST_CLASSIFICATION = 'Recommendation — R&D'

/* ── the twenty-two-field table, L79259-L79282 ─────────────────────────── */

/** The four columns of L79259, in the source's own order. */
export const MANIFEST_COLUMNS = [
  'Field',
  'Purpose',
  'Justification',
  'Client decision required',
] as const

export type ManifestColumn = (typeof MANIFEST_COLUMNS)[number]

/**
 * Ids are the slug of the source's own `Field` cell — lowercased, every run of
 * non-alphanumeric characters folded to one hyphen. Derivable, so the suite
 * re-derives all twenty-two from the source rather than reading them back.
 */
export type ProposedManifestFieldId =
  | 'tenant-identifier'
  | 'site-identifier'
  | 'area-identifier'
  | 'job-identifier'
  | 'run-identifier'
  | 'worker-or-role-applicability'
  | 'qualification-requirements'
  | 'workflow-version'
  | 'work-instruction-version'
  | 'specification-version'
  | 'evaluation-version'
  | 'content-and-library-versions'
  | 'package-version'
  | 'package-creation-time'
  | 'effective-time'
  | 'expiry'
  | 'signature'
  | 'checksum'
  | 'minimum-application-version'
  | 'artificial-intelligence-and-model-compatibility-where-relevant'
  | 'revocation-identifier'
  | 'dependencies'

/**
 * One row of §35.3's table. Note what is NOT here: a value. No package in this
 * build carries a manifest, because the schema is unratified and a record with
 * twenty-two populated properties is exactly how a proposal starts being
 * rendered as a fact.
 */
export interface ProposedManifestField {
  readonly id: ProposedManifestFieldId
  readonly line: number
  readonly cells: Readonly<Record<ManifestColumn, string>>
}

export const PROPOSED_MANIFEST_FIELDS = [
  {
    id: 'tenant-identifier',
    line: 79261,
    cells: {
      Field: 'Tenant identifier',
      Purpose: 'Binds the package to one tenant',
      Justification:
        'Cross-tenant data isolation is a platform-fixed invariant; a package that could be applied under another tenant is an isolation breach',
      'Client decision required': 'No — enforces an existing invariant `[SoW Fact — §1.5]`',
    },
  },
  {
    id: 'site-identifier',
    line: 79262,
    cells: {
      Field: 'Site identifier',
      Purpose: 'Binds to the facility and timezone anchor',
      Justification:
        'The Site is the timezone and shift anchor; shift-relative behaviour and provenance depend on it',
      'Client decision required': 'No — `[SoW Fact — §2.1, §2.6]`',
    },
  },
  {
    id: 'area-identifier',
    line: 79263,
    cells: {
      Field: 'Area identifier',
      Purpose: 'Binds to the line or functional zone',
      Justification:
        'Scope is Tenant, Site and Area, held simultaneously; qualification scope carries per-Area across sites',
      'Client decision required': 'No — `[SoW Fact — §2.8, §3.5]`',
    },
  },
  {
    id: 'job-identifier',
    line: 79264,
    cells: {
      Field: 'Job identifier',
      Purpose: 'Binds to the standing work definition',
      Justification:
        'The Job holds shift timings, unit mode and qualification requirements the package must match',
      'Client decision required': 'No — `[SoW Fact — §2.2]`',
    },
  },
  {
    id: 'run-identifier',
    line: 79265,
    cells: {
      Field: 'Run identifier',
      Purpose: 'The pinning key',
      Justification:
        'The package is pinned per run; without the run identifier there is no pin',
      'Client decision required': 'No — `[SoW Fact — §5.14.1]`',
    },
  },
  {
    id: 'worker-or-role-applicability',
    line: 79266,
    cells: {
      Field: 'Worker or role applicability',
      Purpose: 'States who the package is valid for',
      Justification:
        "Assignment is to the logged-in identity's own work; the app is scoped to that identity",
      'Client decision required': 'No — `[SoW Fact — §7.1.5, §7.6]`',
    },
  },
  {
    id: 'qualification-requirements',
    line: 79267,
    cells: {
      Field: 'Qualification requirements',
      Purpose: 'The requirements the gate evaluates',
      Justification: 'The gate is enforced locally, so the requirement must be local',
      'Client decision required': 'No — `[SoW Fact — §7.13.1]`',
    },
  },
  {
    id: 'workflow-version',
    line: 79268,
    cells: {
      Field: 'Workflow version',
      Purpose: 'The pinned authored unit of truth',
      Justification:
        "A run finishes on the version it started on; this field is the pin's evidence",
      'Client decision required': 'No — `[SoW Fact — §7.10.6]`',
    },
  },
  {
    id: 'work-instruction-version',
    line: 79269,
    cells: {
      Field: 'Work Instruction version',
      Purpose: "The instruction content version, which may differ from the workflow's",
      Justification:
        "Instruction text on a worker's screen must always be released, approved content, and must be provable as such",
      'Client decision required': 'No — `[SoW Fact — §7.7.4]`',
    },
  },
  {
    id: 'specification-version',
    line: 79270,
    cells: {
      Field: 'Specification version',
      Purpose: 'The limit set in force',
      Justification:
        'The version number is the audit receipt for which limits were in force for which run',
      'Client decision required': 'No — `[SoW Fact — §3.8]`',
    },
  },
  {
    id: 'evaluation-version',
    line: 79271,
    cells: {
      Field: 'Evaluation version',
      Purpose: 'The evaluation scenarios the packaged behaviour passed',
      Justification:
        'The evaluation gate is hard, always, and binds every operator including the root',
      'Client decision required': 'No — `[SoW Fact — §3.1]`',
    },
  },
  {
    id: 'content-and-library-versions',
    line: 79272,
    cells: {
      Field: 'Content and library versions',
      Purpose: 'The referenced shared blocks and library assets',
      Justification:
        'Library edits propagate immediately to referencing screens while packages are pinned; the manifest is where that tension becomes visible',
      'Client decision required': '**Yes — `DEC-LIB-001`**, treated in Section 35.7',
    },
  },
  {
    id: 'package-version',
    line: 79273,
    cells: {
      Field: 'Package version',
      Purpose: "The artefact's own version, distinct from content versions",
      Justification:
        'Two packages can carry identical content and differ in assembly; regeneration must be distinguishable',
      'Client decision required': 'No — assembly hygiene',
    },
  },
  {
    id: 'package-creation-time',
    line: 79274,
    cells: {
      Field: 'Package creation time',
      Purpose: 'When the artefact was assembled',
      Justification: 'Needed to reason about staleness and to order regenerations',
      'Client decision required': 'No — assembly hygiene',
    },
  },
  {
    id: 'effective-time',
    line: 79275,
    cells: {
      Field: 'Effective time',
      Purpose: 'When the package becomes usable',
      Justification:
        'Supports scheduled activation without implying device application; ties directly to the PENDING rule of Section 34.5',
      'Client decision required': '**Yes — scheduled activation semantics, `DEC-PKGEXP-001`**',
    },
  },
  {
    id: 'expiry',
    line: 79276,
    cells: {
      Field: 'Expiry',
      Purpose: 'When the package stops being usable',
      Justification:
        'Bounds how long a dark device may execute stale content; complements but does not duplicate the credential trust window',
      'Client decision required': '**Yes — `DEC-PKGEXP-001`**; no value may be invented',
    },
  },
  {
    id: 'signature',
    line: 79277,
    cells: {
      Field: 'Signature',
      Purpose: 'Proves the manifest and content were produced by the platform',
      Justification:
        'Without it, integrity validation reduces to detecting accidental corruption, not tampering',
      'Client decision required': '**Yes — `DEC-PKGMAN-001`** for algorithm and key custody',
    },
  },
  {
    id: 'checksum',
    line: 79278,
    cells: {
      Field: 'Checksum',
      Purpose: 'Detects accidental corruption of content independently of the signature',
      Justification:
        'A truncated download must be detectable cheaply before signature verification',
      'Client decision required': 'No — standard practice',
    },
  },
  {
    id: 'minimum-application-version',
    line: 79279,
    cells: {
      Field: 'Minimum application version',
      Purpose: 'The lowest application build that may execute this package',
      Justification:
        'Release channels and an app-version floor are platform-owned policy; a package using a newer screen element must not silently misrender on an older build',
      'Client decision required': 'No — `[SoW Fact — §8.13.1]`',
    },
  },
  {
    id: 'artificial-intelligence-and-model-compatibility-where-relevant',
    line: 79280,
    cells: {
      Field: 'Artificial-intelligence and model compatibility where relevant',
      Purpose: 'Which agent behaviours the package assumes',
      Justification:
        'Composed agents pass the evaluation gate; a package assuming a behaviour the tenant no longer has must be detectable. Note that no model executes on the device — the reasoning layer is server-side',
      'Client decision required':
        '**Yes — `DEC-AGENTLC-001`** for disablement and rollback of a deployed composed agent',
    },
  },
  {
    id: 'revocation-identifier',
    line: 79281,
    cells: {
      Field: 'Revocation identifier',
      Purpose: 'The handle by which this package can be withdrawn',
      Justification:
        'Revocation is undefined in the source; without an identifier a defective package cannot be recalled',
      'Client decision required': '**Yes — `DEC-PKGMAN-001`**',
    },
  },
  {
    id: 'dependencies',
    line: 79282,
    cells: {
      Field: 'Dependencies',
      Purpose: 'Other artefacts this package requires, such as a severity catalog version',
      Justification:
        'Makes an incompatible combination detectable at validation rather than at a gated step',
      'Client decision required': 'No — assembly hygiene',
    },
  },
] as const satisfies readonly ProposedManifestField[]

export function isProposedManifestFieldId(value: string): value is ProposedManifestFieldId {
  return PROPOSED_MANIFEST_FIELDS.some((f) => f.id === value)
}

export function manifestField(id: ProposedManifestFieldId): ProposedManifestField {
  const found = PROPOSED_MANIFEST_FIELDS.find((f) => f.id === id)
  if (found === undefined) throw new Error(`§35.3: no proposed manifest field "${id}".`)
  return found
}

/**
 * READ OFF THE CELL, never listed beside it. Sixteen of the twenty-two open
 * `No`; six open `Yes`. The cell is markdown, so the emphasis markers and
 * backticks come off first — and the verdict is taken from the FIRST WORD
 * rather than by asking whether the cell contains "Yes", because "No — ..."
 * cells cite `[SoW Fact — ...]` and a substring test would be answering a
 * different question.
 */
export function requiresClientDecision(field: ProposedManifestField): boolean {
  const cell = field.cells['Client decision required'].replace(/[*`]/g, '').trimStart()
  return /^Yes\b/.test(cell)
}

/**
 * The decision identifiers named inside a field's own cell. Four distinct
 * decisions across the six fields that need one: `DEC-LIB-001` (L79272),
 * `DEC-PKGEXP-001` (L79276) twice, `DEC-PKGMAN-001` (L79277) twice, and
 * `DEC-AGENTLC-001` (L79280). The effective-time cell names its subject in
 * words before its identifier, so this reads identifiers rather than assuming
 * the cell's shape.
 */
export function decisionRefsOf(field: ProposedManifestField): readonly string[] {
  return [...field.cells['Client decision required'].matchAll(/DEC-[A-Z]+-\d+/g)].map((m) => m[0])
}

/* ── three counts for one manifest, none of them the count ─────────────── */

export interface ManifestFieldCount {
  readonly what: string
  readonly counted: number
  readonly locator: string
}

export const MANIFEST_FIELD_COUNTS = [
  {
    what: 'fields proposed in §33.4, one bolded heading each',
    counted: 24,
    locator: 'L77526-L77582; section heading L77510',
  },
  {
    what: 'rows in §35.3’s field-by-field table',
    counted: 22,
    locator: 'L79261-L79282; header L79259',
  },
  {
    what: '§33.4’s own at-a-glance summary rows',
    counted: 21,
    locator: 'L77611-L77631; header L77609',
  },
] as const satisfies readonly ManifestFieldCount[]

export interface DroppedField {
  /** The §33.4 heading, verbatim. */
  readonly heading: string
  readonly line: number
  readonly note: string
}

/**
 * The two fields §33.4 proposes and §35.3 does not carry. Recorded because a
 * reader comparing the chapters will find them missing and there is nothing in
 * §35.3 that says they were dropped or why — and both are enforcement fields
 * rather than hygiene ones, which is the reason this build declines to treat
 * either table as the complete one.
 */
export const FIELDS_ONLY_IN_CHAPTER_33 = [
  {
    heading: "Location identifier where the tenant's hierarchy includes it",
    line: 77532,
    note:
      '§35.3’s scope chain runs tenant, site, area, job, run and stops. §33.4 carries a Location ' +
      '(Cell) level between area and job, marked optional because hierarchy depth is the ' +
      'tenant’s choice, and its at-a-glance row folds site, area and location together.',
  },
  {
    heading: 'Qualification gate posture and clearance duration',
    line: 77544,
    note:
      '§35.3 carries “Qualification requirements” and no posture. §33.4 separates them because ' +
      'the posture — strict blocking or notify-only — is a tenant setting the device enforces ' +
      'offline, and a requirement without its posture does not say what the device does when the ' +
      'requirement fails.',
  },
] as const satisfies readonly DroppedField[]

/* ── package signing, classified three ways, none chosen ───────────────── */

/**
 * The source classifies package signing at three different strengths in three
 * different chapters. All three readings are carried and NONE is chosen,
 * because choosing would decide whether this build may treat a signature as a
 * trust baseline — and the source has not.
 *
 * The shape is the canon's own `DecisionReading`: two fields, and neither of
 * them is an answer.
 */
export const PACKAGE_SIGNING_CLASSIFICATIONS = [
  {
    text:
      'Reading one — Recommendation — R&D, and not specified in the Statement of Work. The storyboard catalog’s own status row: “Package signing and device-side verification | `Recommendation — R&D`; not specified in the Statement of Work | `DEC-PKGSIGN-001`”. §33.4 says the same of its whole manifest, and §35.3 says it of this one.',
    locator: 'L62220 · §33.4 L77518 · §35.3 L79253',
  },
  {
    text:
      'Reading two — Derived Clarification. The platform capability summary states signing as part of what the product does and classifies it that way outright: “Item 4’s version pinning is `SoW Fact — §7.10.6`; package signing is `Derived Clarification`.” The capability item itself repeats it, and the offline execution principle classifies verification the same way.',
    locator: 'L89249 · item 4 at L89180 · L91126',
  },
  {
    text:
      'Reading three — Not specified in the Statement of Work, carried as a client decision on TIMING rather than on existence: “Work-package signing | Not specified in the Statement of Work | Recommended; verification with quarantine | `DEC-SEC-015`”, whose own register entry reads “Work-package signing at V1 or later”.',
    locator: 'L104000 · L104048 · DEC-SEC-015 L105458',
  },
] as const satisfies readonly DecisionReading[]

/**
 * Stated once, here, so no later module has to re-derive it: nothing in this
 * build treats a signature as evidence of anything. The consequence the source
 * itself records for not signing is a named residual risk rather than a
 * silence — `RISK-SEC-06` at L105064 — and `TEST-SEC-605` (L104046) spells out
 * both branches: with the decision adopted the alteration is detected, without
 * it "the alteration is undetected — recorded explicitly as the residual risk".
 */
export const SIGNING_IS_NOT_A_BASELINE =
  'Package signing is not a baseline in this build. The source classifies it three different ' +
  'ways in three chapters and ratifies it in none, so a signature is a proposed manifest field ' +
  'here and never a reason to trust a package.'

/* ── the three decisions, disclosed locally ────────────────────────────── */

/**
 * WHY LOCALLY. The `DecisionId` union `@/disclosure/decisions` exports
 * contains none of these three. That file is another
 * task's path and one later task lifts the offline decisions all at once.
 * `Stu14LocalDisclosure` set the idiom and slice 7 and slice 8 followed it:
 * disclose in the canon's own shape, import `DecisionReading` rather than
 * redeclaring it, declare the gap on `canonNote`, and never file a decision
 * under a neighbouring identifier.
 *
 * BUILT TO EXPIRE. The covering suite reads the canon's exported `DecisionId`
 * union out of the file and asserts all three identifiers are ABSENT from it.
 * The moment any one is lifted, this module's suite goes red and forces the
 * switch.
 *
 * THREE RECORDS AND NOT ONE. `DEC-PKGSIGN-001` and `DEC-SEC-015` look like the
 * same question and are not: L61208 asks whether the package is signed and
 * verified at all, and L105458 asks whether signing lands at V1 or later.
 * Merging them would hide that the source raised one subject twice, in two
 * chapters, under two identifiers — which is itself part of what a client
 * ratifying either needs to see.
 */
export type PackageDecisionRef = 'DEC-PKGMAN-001' | 'DEC-PKGSIGN-001' | 'DEC-SEC-015'

export interface PackageManifestDisclosure {
  readonly decisionRef: PackageDecisionRef
  readonly question: string
  /** The canon's own reading shape, imported. Two fields, and neither is `answer`. */
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why this module is a place the decision has to be disclosed. */
  readonly whyHere: string
  /** Why it is disclosed locally rather than through the shared canon. */
  readonly canonNote: string
}

const CANON_NOTE =
  'The shared decision canon at @/disclosure/decisions carries no record keyed to this identifier — ' +
  'it is not a member of that file’s DecisionId union — and that file is ' +
  'another task’s path. Disclosed here in the canon’s own shape so it can be absorbed without a ' +
  'rewrite, and declared as a gap rather than filed under a neighbouring identifier.'

export const PACKAGE_MANIFEST_DISCLOSURES = [
  {
    decisionRef: 'DEC-PKGMAN-001',
    question:
      'Is the twenty-two-field manifest schema ratified, and with it the signature algorithm and key custody model, the re-pull retry bound, the effective-time semantics, and the mid-run revocation resolution where withdrawal conflicts with pinning?',
    readings: [
      {
        text:
          'The gap, in the source’s own words: “The Statement of Work does not define a manifest schema.” It names package contents, per-run pinning and the per-device package inventory as platform telemetry, “but it defines no fields, no format, no signature, no checksum and no compatibility contract.”',
        locator: 'L79253',
      },
      {
        text:
          'The proposal: a twenty-two-field manifest, each field with its justification, sixteen needing no client decision and six needing one. Its own summary states the classification — “The twenty-two-field manifest, the entity model, the verification behaviour and the rendering proposal are `Recommendation — R&D`.”',
        locator: 'L79261-L79282 · classification L79334',
      },
      {
        text:
          'The decision card names four contractual values inside the proposal rather than treating the schema as one question: “the signature algorithm and key custody model, the re-pull retry bound, the effective-time semantics, and the mid-run revocation resolution where withdrawal conflicts with pinning.”',
        locator: 'DEC-PKGMAN-001 L79652',
      },
      {
        text:
          'A second proposal exists and differs. §33.4 proposes twenty-four fields for the same manifest, including a Location identifier and a qualification gate posture that §35.3 does not carry, and its own summary table folds those twenty-four into twenty-one rows.',
        locator: 'L77510 · fields L77526-L77582 · summary L77611-L77631',
      },
      {
        text:
          'The source forbids inventing values in the meantime: “No expiry, effective-time or signature-algorithm value is hard-coded before `DEC-PKGMAN-001` and `DEC-PKGEXP-001` are decided.”',
        locator: 'AC-PKG-305 L79322',
      },
    ],
    adopted:
      'The twenty-two fields are TRANSCRIBED and none is populated. This build ships no manifest ' +
      'record, no expiry value, no effective time and no signature algorithm, which is what ' +
      'AC-PKG-305 requires of it before ratification. The Studio’s shipped manifest view is left ' +
      'exactly as slice 5 built it. Neither field count is asserted as the count and both are ' +
      'recorded with their locators. This is a client-delegated choice under APP-012, not a ' +
      'position the source settled; ratification sits with the client’s platform team, and the ' +
      'mid-run revocation question needs the Quality Manager’s owner alongside it.',
    whyHere:
      'This module IS the transcription of the unratified schema. A file that carried twenty-two ' +
      'fields without carrying the sentence that says the Statement of Work defines none of them ' +
      'would be presenting a proposal as a contract, on the one artefact a device is asked to ' +
      'trust before it executes a gated step.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-PKGSIGN-001',
    question:
      'Is the per-run work package cryptographically signed and verified on the device before execution?',
    readings: [
      ...PACKAGE_SIGNING_CLASSIFICATIONS,
      {
        text:
          'The decision’s own card states the gap: “Not specified in the Statement of Work. §7.10.1 states delivery and pinning; §7.11 states an app-managed encrypted store; neither states package integrity verification”.',
        locator: 'DEC-PKGSIGN-001 L61208',
      },
      {
        text:
          'And it records where the word “signed” came from, which is not the source: the assignment brief for the storyboard catalog “calls the package ‘signed,’ so signing is carried here as `Recommendation — R&D` under the new `DEC-PKGSIGN-001` rather than asserted as a source requirement.”',
        locator: 'L62107',
      },
    ],
    adopted:
      'No reading is chosen and signing is not a baseline. `Signature` is transcribed as one of ' +
      'the twenty-two proposed fields and nothing in this build treats a package as trusted ' +
      'because it carries one. A client-delegated choice under APP-012: until it is ratified, ' +
      'the residual risk the source itself names stands on the record rather than being closed ' +
      'by an implementation decision taken here.',
    whyHere:
      'Two of the twenty-two fields — signature and checksum — exist only under this decision, ' +
      'and the lifecycle’s Signing stage is one of the three the section marks proposed. A ' +
      'transcription that carried the fields without the classification conflict would let a ' +
      'reader conclude the source requires signing, which is the specific claim it declines to ' +
      'make in one chapter and makes in another.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-SEC-015',
    question: 'Does work-package signing land at V1 or later?',
    readings: [
      {
        text:
          'The security chapter’s control register puts it as a timing question rather than an existence one: “Work-package signing | Not specified in the Statement of Work | Recommended; verification with quarantine | `DEC-SEC-015`”, and the open-decision register reads “Work-package signing at V1 or later”.',
        locator: 'L104000 · DEC-SEC-015 L105458',
      },
      {
        text:
          'The recommendation attached to it is specific about the failure behaviour: a package failing verification is quarantined — “held aside, unusable, and visible, rather than deleted” — and the device continues on its last-known-good verified package for runs already pinned to it.',
        locator: 'L103928',
      },
      {
        text:
          'Both branches are written down rather than one: “With `DEC-SEC-015` adopted: verification fails, package quarantined, incident raised. Without it: the alteration is undetected — recorded explicitly as the residual risk `RISK-SEC-06`.”',
        locator: 'TEST-SEC-605 L104046 · RISK-SEC-06 L105064',
      },
    ],
    adopted:
      'Neither branch is taken and no V1 commitment is made here. A client-delegated choice under ' +
      'APP-012. The undetected-alteration branch is the one that holds while the decision is ' +
      'open, and it is named rather than left implicit — which is the only honest position for a ' +
      'build that ships no signing.',
    whyHere:
      'This is the same subject as DEC-PKGSIGN-001 raised in a second chapter under a second ' +
      'identifier, and a client ratifying one without seeing the other would be ratifying half a ' +
      'question. Disclosing it here is what makes the duplication visible.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly PackageManifestDisclosure[]

/**
 * PACKAGE INTEGRITY, REVOCATION, REPLACEMENT, ROLLBACK AND INCOMPATIBLE
 * VERSIONS — §35.6 of the frozen source, opening at L79512, plus the open
 * decisions of §35.7, opening at L79616.
 *
 * ── THE COUNT, MEASURED RATHER THAN CARRIED ────────────────────────────────
 * The dispatch that produced this file asserted "the failure table — 15 rows,
 * six columns" and "fifteen data rows from L79581". THE TABLE HAS ELEVEN DATA
 * ROWS. Header at L79579, separator at L79580, data at L79581 through L79591,
 * and the line after the body is blank — deliberately not spelled, because
 * `tests/coverage/locator-fidelity.test.ts` lexes any L-number in a comment as
 * a citation and a blank line states nothing, so naming one even to call it
 * blank files a knowingly-false citation. It caught this comment doing exactly
 * that. Every one of the thirteen table lines splits into exactly six cells. The source makes no count claim of its own for this table — the words
 * "fifteen" and "eleven" both occur zero times in §35.6 — so the fifteen was
 * the controller's, not a source contradiction to preserve. `FAILURE_TABLE_SHAPE`
 * carries the measured shape and the suite re-counts it from the source.
 *
 * ── THE THREE GROUPS THE ELEVEN ROWS FALL INTO ─────────────────────────────
 * Rows 1-5 are the verification gauntlet's five checks, in the diagram's own
 * order. Rows 6-8 are revocation, which is not a gauntlet check at all — it
 * arrives out of band on the command channel. Rows 9-11 are normal paths whose
 * terminal safe state cell opens `Not applicable`.
 *
 * ── REVOCATION IS THREE ROWS AND THEY ARE NOT COLLAPSIBLE ──────────────────
 * L79586, L79587, L79588. Three detections, three device responses. But the
 * dispatch also said "three terminal safe states", and there are TWO: L79586
 * and L79587 both read `Run not enterable`, and only L79588 reads `Run stopped,
 * work preserved`. The oversight display splits the same way — L79586 and
 * L79587 are both `Run shown as withdrawn`. The rows stay separate because
 * their DETECTION and DEVICE RESPONSE differ, which is the real reason, and
 * `distinctCells` lets the suite count the collapse rather than assert it.
 *
 * ── THE TAMPERING ROW DEPENDS ON A PROPOSAL THAT IS NOT RATIFIED ───────────
 * L79582's detection is `Signature verification failure`, which presumes the
 * package is signed. Signing is not a V1 fact, and the source classifies it
 * BOTH ways in different chapters:
 *
 *   L89249 — "package signing is `Derived Clarification`"
 *   L89180 — "The package is signed and integrity-checked before use."
 *   L81164 — `OFF-BLK-03`'s row, whose status cell is `Derived Clarification`
 *   L77447 — "Signing and integrity validation are not specified in the
 *             Statement of Work."
 *   L79652 — "The source defines no manifest, no signature, no revocation
 *             mechanism and no retry bound."
 *   L79787 — "Twenty-two-field manifest, signing, verification gauntlet"
 *             classified `Recommendation — R&D`, ratification under
 *             `DEC-PKGMAN-001`
 *   L61208 — `DEC-PKGSIGN-001`, "Not specified in the Statement of Work"
 *   L105458 — `DEC-SEC-015`, "Work-package signing at V1 or later"
 *
 * BOTH READINGS STAND AND NEITHER IS CHOSEN. The row ships as the source
 * writes it, and it is neither deleted nor softened. What this module refuses
 * to do is make signing a baseline: `verifyPackage` takes the signature result
 * from its caller and has no default for it, so nothing here asserts a package
 * IS signed.
 *
 * THE CLASSIFICATIONS THEMSELVES ARE NOT SPELLED TWICE. This file carried its
 * own copy of the list above as a constant and it was deleted:
 * `src/offline/package/manifest.ts` landed mid-slice having reached the same
 * reading independently, and it is the module that transcribes the `Signature`
 * field rather than merely reading it. `TAMPERING_DETECTION_DEPENDENCY` points
 * at its `PACKAGE_SIGNING_CLASSIFICATIONS` and `SIGNING_IS_NOT_A_BASELINE`,
 * and types the three decisions against its own `PackageDecisionRef` union so
 * dropping one there stops compiling here.
 *
 * ── FAIL CLOSED, WHICH IS A TYPE DECISION HERE, NOT A COMMENT ──────────────
 * L79593: "the activation path requires a positive verification result rather
 * than the absence of a negative one". `AC-PKG-602` at L79600 states it as a
 * criterion. So `verifyPackage` takes a TOTAL `Record` over the five checks —
 * a caller cannot omit one — and blocks on anything that is not exactly
 * `passed`, including `unavailable`, which is the disabled verifier of
 * `TEST-PKG-601` at L79608.
 *
 * ── NO RETRY BOUND, NO EXPIRY VALUE, NO VALIDITY HORIZON ───────────────────
 * `AC-PKG-606` at L79604: "No retry bound, expiry value or validity horizon is
 * implemented before its decision is taken." L79523 puts the bound under
 * `DEC-PKGMAN-001`; L79585's own status cell is
 * `Client Decision Required — DEC-PKGEXP-001`. So no number for either appears
 * anywhere below, and the suite greps this file to keep it that way.
 *
 * ── A GAP THIS MODULE FOUND AND DOES NOT CLOSE ─────────────────────────────
 * L79588's terminal safe state preserves and QUARANTINES the captured work.
 * The quarantine register that defines what a quarantine record may be opened
 * for is §36.5's, at L80389-L80398, and none of its ten reasons is a revoked
 * or withdrawn package. So the row names a mechanism whose own register cannot
 * express its case. Recorded as `REVOCATION_QUARANTINE_GAP`, not patched: the
 * ten reasons are `@/offline/quarantine`'s closed set and inventing an
 * eleventh here would be a second spelling of someone else's vocabulary.
 *
 * ── WHAT TASK 9 WAS TO REPORT, DERIVED HERE INSTEAD ────────────────────────
 * `src/offline/package/manifest.ts` had not landed when the gauntlet was
 * written, so the manifest fields each check reads are cited directly off
 * §35.3's twenty-two-field table (header L79259, rows L79261-L79282) and
 * carried on each `VERIFICATION_GAUNTLET` step, where the suite opens every
 * one. THE ANSWER IS THAT NOTHING IS LACKING: all eleven fields the five
 * checks need — checksum, signature, the six scope identifiers, the minimum
 * application version, effective time and expiry — are present in the proposed
 * twenty-two. The dependency is not a missing field, it is that the whole
 * schema is unratified under `DEC-PKGMAN-001`.
 */
import type { DecisionId, DecisionReading } from '@/disclosure/decisions'
import { packageIsEnterable, type PackageStaging } from '@/offline/package/delivery'
import {
  PACKAGE_SIGNING_CLASSIFICATIONS,
  SIGNING_IS_NOT_A_BASELINE,
  type PackageDecisionRef,
} from '@/offline/package/manifest'

/* ── the six columns, header-keyed off L79579 ──────────────────────────── */

export const FAILURE_TABLE_COLUMNS = [
  'Failure class',
  'Detection',
  'Device response',
  'Oversight display',
  'Terminal safe state',
  'Source status',
] as const

export type FailureTableColumn = (typeof FAILURE_TABLE_COLUMNS)[number]

/**
 * THE SOURCE NAMES NO IDENTIFIER FOR THESE ELEVEN ROWS, so these keys are this
 * build's, in the source's row order, and are never presented as the source's.
 * They are deliberately not written in the document's `XXX-NN` identifier
 * shape, for the reason `@/offline/quarantine` gives: a minted identifier
 * beside a line number reads as a frozen-source anchor when there is nothing
 * in the source to anchor to.
 */
export type FailureClassId =
  | 'accidental-corruption'
  | 'tampering'
  | 'scope-mismatch'
  | 'incompatible-application-version'
  | 'expiry'
  | 'revocation-before-staging'
  | 'revocation-after-staging-run-not-started'
  | 'revocation-after-staging-run-in-flight'
  | 'replacement'
  | 'rollback'
  | 'deletion-of-local-footprint'

/** The five worker-facing rejection messages of L79567-L79573. */
export type RejectionMessageId =
  | 'corrupt'
  | 'tampered'
  | 'scope-mismatch'
  | 'incompatible-version'
  | 'expired-or-revoked'

export interface FailureTableRow {
  readonly id: FailureClassId
  /** The frozen-source line this row is transcribed from. */
  readonly line: number
  /** Total over the six columns: a blank cell cannot be written. */
  readonly cells: Readonly<Record<FailureTableColumn, string>>
  /**
   * Which of the five rejection messages this row shows the worker, or `null`
   * where the row is not a rejection at all. ELEVEN ROWS FAN IN TO FIVE
   * MESSAGES: rows 1-4 take one each, rows 5-8 — expiry and all three
   * revocations — share `Expired or revoked` at L79573, and rows 9-11 have no
   * message because nothing is refused.
   */
  readonly rejectionMessage: RejectionMessageId | null
}

export const FAILURE_TABLE = [
  {
    id: 'accidental-corruption',
    line: 79581,
    cells: {
      'Failure class': 'Accidental corruption',
      Detection: 'Checksum mismatch',
      'Device response': 'Bounded re-pull',
      'Oversight display': 'Package-readiness failure with retry count',
      'Terminal safe state': 'Run not enterable after the bound',
      'Source status': '`Recommendation — R&D`; retry bound `Client Decision Required`',
    },
    rejectionMessage: 'corrupt',
  },
  {
    id: 'tampering',
    line: 79582,
    cells: {
      'Failure class': 'Tampering',
      Detection: 'Signature verification failure',
      'Device response': 'Reject permanently and raise a security event',
      'Oversight display':
        'Security event on the Super Admin console; package-readiness failure to the tenant',
      'Terminal safe state': 'Run not enterable',
      'Source status': '`Recommendation — R&D` grounded in §8.7.4',
    },
    rejectionMessage: 'tampered',
  },
  {
    id: 'scope-mismatch',
    line: 79583,
    cells: {
      'Failure class': 'Scope mismatch',
      Detection: 'Manifest scope fields do not match the device assignment',
      'Device response': 'Reject permanently and raise an isolation event',
      'Oversight display': 'Isolation event; cross-tenant isolation is an enforced invariant',
      'Terminal safe state': 'Run not enterable',
      'Source status': '`Recommendation — R&D` grounded in §1.5',
    },
    rejectionMessage: 'scope-mismatch',
  },
  {
    id: 'incompatible-application-version',
    line: 79584,
    cells: {
      'Failure class': 'Incompatible application version',
      Detection: 'Installed build below the manifest minimum',
      'Device response': 'Reject and state the upgrade requirement',
      'Oversight display': 'App-version-against-floor telemetry already exists',
      'Terminal safe state': 'Run not enterable until upgrade',
      'Source status': '`Recommendation — R&D` grounded in §8.13.1',
    },
    rejectionMessage: 'incompatible-version',
  },
  {
    id: 'expiry',
    line: 79585,
    cells: {
      'Failure class': 'Expiry',
      Detection: 'Validity horizon passed',
      'Device response': 'Reject and request replacement',
      'Oversight display': 'Package-readiness failure',
      'Terminal safe state': 'Run not enterable',
      'Source status': '`Client Decision Required — DEC-PKGEXP-001`',
    },
    rejectionMessage: 'expired-or-revoked',
  },
  {
    id: 'revocation-before-staging',
    line: 79586,
    cells: {
      'Failure class': 'Revocation before staging',
      Detection: 'Revocation arrives before download',
      'Device response': 'Do not download',
      'Oversight display': 'Run shown as withdrawn',
      'Terminal safe state': 'Run not enterable',
      'Source status': '`Recommendation — R&D`',
    },
    rejectionMessage: 'expired-or-revoked',
  },
  {
    id: 'revocation-after-staging-run-not-started',
    line: 79587,
    cells: {
      'Failure class': 'Revocation after staging, run not started',
      Detection: 'Revocation arrives while idle',
      'Device response': 'Deactivate and mark withdrawn',
      'Oversight display': 'Run shown as withdrawn',
      'Terminal safe state': 'Run not enterable',
      'Source status': '`Recommendation — R&D`',
    },
    rejectionMessage: 'expired-or-revoked',
  },
  {
    id: 'revocation-after-staging-run-in-flight',
    line: 79588,
    cells: {
      'Failure class': 'Revocation after staging, run in flight',
      Detection: 'Revocation arrives mid-run',
      'Device response': 'Stop at the current step; preserve and quarantine captured work',
      'Oversight display': 'Quality Manager disposition item raised',
      'Terminal safe state': 'Run stopped, work preserved',
      'Source status':
        '`Recommendation — R&D`; conflicts with pinning, folded into `DEC-PKGMAN-001`',
    },
    rejectionMessage: 'expired-or-revoked',
  },
  {
    id: 'replacement',
    line: 79589,
    cells: {
      'Failure class': 'Replacement',
      Detection: 'A newer package exists for future runs',
      'Device response': 'Stage for future runs only',
      'Oversight display': 'Pinned version unchanged for in-flight runs',
      'Terminal safe state': '`Not applicable — replacement is the normal path`',
      'Source status': '`SoW Fact — §7.10.6`',
    },
    rejectionMessage: null,
  },
  {
    id: 'rollback',
    line: 79590,
    cells: {
      'Failure class': 'Rollback',
      Detection: 'A corrected version republished',
      'Device response': 'Treated as a normal new version',
      'Oversight display': 'Version history shows both',
      'Terminal safe state': '`Not applicable — rollback is a forward publication`',
      'Source status': '`Derived Clarification` from §5.12.1',
    },
    rejectionMessage: null,
  },
  {
    id: 'deletion-of-local-footprint',
    line: 79591,
    cells: {
      'Failure class': 'Deletion of local footprint',
      Detection: 'Complete-and-synced with confirmed receipt',
      'Device response': 'Release storage',
      'Oversight display': 'Package inventory updates',
      'Terminal safe state': '`Not applicable — deletion is the normal end state`',
      'Source status': '`SoW Fact — §7.10.7`',
    },
    rejectionMessage: null,
  },
] as const satisfies readonly FailureTableRow[]

const FAILURE_BY_ID = new Map<FailureClassId, FailureTableRow>(
  FAILURE_TABLE.map((r): [FailureClassId, FailureTableRow] => [r.id, r]),
)

export function failureClass(id: FailureClassId): FailureTableRow {
  const row = FAILURE_BY_ID.get(id)
  if (row === undefined) throw new Error(`No failure-class row for ${id}`)
  return row
}

/** The measured shape of the table, re-counted from the source by the suite. */
export const FAILURE_TABLE_SHAPE = {
  headerLine: 79579,
  separatorLine: 79580,
  firstDataLine: 79581,
  lastDataLine: 79591,
  columns: 6,
  dataRows: 11,
} as const

/**
 * The distinct values one column takes across a set of rows. Exists so the
 * three-against-two collapse in the revocation rows is COUNTED rather than
 * asserted in prose, and so it stays counted if a cell is ever edited.
 */
export function distinctCells(
  ids: readonly FailureClassId[],
  column: FailureTableColumn,
): readonly string[] {
  return [...new Set(ids.map((id) => failureClass(id).cells[column]))]
}

/* ── the five worker-facing rejection messages, L79567-L79573 ───────────── */

export const REJECTION_MESSAGE_COLUMNS = [
  'Rejection',
  'Worker-facing message',
  'Who acts next',
] as const

export type RejectionMessageColumn = (typeof REJECTION_MESSAGE_COLUMNS)[number]

export interface RejectionMessageRow {
  readonly id: RejectionMessageId
  readonly line: number
  readonly cells: Readonly<Record<RejectionMessageColumn, string>>
}

export const REJECTION_MESSAGES = [
  {
    id: 'corrupt',
    line: 79569,
    cells: {
      Rejection: 'Corrupt',
      'Worker-facing message':
        '"This job could not be prepared. It is downloading again automatically. Your other jobs are ready."',
      'Who acts next': 'Nobody; automatic',
    },
  },
  {
    id: 'tampered',
    line: 79570,
    cells: {
      Rejection: 'Tampered',
      'Worker-facing message':
        '"This job cannot be started on this device. Please tell your supervisor."',
      'Who acts next': 'Supervisor, then the platform team as a security event',
    },
  },
  {
    id: 'scope-mismatch',
    line: 79571,
    cells: {
      Rejection: 'Scope mismatch',
      'Worker-facing message': '"This job is not for this device. Please tell your supervisor."',
      'Who acts next': 'Supervisor',
    },
  },
  {
    id: 'incompatible-version',
    line: 79572,
    cells: {
      Rejection: 'Incompatible version',
      'Worker-facing message':
        '"This tablet needs a software update before this job can run. Please tell your supervisor."',
      'Who acts next': 'Supervisor and the platform team',
    },
  },
  {
    id: 'expired-or-revoked',
    line: 79573,
    cells: {
      Rejection: 'Expired or revoked',
      'Worker-facing message':
        '"This job has been withdrawn. Please tell your supervisor. Your saved work is safe."',
      'Who acts next': 'Supervisor, then Quality Manager for any captured work',
    },
  },
] as const satisfies readonly RejectionMessageRow[]

export function rejectionMessage(id: FailureClassId): RejectionMessageRow | null {
  const key = failureClass(id).rejectionMessage
  return key === null ? null : (REJECTION_MESSAGES.find((m) => m.id === key) ?? null)
}

/* ── the verification gauntlet, L79529-L79561 ───────────────────────────── */

export const VERIFICATION_CHECKS = [
  'checksum',
  'signature',
  'scope',
  'compatibility',
  'validity',
] as const

export type VerificationCheck = (typeof VERIFICATION_CHECKS)[number]

export interface VerificationStep {
  readonly id: VerificationCheck
  /** The diagram line naming this state, L79533-L79537. */
  readonly diagramLine: number
  /** The diagram's own label for it, verbatim from `diagramLine`. */
  readonly label: string
  /** §35.3 manifest fields this check reads, with their own lines. */
  readonly manifestFields: readonly string[]
  readonly manifestFieldLines: readonly number[]
  /** The failure-table row this check's rejection is. */
  readonly failureClass: FailureClassId
  /**
   * L79563: "Only one rejection returns to the start". L79555 is the edge —
   * `RejectCorrupt --> Received`. Every other rejection is terminal.
   */
  readonly returnsToReceived: boolean
}

export const VERIFICATION_GAUNTLET = [
  {
    id: 'checksum',
    diagramLine: 79533,
    label: 'Checksum check - detect accidental corruption',
    manifestFields: ['Checksum'],
    manifestFieldLines: [79278],
    failureClass: 'accidental-corruption',
    returnsToReceived: true,
  },
  {
    id: 'signature',
    diagramLine: 79534,
    label: 'Signature check - detect tampering',
    manifestFields: ['Signature'],
    manifestFieldLines: [79277],
    failureClass: 'tampering',
    returnsToReceived: false,
  },
  {
    id: 'scope',
    diagramLine: 79535,
    label: 'Scope check - tenant, site, area, job, run, worker',
    manifestFields: [
      'Tenant identifier',
      'Site identifier',
      'Area identifier',
      'Job identifier',
      'Run identifier',
      'Worker or role applicability',
    ],
    manifestFieldLines: [79261, 79262, 79263, 79264, 79265, 79266],
    failureClass: 'scope-mismatch',
    returnsToReceived: false,
  },
  {
    id: 'compatibility',
    diagramLine: 79536,
    label: 'Compatibility check - minimum application version',
    manifestFields: ['Minimum application version'],
    manifestFieldLines: [79279],
    failureClass: 'incompatible-application-version',
    returnsToReceived: false,
  },
  {
    id: 'validity',
    diagramLine: 79537,
    label: 'Validity check - effective time and expiry',
    manifestFields: ['Effective time', 'Expiry'],
    manifestFieldLines: [79275, 79276],
    failureClass: 'expiry',
    returnsToReceived: false,
  },
] as const satisfies readonly VerificationStep[]

/**
 * A check's answer. `unavailable` is the third member on purpose: L79593's
 * fallback failure is "verification itself is defective — for example a
 * signature check that fails open", and a two-valued result has no way to say
 * "the verifier could not answer" that is not also a pass or a fail.
 */
export type CheckResult = 'passed' | 'failed' | 'unavailable'

export type VerificationOutcome =
  | { readonly trusted: true }
  | {
      readonly trusted: false
      readonly blockedAt: VerificationCheck
      readonly result: CheckResult
      readonly failureClass: FailureClassId
      /** True only for accidental corruption — L79555, L79563. */
      readonly rePullPermitted: boolean
    }

/**
 * The gauntlet, run in the source's order, fail-closed.
 *
 * `results` is a TOTAL `Record` over the five checks and there is no default
 * for any of them, which is the whole guarantee: an omitted signature result
 * does not compile, so nothing here can quietly treat an unsigned package as
 * verified while `DEC-PKGSIGN-001`, `DEC-PKGMAN-001` and `DEC-SEC-015` are
 * open. The `?? 'unavailable'` is not dead code — `noUncheckedIndexedAccess`
 * is on, and a caller crossing a JavaScript boundary can still hand this an
 * object missing a key.
 *
 * `AC-PKG-601` at L79599 is why this returns before running any later check
 * rather than collecting every result: verification is complete before
 * activation and never partial during execution, so the first negative answer
 * ends it.
 */
export function verifyPackage(
  results: Readonly<Record<VerificationCheck, CheckResult>>,
): VerificationOutcome {
  for (const step of VERIFICATION_GAUNTLET) {
    const result = results[step.id] ?? 'unavailable'
    if (result !== 'passed') {
      return {
        trusted: false,
        blockedAt: step.id,
        result,
        failureClass: step.failureClass,
        rePullPermitted: step.returnsToReceived,
      }
    }
  }
  return { trusted: true }
}

/* ── revocation, which is three rows and not one ────────────────────────── */

export const REVOCATION_TIMINGS = [
  'before-staging',
  'after-staging-run-not-started',
  'after-staging-run-in-flight',
] as const

export type RevocationTiming = (typeof REVOCATION_TIMINGS)[number]

const REVOCATION_ROW_IDS = {
  'before-staging': 'revocation-before-staging',
  'after-staging-run-not-started': 'revocation-after-staging-run-not-started',
  'after-staging-run-in-flight': 'revocation-after-staging-run-in-flight',
} as const satisfies Readonly<Record<RevocationTiming, FailureClassId>>

/**
 * `timing` is required and carries no default. A defaulted timing would not
 * count toward `Function.length`, and the one it would default to is whichever
 * of the three the author happened to think of first — which is exactly the
 * collapse the section is written against.
 */
export function revocationResponse(timing: RevocationTiming): FailureTableRow {
  return failureClass(REVOCATION_ROW_IDS[timing])
}

/** The three revocation rows, in the source's order. Used by `distinctCells`. */
export const REVOCATION_ROW_ORDER = [
  'revocation-before-staging',
  'revocation-after-staging-run-not-started',
  'revocation-after-staging-run-in-flight',
] as const satisfies readonly FailureClassId[]

/**
 * THE GAP L79588 LEAVES OPEN AND THIS MODULE DOES NOT CLOSE.
 *
 * The mid-run revocation row's terminal safe state quarantines the captured
 * work. §36.5's quarantine register — the ten reasons at L80389-L80398, shipped
 * as `QUARANTINE_REGISTER` in `@/offline/quarantine` — holds no reason for a
 * revoked or withdrawn package. The nearest, L80397, is
 * "Record referencing a workflow version that does not exist", which is a
 * missing version rather than a withdrawn one.
 */
export const REVOCATION_QUARANTINE_GAP = {
  claimedAt: 79588,
  registerAt: 'L80389-L80398',
  nearestReasonLine: 80397,
  gap:
    'L79588 disposes of mid-run captured work by quarantining it, and no reason in §36.5’s ' +
    'ten-row quarantine register names a revoked or withdrawn package. The register cannot ' +
    'express the case the row depends on.',
  notPatchedBecause:
    'The ten reasons are `@/offline/quarantine`’s closed set, transcribed from §36.5. Minting an ' +
    'eleventh here would put a second spelling of that vocabulary in the tree.',
} as const

/* ── terminal safe states, forwarded to the readiness machine ───────────── */

/**
 * The terminal safe state of the seven rows whose cell opens `Run not
 * enterable`, expressed as `@/offline/package/delivery`'s own staging so that
 * "not enterable" is a fact `packageIsEnterable` can be asked about rather
 * than a string in a table. `null` for the other four: L79588's run is stopped
 * rather than un-entered, and L79589-L79591 open `Not applicable`.
 */
export function terminalStaging(id: FailureClassId): PackageStaging | null {
  const cell = failureClass(id).cells['Terminal safe state']
  return cell.startsWith('Run not enterable') ? { kind: 'not-arrived', reason: cell } : null
}

/** True where `terminalStaging` produced a staging and that staging is closed. */
export function terminalStateIsNotEnterable(id: FailureClassId): boolean {
  const staging = terminalStaging(id)
  return staging !== null && !packageIsEnterable(staging)
}

/* ── the signing dependency, POINTED AT rather than respelled ──────────── */

/**
 * `src/offline/package/manifest.ts` landed while this file was being written
 * and had independently reached the same reading: the source classifies
 * package signing at three different strengths in three different chapters and
 * ratifies it in none. Its `PACKAGE_SIGNING_CLASSIFICATIONS` carries all three
 * with their locators, and `SIGNING_IS_NOT_A_BASELINE` states the consequence.
 *
 * THIS FILE HAD ITS OWN COPY AND IT WAS DELETED. Two spellings of one ruling
 * in one directory is the defect this build records most often, and the copy
 * that survives is the one in the module that transcribes the `Signature`
 * field, not the one in the module that merely reads it. What is kept here is
 * the BINDING: `conditionalOn` is typed as `PackageDecisionRef`, so if the
 * manifest module ever drops one of the three, this stops compiling.
 */
export const TAMPERING_DETECTION_DEPENDENCY = {
  /** The failure-table row whose detection presumes a signature exists. */
  rowLine: 79582,
  /**
   * The three decisions that detection waits on. Typed against the manifest
   * module's own union rather than restated as bare strings.
   */
  conditionalOn: [
    'DEC-PKGSIGN-001',
    'DEC-PKGMAN-001',
    'DEC-SEC-015',
  ] as const satisfies readonly PackageDecisionRef[],
  /** All three classifications, from the module that owns them. */
  classifications: PACKAGE_SIGNING_CLASSIFICATIONS,
  notABaseline: SIGNING_IS_NOT_A_BASELINE,
  /**
   * What this module does about it: nothing that makes signing a baseline.
   * `verifyPackage` has no default for the signature result, so the row ships
   * with its detection exactly as L79582 writes it and no code path here can
   * treat an unsigned package as verified.
   */
  carriedNotAssumed:
    'The row ships as the source writes it. The gauntlet step exists and its result comes from ' +
    'the caller; nothing here asserts a package is signed, and nothing here deletes the row.',
} as const

/* ── the open decisions of §35.7 ────────────────────────────────────────── */

/**
 * Two of §35.7's decisions are already in the shared canon and are cited
 * through it rather than respelled here — `DecisionDisclosure` takes exactly
 * this type, so handing it one of these renders the canon's own wording and
 * the canon's own locators, which is the point of there being one of each.
 */
export const PACKAGE_INTEGRITY_CANON_DECISIONS = [
  'DEC-LIB-001',
  'DEC-WIDIFF-001',
] as const satisfies readonly DecisionId[]

export interface DecisionDisclosedElsewhere {
  readonly decisionRef: string
  /** Where §35.7 cards it. */
  readonly line: number
  readonly where: string
  readonly why: string
}

export const PACKAGE_INTEGRITY_DECISIONS_ELSEWHERE = [
  {
    decisionRef: 'DEC-PKGFIELD-001',
    line: 79628,
    where: 'src/frontline/modules/fl-a3, and five other modules',
    why:
      'It is disclosed already, in a module whose files this task does not own. A second record ' +
      'here would be a second spelling of a ruling that exists.',
  },
] as const satisfies readonly DecisionDisclosedElsewhere[]

/**
 * The canon's own record shape for the decisions the canon does not yet hold,
 * with `DecisionReading` IMPORTED rather than redeclared, and with the three
 * obligations `DecisionDisclosure` discharges: the identifier, EVERY reading
 * with its own locator, and this build's position labelled a client-delegated
 * choice.
 *
 * BUILT TO EXPIRE. The covering suite asserts every identifier below is ABSENT
 * from the canon's exported union, so the moment one is lifted the suite goes
 * red and forces the switch.
 */
export interface PackageIntegrityLocalDisclosure {
  readonly decisionRef: string
  readonly question: string
  readonly readings: readonly DecisionReading[]
  /** What this build does. Never presented as the source's ruling. */
  readonly adopted: string
  /** Why §35.6's integrity rules are a place this has to be disclosed. */
  readonly whyHere: string
  readonly canonNote: string
}

const CANON_NOTE =
  "The shared decision canon's DecisionId union does not hold this identifier. It is disclosed here " +
  "in the canon's own record shape, and this module's unit suite asserts the absence, so the " +
  'disclosure moves to the canon the moment the canon holds it.'

export const PACKAGE_INTEGRITY_LOCAL_DISCLOSURES = [
  {
    decisionRef: 'DEC-PKGEXP-001',
    question:
      'Is there a package validity horizon at all, and if so is it its own manifest value or tied ' +
      'to the credential trust window?',
    readings: [
      {
        text:
          'The source bounds how long cached credentials may be trusted on a dark device but sets ' +
          'no equivalent bound on how long a device may execute a staged work package with no ' +
          'contact.',
        locator: 'DEC-PKGEXP-001 · L79650',
      },
      {
        text: 'The Expiry row’s own Source status cell is Client Decision Required under this identifier.',
        locator: 'L79585',
      },
    ],
    adopted:
      'No expiry is implemented and no value is assumed — the source’s own until-decided position. ' +
      'The validity step of the gauntlet exists as the diagram draws it and its result comes from ' +
      'the caller. A client-delegated choice under APP-012.',
    whyHere:
      'It is the only row of the eleven whose Source status is Client Decision Required outright, ' +
      'rather than a recommendation with a decision attached.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-BUNDLE-001',
    question:
      'Does a tenant’s severity action-bundle change require republication of affected packages, ' +
      'how does it reach devices, and what does an in-flight pinned run do with a bundle changed ' +
      'mid-run?',
    readings: [
      {
        text:
          'New decision raised by the blueprint: §5.14.1 and §7.9.2 place the bundles inside the ' +
          'work package while §3.3 has tenants configuring them on a server-side surface.',
        locator: 'DEC-BUNDLE-001 · L79648',
      },
      {
        text:
          'The offline event matrix already routes the case to this identifier, with the pinned ' +
          'package’s bundle continuing to govern.',
        locator: 'OFF-EVT-16 · L78324',
      },
    ],
    adopted:
      'The pinned package’s bundle governs the run — the source’s own until-decided position, and ' +
      'the one `src/offline/event-matrix.ts` already routes to. Nothing here republishes or ' +
      'rebases on a bundle change. A client-delegated choice under APP-012.',
    whyHere:
      'A bundle change is the case where Replacement at L79589 and Rollback at L79590 stop being ' +
      'content events and become safety configuration, and neither row says which they are.',
    canonNote: CANON_NOTE,
  },
  {
    decisionRef: 'DEC-OFFASSIGN-001',
    question:
      'How does a run assigned while the device is entirely offline become visible, given that the ' +
      'device cannot know it exists?',
    readings: [
      {
        text:
          'New decision raised by the blueprint: §7.6 promises a run whose package has not arrived ' +
          'is shown as not-yet-ready rather than silently missing, and a run assigned to an ' +
          'offline device shows as nothing at all.',
        locator: 'DEC-OFFASSIGN-001 · L79654',
      },
      {
        text:
          '§35.4 states the same gap from the delivery side, with the reconciliation-on-reconnect ' +
          'recommendation.',
        locator: 'L79362',
      },
    ],
    adopted:
      'Neither option is implemented. The gap is stated and the source-backed behaviour is ' +
      'rendered only. A client-delegated choice under APP-012.',
    whyHere:
      '`src/offline/package/delivery.ts` records this gap at `OFFLINE_ASSIGNMENT_GAP` and ' +
      'deliberately writes no card for it, on the ground that §35.7 is another task’s section. ' +
      'This is that section, so the card belongs here and nowhere else.',
    canonNote: CANON_NOTE,
  },
] as const satisfies readonly PackageIntegrityLocalDisclosure[]

/** The identifiers carried locally. The expiry gate reads this, not the array. */
export const PACKAGE_INTEGRITY_LOCAL_DECISION_IDS: readonly string[] =
  PACKAGE_INTEGRITY_LOCAL_DISCLOSURES.map((d) => d.decisionRef)

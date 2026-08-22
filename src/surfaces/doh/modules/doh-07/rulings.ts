import { CONTROL_MATRIX, type AssignmentControlId, type AssignmentMatrixRow } from './matrix'

/**
 * `MOD-DOH-07`'s disclosures: the one undefined ordering, the one act that
 * happens somewhere else and is not a registered boundary, and the two
 * registers of what the source does not settle.
 *
 * Nothing here computes a permission. It is read by
 * `app/hub/worker-assignment/WorkerAssignmentScreen.tsx` and by
 * `tests/unit/doh-assignment.test.ts`, and by nothing else.
 */

/* ==================================================================== *
 * DEC-PLUS-001 — "and above", across roles that have no above.
 * ==================================================================== */

/**
 * `DEC-PLUS-001` is NOT AN OPEN DECISION WITH READINGS, and that is why it
 * is disclosed here rather than added to the canon in `@/disclosure/decisions`.
 *
 * The canon's record shape carries competing readings and a build position
 * chosen between them. This is a different animal: the source states, at
 * L13456, that the ordering "is not defined across five additive,
 * non-hierarchical roles", and then gives its own instruction for what to do
 * about it — "Every cell above that uses those forms reproduces the source's
 * own wording and does not invent an ordering." There is nothing to choose
 * between and nothing to adopt. Filing it as a two-reading decision would
 * manufacture the two readings the source refuses to supply.
 *
 * ONE MATRIX CELL IN THE WHOLE OF SLICE 6 USES THE FORM, and it is this
 * module's row 4. Measured across L27673-L30184, the seven slice-6 module
 * sections: L28122 is the only permission-matrix cell carrying "Supervisor
 * and above" or "Quality Manager and above". Two feature-prose lines carry
 * it too — L28185 here and L28386 in MOD-DOH-08 — and neither is a cell. So
 * hoisting this into the shared canon would move one module's disclosure
 * into a file four concurrent tasks share, for one consumer.
 *
 * WHAT IS ACTUALLY ENFORCED, and it is the only part that can go wrong in
 * code: the Quality Manager's status on row 4 is read from the Quality
 * Manager's own column and never derived from the phrase. There is no
 * ordering, no rank, no `rolesAtOrAbove`, and no set the phrase expands to.
 * `tests/unit/doh-assignment.test.ts` asserts the absence directly.
 */
export const DEC_PLUS_001 = {
  ref: 'DEC-PLUS-001',
  locator: 'L13456',
  question:
    'What does "Supervisor and above" mean when the five tenant roles are additive and non-hierarchical?',
  statement:
    'The source states that the ordering implied by "Supervisor and above" and "Quality Manager and above" L13456 — "is not defined across five additive, non-hierarchical roles", and instructs that every cell using those forms reproduces its wording and invents no ordering.',
  whereItLands:
    'MOD-DOH-07 row 4, the Quality Manager cell (L28122) — the only permission-matrix cell in the whole of slice 6 that uses the form. The same row gives the Tenant Admin `Explicitly prohibited`, so "and above" cannot mean "every role senior to the Supervisor" without contradicting its own row.',
  whatThisBuildDoes:
    'Quotes the cell and stops there. The Quality Manager’s status on that row is read from the Quality Manager’s own column; no code anywhere maps the phrase to a role set, and there is no rank, order or seniority relation over the five tenant roles in this build to map it with.',
  whatThisBuildDoesNotDo:
    'It does not pick an ordering, does not treat the Quality Manager as senior to the Supervisor or the reverse, and does not quietly drop the phrase to make the cell read cleanly. Dropping it would delete the source’s own record that the question is open.',
  alsoRecordedAt:
    '`src/surfaces/doh/objects.ts` — wave 0 named DEC-PLUS-001 beside the three role sets the Hub command specs use, for the same reason: they are enumerations, not a hierarchy.',
} as const

/* ==================================================================== *
 * COMMAND CENTER ACTION 8 — a place, on no register.
 * ==================================================================== */

/**
 * ROW 4 IS A CROSS-SURFACE ROW WITH NO BOUNDARY-REGISTER ROW BEHIND IT, and
 * so it gets a statement and no link — deliberately, and this is the whole
 * reasoning rather than an omission.
 *
 * The boundary register is eight rows (L25719-L25726) and every one of them
 * is quoted in `@/surfaces/doh/boundary`. Reassigning a run mid-shift is not
 * among them. `crossSurfaceStatement` takes a `DohBoundaryId` and checks its
 * link against the route registry before drawing it; there is no id to hand
 * it, and minting a ninth register row for an act §4.1.2 does not register
 * would be inventing the register entry to justify the link.
 *
 * A LINK IS NOT REQUIRED HERE AND IS NOT DRAWN. AC-DOH-012-3 (L25767) asks
 * for "a cross-surface link and no inline editing affordance" on a Hub
 * screen that touches an ADJACENT CAPABILITY, and adjacency there is
 * membership of that eight-row register. The Supervisor and the Quality
 * Manager do both reach `SURF-CC` in the route registry, so a link would
 * resolve — but a routing pointer is read by a reviewer as a verified fact,
 * and the only fold that verifies one on this surface is the one that
 * requires a register row. A pointer no fold indexes is forbidden, so none
 * is minted. What renders is the place, named, with the three locators that
 * establish it.
 */
export const COMMAND_CENTER_ACTION_8 = {
  rowId: 'reassign-from-command-center' satisfies AssignmentControlId,
  actionNumber: 8,
  owningSurfaceName: 'Client Command Center',
  statement:
    'Reassigning a run mid-shift is Client Command Center action number 8. It calls this module’s services and receives identical validation and identical errors, so the records and the audit entries are this module’s — but the control is there, not here.',
  whyNoLink:
    'This act is not one of the eight rows of the §19.1.2 boundary register (L25719-L25726), so there is no registered boundary to check a link against. This build draws routing pointers only where a fold verifies them; an unverified one reads as a fact and this screen states the place in words instead.',
  sourceRefs: [
    'L28122 — the matrix row itself',
    'L13421 — the §9.2 ownership matrix: Assignment is mutated "from the Hub’s own screens or as Command Center action 8, identical rules including qualification checks"',
    'WF-EXE-001 L53791 — "Client Command Center action 8 executes through the same service with identical rules"',
    'WF-EXE-001 L53798 — the five-surfaces line: "Client Command Center — action 8 reassignment mid-shift, Supervisor and above"',
    'L28193 — "The Client Command Center’s reassign action calls these services and receives identical validation and identical errors."',
  ],
  noCommandExists:
    'There is no `DOH_REASSIGN_RUN` in the Hub command set. The fifteen Hub commands include `DOH_SUBSTITUTE_WORKER`, which is what the Command Center’s action calls; the absence of a Hub-side reassign command is the guarantee, not a gap.',
} as const

/* ==================================================================== *
 * CATALOGUE B IS NARROWER THAN THE MATRIX — this screen's own case.
 * ==================================================================== */

/**
 * The narrowing wave 0 measured for `SCR-DOH-15`, restated here as what the
 * screen says about itself. The rail is NEVER hand-written: reach comes
 * from `MOD_DOH_07_REACH`, derived from the matrix by the one rule.
 *
 * The Worker is deliberately absent from `omittedRoles` even though the
 * matrix admits the Worker on row 7 and catalogue B does not name it. That
 * omission is not a narrowing defect — D11 refuses the Worker the whole
 * surface, so the catalogue and the route registry agree there and only the
 * matrix dissents. The three roles below are the ones where catalogue B and
 * the matrix genuinely disagree with nothing else to break the tie.
 */
export const CATALOGUE_B_NARROWING = {
  screenId: 'SCR-DOH-15',
  catalogueBCell: 'Supervisor',
  catalogueBRef: 'L48109',
  omittedRoles: ['Tenant Admin', 'Quality Manager', 'Read-only Auditor'],
  matrixRef:
    'L28125 — "View assignments": `Allowed` for the Tenant Admin, `Allowed` for the Quality Manager, `Read-only` for the Read-only Auditor',
  workerNote:
    'The Worker is not counted as a narrowing. The matrix admits the Worker on row 7 and catalogue B does not name it, but D11 withholds the whole surface from the Worker first, so the catalogue and the route registry agree and only the matrix dissents. That dissent is disclosed on the row itself.',
  entryPointNote:
    'Catalogue B’s navigation entry for this screen is "Run detail" (L48109). It is promoted to a route of its own here because this module owns a matrix and the slice-4 convention is one route per module; the catalogue’s entry point is recorded rather than overwritten.',
} as const

/* ==================================================================== *
 * THE TWO SEAMS THIS MODULE CLOSES.
 * ==================================================================== */

/**
 * `worker-shift-meter` and `qualification-gate` both carry `ownerSlice 6` in
 * `@/surfaces/doh/seams`, so `dohSeamStatus` already derives them CLOSED.
 * A derived "closed" that nothing satisfies is a false absence in the other
 * direction, so what each seam now carries is stated here and rendered on
 * the screen.
 *
 * `qualification-gate` IS THIS MODULE'S ALONE, and the co-ownership this
 * note used to claim was the seam's false presence. It read "co-owned with
 * `MOD-DOH-06`, which enforces the same gate at run start" — but this
 * module's own Security row says where each of the source's three points
 * runs: "server-side at assignment and again at run start and at
 * override-carrying screens ON THE DEVICE" (L28112), restated as step 7
 * below (L28136). Run start is a device act — MOD-DOH-06's lifecycle has the
 * worker starting the run on the Frontline Worker Application, and its
 * twelve matrix rows carry no gate action — so TWO of the three points are
 * `SURF-FL`'s and only the assignment point is the Hub's. This module closes
 * the seam entire, because the Hub half is one point and this is it.
 */
export const SEAMS_CLOSED_HERE = [
  {
    seamId: 'worker-shift-meter',
    whatItNowCarries:
      'Assignment and substitution emit the Worker-Shift meter inputs MOD-DOH-01 stubbed. AC-DOH-01-1 (L27039) is the contract: one per worker per calendar shift regardless of run count, and one per substituting worker who actually performed work. AC-DOH-07-8 (L28233) states this module’s half of it.',
    sourceRef: 'L27039, L28233, L28145, §2.7',
  },
  {
    seamId: 'qualification-gate',
    whatItNowCarries:
      'The gate runs at assignment, server-side, under the tenant’s posture: under strict a failing check blocks and the assign control is absent with the clearance path named, and under notify-only the assignment proceeds and raises immediate notifications to the supervisor and the Quality Manager plus audit and Summary flags (L28132). This is the whole of the Hub half: the other two of the source’s three enforcement points — at run start and at override-carrying screens — run on the device against the pinned work package (L28112, L28136), and neither was ever MOD-DOH-06’s to build.',
    sourceRef: 'L28132, AC-DOH-07-2 L28227, SB-DOH-019 L28216, §4.4.2',
  },
] as const

/* ==================================================================== *
 * WHAT THIS SCREEN DELIBERATELY DOES NOT DRAW.
 * ==================================================================== */

export interface AbsentByRule {
  readonly label: string
  readonly note: string
}

export const ABSENT_BY_RULE = [
  {
    label: 'A per-worker-per-cell grant table, enabled or disabled',
    note: 'No such table exists anywhere in the platform (AC-DOH-07-3, L28228). A disabled one would invent two entities the source denies — the grant and the table of them — and would tell a reader the capability exists and is merely refused here. A stated line renders in its place.',
  },
  {
    label: 'An availability or double-booking check, enabled or disabled',
    note: 'Deferred beyond V1, out-of-V1 register row 5 (L25880). AC-DOH-07-5 (L28230) requires the absence to be stated on this screen rather than implied, and a disabled control implies. A stated line renders in its place.',
  },
  {
    label: 'A reassign-run control',
    note: 'Client Command Center action number 8. Two of the five cells on that row read `Allowed with conditions` and neither is a permission on this screen; the act has one service, and a Hub button for it would be a second entry point to it.',
  },
  {
    label: 'An override control on a blocked assignment',
    note: 'Prohibited in all five columns (L28123), and AC-DOH-07-10 (L28235) requires the blocked row to offer "the clearance path and never an inline override". The clearance is granted in the Client Command Center as action number 10 and renders as a cross-surface statement, which carries no editing affordance by construction.',
  },
  {
    label: 'A self-assignment path for the Worker',
    note: 'Deferred beyond V1 (out-of-V1 register row 4, L25879) and structurally impossible besides: AC-DOH-07-1 (L28226) requires that no worker-role path can produce a self-assignment, and under D11 the Worker reaches no Hub screen from which to try.',
  },
  {
    label: 'A concurrency cap or a "too many workers" warning',
    note: 'L28120 — "concurrency is unlimited". The source states no ceiling and no warning threshold; a number chosen here would read back as a requirement.',
  },
  {
    label: 'A re-pin or re-base control on an in-flight run',
    note: 'FUNC-DOH-07-1.2.1 (L28182) prohibits it for all roles: the pin is set at assignment and is immutable for the life of the run. Substitution carries the SAME package reference forward rather than re-pinning.',
  },
  {
    label: 'A step re-attribution control',
    note: 'Prohibited for every role including the Tenant Admin (FUNC-DOH-07-2.1.2, L28186; AC-DOH-07-7, L28232). Pre-substitution captures stay attributed to the original worker permanently, and there is no command that could move one.',
  },
] as const satisfies readonly AbsentByRule[]

export const UNSPECIFIED_IN_SOURCE = [
  'No CAUSE is stated for the Tenant Admin, the Read-only Auditor or the Worker on five of this matrix’s eight rows. L28119-L28123 give those columns the bare token `Explicitly prohibited` and qualify it nowhere; the cells carry the token and the shared note rather than a reason this build wrote for the source.',
  'What "own Area scope" ranges over when a run’s Job is bound at a node deeper than an Area. Row 1 scopes the Supervisor by Area (L28119) and DEC-AREA-001 makes the binding a parent node at the tenant’s configured depth, so this screen resolves scope by walking up the node path and states that it is doing so.',
  'Whether a substitution may name a worker already assigned to the same run. Nothing forbids it and nothing permits it; the only check the source runs at assignment is the qualification check (L28086), so this screen refuses only the self-substitution the command already refuses.',
  'How many times one run may be substituted. The source describes substitution in the singular throughout and states no limit, so none is enforced and none is implied on screen.',
  'What the assignment panel shows for a candidate whose certification expires DURING the run. The chip vocabulary is Qualified, Expires in 3 days, Expired and Not held (SB-DOH-019, L28216) and none of the four is about the run’s own window; this screen renders the chip the source names and adds no fifth.',
  'Whether the Read-only Auditor sees the substitution REASON. Row 7 gives the Auditor `Read-only` over assignments (L28125) and the reason is part of the substitution record; nothing states an exception, so it renders, and the silence is recorded rather than filled by a redaction rule this build invented.',
] as const satisfies readonly string[]

export const UNRESOLVED_IN_SOURCE = [
  'Row 7 gives the Worker `Allowed with conditions — own assignments only` (L28125) while D11 withholds every Hub route from the Worker. The two cannot both be honoured on this surface. This build honours D11 and states the cost: the cell’s grant is met on the device, where each assigned worker sees the run under their own identity (L28135), and a worker without a device in hand cannot see who else is on their run.',
  'Row 4’s Quality Manager cell reads `Allowed with conditions — Supervisor and above` on the same row where the Tenant Admin reads `Explicitly prohibited` (L28122). Under any ordering that puts the Tenant Admin above the Supervisor the two cells contradict each other; under DEC-PLUS-001 there is no ordering to test them against. Both cells render exactly as written.',
  'Catalogue B names the Supervisor alone as able to open this screen (L48109) while the matrix admits the Tenant Admin and the Quality Manager unconditionally and the Read-only Auditor as a reader (L28125). Reach is derived from the matrix; the catalogue cell is quoted beside it and neither is corrected.',
  'The three sources on how a deferred capability renders do not agree — AC-DOH-014-2 (L25935), SB-DOH-005 (L25924), and the inherited slice-4/5 rule. This module settles it on its own acceptance criterion AC-DOH-07-5 (L28230) and records the two readings it did not adopt rather than deleting them. The ruling is stated on screen, because three further module tasks follow it.',
  'The out-of-V1 register counts twenty rows (L25876-L25895) while AC-DOH-014-1 (L25934) claims "twenty registered rows plus the three additional deferrals" — an effective twenty-three. The three extras are prose at L25897 and appear in no table. Both of this module’s register citations name table rows, and both numbers are stated wherever the register is enumerated.',
  'Row 6 is `Not applicable` for a reason that is not a deferral, and the plan’s trap note reads it as one. No per-worker-per-cell grant appears anywhere on the out-of-V1 register; AC-DOH-07-3 (L28228) states that no such table exists anywhere in the platform. Rendering it as deferred would set a roadmap expectation the register does not carry.',
] as const satisfies readonly string[]

/**
 * The two absence notes, pulled off the matrix rather than re-listed, so a
 * third `Not applicable` row could never be added without appearing here.
 * `tests/unit/doh-assignment.test.ts` asserts the derivation is what the
 * screen reads.
 */
export const ABSENCE_NOTES: readonly AssignmentMatrixRow[] = CONTROL_MATRIX.filter(
  (row) => row.absence !== null,
)

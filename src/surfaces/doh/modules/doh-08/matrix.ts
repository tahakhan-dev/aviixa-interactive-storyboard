import type { TenantRoleId } from '../../../../../app/hub/HubShell'
import type { DohControlMatrixRow } from '@/surfaces/doh/modules'
import { BARE_PROHIBITION } from '@/surfaces/doh/modules'
import type { DohBoundaryId } from '@/surfaces/doh/boundary'

/**
 * MOD-DOH-08 — Execution Summary Review and Distribution, §19.10.
 *
 * ── THE SPAN, RE-MEASURED RATHER THAN QUOTED ──────────────────────────────
 * Identity card: header L28279, separator L28280, **14 data rows**
 * L28281-L28294. Control matrix: header L28298, separator L28299, **15 data
 * rows** L28300-L28314. Counted off the frozen source line by line, not
 * carried from the plan — the plan's spans start on the table header, so a
 * span quoted as n rows encloses n+2 (plan §1a).
 *
 * ── THE ROW ORDINALS ──────────────────────────────────────────────────────
 * Every `id` below is the row's own capability, and `sourceRef` is the line
 * that carries it. Ordinals in prose are counted from L28300 as row 1, which
 * makes the lot-hold row **8** and the review-toggle row **14** — the plan's
 * trap table labels two different rows "row 7" and two "row 13" and is
 * corrected in plan §1a. Re-derived here; §1a's correction is right.
 *
 * ── THE RULE THIS FILE EXISTS TO ENFORCE ──────────────────────────────────
 * **The classification decides what renders, never the token.** Two rows
 * describe acts that permanently live on the Client Command Center, and one
 * of them reads `Allowed`. `@/surfaces/doh/boundary`'s `adjacentAffordance`
 * is handed the token and ignores it; `./rendering` asks the classification
 * first and the token second. Four tasks on this build have shipped a
 * control off a permissive token on a row that was never this surface's.
 *
 * ── `routedTo`, AND THE ONE ROW THAT CARRIES ONE ──────────────────────────
 * Slice 5's rule, unchanged: `routedTo[column]` names a capability **in this
 * matrix** that this persona holds instead, or `null`. Pointing it at a
 * capability this matrix does not hold is how a disabled control appears for
 * a persona who can never reach the thing it names (`stu-06/matrix.ts`), so
 * an alternative on ANOTHER SURFACE is never a `routedTo` — it renders in the
 * cell's own words inside the cross-surface statement.
 *
 * That is why **row 8's Supervisor cell is not routed**, although its own
 * token contains the alternative: "may request release with a note" is the
 * request half of Client Command Center action 4, not a row of this table.
 * The one genuine routed prohibition on this card is **row 9's Worker cell** —
 * prohibited from editing evidence "because corrections are append-only
 * annotations", which is row 10, where the Worker's own cell grants exactly
 * that. `./rendering` checks the pointer instead of asserting it, and the
 * check collapses it to ABSENT: the Worker reaches no Hub route at all (D11),
 * so the target does not permit this persona HERE. A routed pointer no fold
 * indexes is forbidden; this one is indexed, checked, and answered.
 */

export type Doh08ControlId =
  | 'view-an-execution-summary'
  | 'work-the-review-queue'
  | 'mark-a-summary-reviewed'
  | 'flag-an-anomaly'
  | 'reclassify-an-anomaly-severity'
  | 'resolve-an-anomaly'
  | 'view-the-anomaly-register'
  | 'release-a-severity-1-lot-hold'
  | 'edit-a-capture-or-evidence'
  | 'add-a-correction-annotation'
  | 'force-a-re-finalisation'
  | 'export-the-pdf-summary'
  | 'bulk-or-automated-pdf-distribution'
  | 'set-the-review-toggle'
  | 'set-a-per-area-review-toggle'

/**
 * The shared Hub row shape plus the two fields this card needs. Both are
 * required-and-nullable rather than optional, so every row carries the key and
 * a reader can never mistake "not answered" for "answered no".
 *
 * `boundary` is the exception: `AdjacentRow` declares it optional and
 * `inlineControlsOnAdjacentCapabilities` fails any row that carries one and is
 * not classified adjacent, so it is written only where it is true.
 */
export interface Doh08Row extends DohControlMatrixRow<Doh08ControlId> {
  /**
   * The §19.1.2 register row this capability IS, where the register lists it.
   *
   * **Both of this card's adjacent rows are absent from the register**, and
   * that is a finding rather than an oversight: the eight rows at
   * L25719-L25726 do not include the lot-hold release (Command Center action
   * 4) or anomaly-severity reclassification. So neither row can carry this
   * pointer, and neither can be handed to `@/ui/doh/CrossSurfaceStatement`,
   * whose model requires a `DohBoundaryRow`. `./rendering` renders the
   * register-less case itself, from the row's own words.
   */
  readonly boundary?: DohBoundaryId
  /**
   * Per COLUMN, never per row: a row-level flag on row 9 would have routed the
   * Quality Manager to an annotation control the source never gives her as an
   * alternative to editing evidence.
   */
  readonly routedTo: Readonly<Record<TenantRoleId, Doh08ControlId | null>>
  /**
   * Set where a PERMISSIVE token names an act this screen does not carry a
   * control for, with the reason. Row 14 is the only one: the review toggle is
   * a tenant setting held in the tenant administration area (`SCR-DOH-23`,
   * L48117) and its forced-on half is MOD-DOH-17, which this slice reads and
   * does not build. Null everywhere else, so the token decides nothing on its
   * own and this field cannot become a general override.
   */
  readonly noControlHere: string | null
}

const ROUTES_NOWHERE: Readonly<Record<TenantRoleId, Doh08ControlId | null>> = {
  TENANT_ADMIN: null,
  SUPERVISOR: null,
  QUALITY_MANAGER: null,
  READONLY_AUDITOR: null,
  WORKER: null,
}

/**
 * Both deferral rows read `Not applicable — deferred beyond V1` in the Tenant
 * Admin column and `Not applicable — same reason` in the other four (L28312,
 * L28314).
 *
 * THE SOURCE'S WORDS ARE KEPT AND THE REASON IS CARRIED INTO EVERY COLUMN,
 * because "same reason" is a pointer and a rendered cell is read on its own.
 * A persona looking at the Quality Manager column sees "same reason" as what?
 * `detail` is required per cell AND per role for exactly this: L10238 — "a
 * blank cell is an unanswered question that an implementer will answer
 * privately and inconsistently", and a cause that only resolves by reading
 * another column is blank to the person reading this one. Caught by
 * `tests/component/doh-summary.test.tsx` against the first version of this
 * helper, which reproduced the pointer and shipped it.
 */
function deferredBeyondV1(reason: string): Readonly<Record<TenantRoleId, string>> {
  const carried = `Not applicable — same reason, which is deferred beyond V1. ${reason}`
  return {
    TENANT_ADMIN: `Not applicable — deferred beyond V1. ${reason}`,
    SUPERVISOR: carried,
    QUALITY_MANAGER: carried,
    READONLY_AUDITOR: carried,
    WORKER: carried,
  }
}

export const CONTROL_MATRIX = [
  {
    // Row 1 — L28300.
    id: 'view-an-execution-summary',
    control: 'View an Execution Summary',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'allowed-with-conditions',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed.',
      SUPERVISOR: 'Allowed with conditions — own Area scope.',
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR: 'Read-only.',
      WORKER:
        'Unavailable — on the role axis this token means ABSENT: no standing on the module in any scope, not a control this screen withholds today.',
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      "The Summary renders as a computed view under STATE-06 for the Read-only Auditor. The Supervisor's Area condition is enforced at the READ — an out-of-scope Summary is not in the queue and is not a row this screen then hides. ABSENT for the Worker, whose token is the withholding one.",
    effect:
      'A read of a view that is recomputed rather than stored, so nothing here can go stale against a document.',
    sourceRef: 'L28300',
  },
  {
    // Row 2 — L28301. TRAP 5, half one: `Unavailable` on the role axis.
    id: 'work-the-review-queue',
    control: 'Work the review queue',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'unavailable',
      SUPERVISOR: 'unavailable',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN:
        'Unavailable — ABSENT. Not a disabled queue: the Tenant Admin has no standing on the queue in any scope, and this cell is what withholds the whole module from that column.',
      SUPERVISOR:
        'Unavailable — ABSENT, for the same reason, and the Supervisor may still view Summaries (row 1). Standing on the queue and standing on a Summary are different questions.',
      QUALITY_MANAGER: 'Allowed with conditions — Area-scoped, oldest first.',
      READONLY_AUDITOR: 'Read-only.',
      WORKER: 'Unavailable — ABSENT.',
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'The queue renders for the Quality Manager and, read-only, for the Read-only Auditor. For the other three it is ABSENT — no empty queue, no disabled queue, no "you have no items" — because `Unavailable` says there is no standing to have items under. This is the row that withholds the route from the Tenant Admin and the Supervisor.',
    effect:
      'None on its own. Working the queue is reading it; the acts are rows 3 to 6.',
    sourceRef: 'L28301',
  },
  {
    // Row 3 — L28302.
    id: 'mark-a-summary-reviewed',
    control: 'Mark a Summary reviewed',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'A control for the Quality Manager on the Summary detail, ABSENT for the other four — no alternative in this matrix routes any of them anywhere. NOT the Command Center\'s "mark evidence reviewed", which is action 7 over EVIDENCE and whose mark carries INTO this queue (L22072); this row is the review lifecycle `unreviewed` to `reviewed` on the Summary itself, and it is this surface\'s own act. Conflating the two would delete the Hub\'s half of its own review.',
    effect:
      'Moves the review state and is audited. Happy-path step 8, L28325 — "She marks the Summary reviewed. Every review action is audited."',
    sourceRef: 'L28302',
  },
  {
    // Row 4 — L28303.
    id: 'flag-an-anomaly',
    control: 'Flag an anomaly',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: 'Allowed with conditions — fixed category list plus free text.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'A control for the Quality Manager, with the category taken from a FIXED list and free text beside it. The list is not seeded here and no category is invented: §4.7.3 states that a fixed category list exists and never enumerates it, so the control names the constraint and the catalogue ships empty.',
    effect: 'Creates an Anomaly Register entry in the `Open` state.',
    sourceRef: 'L28303',
  },
  {
    // Row 5 — L28304. TRAP 4 and CONTRADICTION-RECLASSIFICATION-SURFACE.
    id: 'reclassify-an-anomaly-severity',
    control: "Reclassify an anomaly's severity",
    surface: 'another-surface',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER:
        'Allowed with conditions — recorded reason mandatory. The recorded reason is common to both readings of where the act is taken, so the Hub records it either way; what is contested is which surface triggers it.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'NO reclassification control on this surface, whatever this row\'s token reads. The source-of-truth matrix puts the act in the Client Command Center column and marks the Delivery Operations Hub column L49578 — "mirrors and records; never the trigger". The Hub renders the severity, the recorded reason and who recorded it, and offers nothing to change them.',
    effect:
      'On this surface, none. The recorded reason and the resulting severity are rendered as facts the Hub holds.',
    sourceRef: 'L28304',
  },
  {
    // Row 6 — L28305.
    id: 'resolve-an-anomaly',
    control: 'Resolve an anomaly',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: 'Allowed with conditions — closure note mandatory.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'A control for the Quality Manager on an `Open` anomaly, with the closure note required rather than encouraged — `validateHubCommand` refuses a blank one before any permission question is asked, so a reader is shown a validation failure and a policy refusal as different categories.',
    effect:
      'Moves the anomaly `Open` to `Resolved` through `DOH_RESOLVE_ANOMALY`, carrying the note. §4.7.3: "Resolution requires a brief closure note — what was done, and who did it."',
    sourceRef: 'L28305',
  },
  {
    // Row 7 — L28306. TRAP 5, half two.
    id: 'view-the-anomaly-register',
    control: 'View the Anomaly Register',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'unavailable',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'read-only',
      WORKER: 'unavailable',
    },
    detail: {
      TENANT_ADMIN: 'Allowed.',
      SUPERVISOR:
        'Unavailable — ABSENT, and the same Supervisor views Summaries under row 1. The register and the Summary are separate standings; this cell withholds one and not the other.',
      QUALITY_MANAGER: 'Allowed.',
      READONLY_AUDITOR: 'Read-only.',
      WORKER: 'Unavailable — ABSENT.',
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'The register renders inside the Summary detail. ABSENT for the Supervisor and the Worker — not an empty register and not a redacted one.',
    effect: 'A read.',
    sourceRef: 'L28306',
  },
  {
    // Row 8 — L28307. TRAPS 1 and 2, and CONTRADICTION-LOT-RELEASE-SURFACE.
    id: 'release-a-severity-1-lot-hold',
    control: 'Release a Severity 1 lot hold',
    surface: 'another-surface',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR:
        'Explicitly prohibited — may request release with a note. The permissive half is INSIDE the prohibition token, and the note is mandatory. Reading only the token deletes the one affordance the source names at L28307, L13401, L13423, L49579, L28336 and AC-WF-QLT-006-02 (L54242), and deletes the mandatory note with it. The request is the request half of Client Command Center action 4; it is not an act of this surface, so this screen names it and draws no control for it.',
      QUALITY_MANAGER:
        'Allowed — Quality Manager only, uniformly. The authority is uniform and real; the SURFACE it is exercised on is not this one.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      "NO release control and NO request control on this surface, for any role, whatever this row's token reads. `CC_RELEASE_LOT_HOLD` already exists in `@/domain/commands`, and a Hub release button would ship a second release path for one record. Both halves of the row render as a cross-surface statement carrying the cells' own words, including the Supervisor's request path and its mandatory note.",
    effect:
      'On this surface, none. The Hub records placement, propagation and release (L49579) and displays the hold honestly as issued, then propagating, then in force per device (L28336).',
    sourceRef: 'L28307',
  },
  {
    // Row 9 — L28308. The one routed prohibition on the card.
    id: 'edit-a-capture-or-evidence',
    control: 'Edit a capture or a piece of evidence',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: 'Explicitly prohibited — evidence is immutable at creation.',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: 'Explicitly prohibited — corrections are append-only annotations.',
    },
    routedTo: {
      TENANT_ADMIN: null,
      SUPERVISOR: null,
      QUALITY_MANAGER: null,
      READONLY_AUDITOR: null,
      // The cell's own words name the alternative, and the alternative is a
      // row of THIS matrix whose Worker column grants exactly it. The pointer
      // is checked, not asserted: `./rendering` collapses it to ABSENT because
      // the Worker reaches no Hub route (D11), which is the right answer and
      // the reason this field is a check rather than a claim.
      WORKER: 'add-a-correction-annotation',
    },
    noControlHere: null,
    rendering:
      'ABSENT in all five columns. A capability that exists for NOBODY is a `screen` row whose every cell refuses, and it renders as a stated rule rather than a disabled control — a disabled control implies a condition that could become true, and this one cannot. The Tenant Admin\'s and the Worker\'s cells carry their own reasons; the other three state the bare token and the silence is recorded rather than filled in.',
    effect: 'None, anywhere. §9.2, L13410: "No mutation anywhere."',
    sourceRef: 'L28308',
  },
  {
    // Row 10 — L28309. TRAP 3, the Worker column.
    id: 'add-a-correction-annotation',
    control: 'Add a correction annotation',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed-with-conditions',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'allowed-with-conditions',
    },
    detail: {
      TENANT_ADMIN: BARE_PROHIBITION,
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER:
        'Allowed with conditions — append-only, full who, when and what-changed.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER:
        'Allowed with conditions — a worker correction after submission is an append-only correction record. The grant is real and the source means it; the SURFACE it is met on is the Frontline Worker Application, because the Worker holds no Hub screen at all (D11, `app/hub/HubShell.tsx`). Denying it here would assert a prohibition the source does not state; drawing it here would put a Worker on a Hub surface.',
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'A control for the Quality Manager. ABSENT for the Worker with the grant stated and its surface named — not refused, not hidden, and not drawn. `DOH_ANNOTATE_SUMMARY` names the Quality Manager alone and leaves the Worker out of both its allow and its deny list, so the Hub refuses at ROLE_NOT_GRANTED and the Frontline half is untouched.',
    effect:
      'Appends an annotation record. §4.7.4: the original stays immutable, and there is deliberately no command that edits or removes one.',
    sourceRef: 'L28309',
  },
  {
    // Row 11 — L28310.
    id: 'force-a-re-finalisation',
    control: 'Force a re-finalisation of a finished Summary',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'explicitly-prohibited',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: 'Explicitly prohibited — no re-finalisation exists.',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'ABSENT in all five columns, and the screen states the rule rather than offering anything. L28273: "There is no re-finalisation in the old sense — the audited recompute with preserved history is the only path." A disabled "Re-finalise" button would name a capability the product does not have.',
    effect: 'None. The act does not exist.',
    sourceRef: 'L28310',
  },
  {
    // Row 12 — L28311.
    id: 'export-the-pdf-summary',
    control: 'Export the portable-document-format Summary',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'allowed',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN: 'Allowed — manual at V1.',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: 'Allowed — manual at V1.',
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'A manual export control for the Quality Manager on the Summary detail. The Tenant Admin holds the same grant and reaches no route on this module — row 2 withholds it — so the grant is stated in the matrix and met nowhere in this slice, which is recorded rather than quietly resolved either way.',
    effect:
      'Produces one document from a single server-side template with a fixed section order, footed with page numbers, version and an audit hash (L28275).',
    sourceRef: 'L28311',
  },
  {
    // Row 13 — L28312.
    id: 'bulk-or-automated-pdf-distribution',
    control: 'Bulk or automated portable-document-format distribution',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'not-applicable',
      SUPERVISOR: 'not-applicable',
      QUALITY_MANAGER: 'not-applicable',
      READONLY_AUDITOR: 'not-applicable',
      WORKER: 'not-applicable',
    },
    detail: deferredBeyondV1(
      'L28275 defers bulk and automated distribution; scheduled delivery of the standard reports is a V1 Client Command Center capability and a different act.',
    ),
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'ABSENT with the reason in the deferral panel. Three sources disagree on how a deferred capability renders: AC-DOH-014-2 permits a disabled control with an explanatory line at L25935; SB-DOH-005 at L25924 — "an explanatory line rather than a disabled control or an empty region"; and the inherited slice-4 and slice-5 rule maps `Not applicable` to ABSENT with the reason in help text. This build follows the inherited rule, the disagreement renders beside it, and none of the three is named as the source\'s answer.',
    effect: 'None. Nothing is built for it and nothing is stubbed for it.',
    sourceRef: 'L28312',
  },
  {
    // Row 14 — L28313. TRAP 6.
    id: 'set-the-review-toggle',
    control: 'Set the review toggle',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'allowed-with-conditions',
      SUPERVISOR: 'explicitly-prohibited',
      QUALITY_MANAGER: 'explicitly-prohibited',
      READONLY_AUDITOR: 'explicitly-prohibited',
      WORKER: 'explicitly-prohibited',
    },
    detail: {
      TENANT_ADMIN:
        'Allowed with conditions — tenant-wide only; forced on and not disableable in Regulated-Industry mode.',
      SUPERVISOR: BARE_PROHIBITION,
      QUALITY_MANAGER: BARE_PROHIBITION,
      READONLY_AUDITOR: BARE_PROHIBITION,
      WORKER: BARE_PROHIBITION,
    },
    routedTo: ROUTES_NOWHERE,
    noControlHere:
      'The toggle is a tenant-level setting held in the tenant administration area (`SCR-DOH-23`, L48117), and the half that forces it on is MOD-DOH-17 Regulated-Industry Mode (card L29714-L29874), which this slice READS for this constraint and does not build. So the constraint renders and the control does not. A toggle drawn here would be a second place a tenant-wide setting could be written, and a toggle drawn here and disabled would imply a Regulated-Industry state this build cannot evaluate.',
    rendering:
      'The constraint renders as a statement: review is tenant-wide only, default off, and forced on and not disableable in Regulated-Industry mode. No toggle, enabled or disabled, for any role. The Tenant Admin does not reach this module in any case — row 2 withholds it — so this row\'s grant is stated and met on another Hub screen.',
    effect:
      'On this screen, none. Where the toggle is on, a computed Summary enters the Area-scoped review queue (L28322); where it is off, Summaries still compute and Severity 1 events still auto-create Critical anomalies, because the severity bridge is a platform floor and is not review-dependent (L28332).',
    sourceRef: 'L28313',
  },
  {
    // Row 15 — L28314.
    id: 'set-a-per-area-review-toggle',
    control: 'Set a per-Area review toggle',
    surface: 'screen',
    status: {
      TENANT_ADMIN: 'not-applicable',
      SUPERVISOR: 'not-applicable',
      QUALITY_MANAGER: 'not-applicable',
      READONLY_AUDITOR: 'not-applicable',
      WORKER: 'not-applicable',
    },
    detail: deferredBeyondV1(
      'L28269 states it directly — "a per-Area toggle is deferred beyond V1" — and the review queue is a single Area-scoped queue rather than a per-Area configuration.',
    ),
    routedTo: ROUTES_NOWHERE,
    noControlHere: null,
    rendering:
      'ABSENT with the reason in the deferral panel, under the same unresolved rendering rule as row 13.',
    effect: 'None.',
    sourceRef: 'L28314',
  },
] as const satisfies readonly Doh08Row[]

type MissingFromMatrix = Exclude<Doh08ControlId, (typeof CONTROL_MATRIX)[number]['id']>
const _matrixExhaustive: MissingFromMatrix extends never ? true : never = true
void _matrixExhaustive

/**
 * MEASURED, not quoted: 15 data rows at L28300-L28314. Exported so the suite
 * asserts the count against the array rather than against a number in a
 * comment, and so a sixteenth row added without a source line fails there.
 */
export const DOH_08_MATRIX_ROW_COUNT = CONTROL_MATRIX.length
export const DOH_08_MATRIX_FIRST_LINE = 28300
export const DOH_08_MATRIX_LAST_LINE = 28314

/** The identity card: header L28279, separator L28280, 14 data rows to L28294. */
export const DOH_08_CARD_ROW_COUNT = 14

export function doh08Row(id: Doh08ControlId): Doh08Row {
  const row = CONTROL_MATRIX.find((r) => r.id === id)
  if (row === undefined) throw new Error(`Unknown MOD-DOH-08 control: ${id}`)
  return row
}

/* ==================================================================== *
 * THE TWO CONTRADICTIONS THIS MODULE DISCLOSES.
 * ==================================================================== */

export interface Doh08Contradiction {
  readonly id: string
  readonly grade: 'C1' | 'C2' | 'C3'
  readonly row: Doh08ControlId
  readonly question: string
  /** Every reading, each with its own locator. Not the one this build followed. */
  readonly readings: readonly { readonly text: string; readonly locator: string }[]
  /** What is true under BOTH readings, so it is built without settling anything. */
  readonly commonToBoth: string
  /** What this build renders, and why. Never presented as the source's ruling. */
  readonly position: string
}

/**
 * NOT `@/disclosure/decisions`, and the difference is checkable rather than a
 * matter of taste. Neither of these is a member of that canon's exported
 * `DecisionId` union, so there is no id to hand `DecisionDisclosure` and no
 * record for it to look up. Writing a second wording of an existing record
 * would be
 * exactly the drift that component exists to stop; minting a record inside the
 * canon is an edit to a wave-0 file this task may not make. So the two are
 * recorded here, in the module that owns them, and reported upward.
 */
export const DOH_08_CONTRADICTIONS = [
  {
    id: 'CONTRADICTION-LOT-RELEASE-SURFACE',
    grade: 'C1',
    row: 'release-a-severity-1-lot-hold',
    question:
      'On which surface is a Severity 1 lot hold released, and where does a Supervisor request one?',
    readings: [
      {
        text: "MOD-DOH-08's own control matrix puts the act on a Hub screen and gives the Quality Manager `Allowed` — Quality Manager only, uniformly, with the Supervisor prohibited and able to request release with a note.",
        locator: 'L28307',
      },
      {
        text: "MOD-DOH-08's own identity card says the opposite one line at a time: the \"mark evidence reviewed\" and \"release a lot hold\" decisions are Client Command Center actions executed through Hub services.",
        locator: 'L28285',
      },
      {
        text: 'WF-QLT-006 names the surface outright — Releasing a lot hold as Quality Manager, Surface: Client Command Center, Module `MOD-CC-13`, action 4 — and AC-WF-QLT-006-02 states that a Supervisor request creates an item, never a release.',
        locator: 'L54228 · L54242',
      },
      {
        text: "§9.2's ownership matrix: placement is automatic and on-device for Severity 1; release is Quality Manager only, uniformly, through the Hub lot service; Supervisors request with a note.",
        locator: 'L13423',
      },
      {
        text: '§26.7 resolves the surfaces: the single source of truth is that the Hub records and the release "is a Command Center action executed through Hub services", with the Command Center column carrying the Quality-Manager-only grant and the Supervisor request.',
        locator: 'L49579',
      },
      {
        text: 'Chapter 19 lists it among the acts explicitly not originated in the Hub: "releasing a lot hold, which is Client Command Center action number 4 and Quality Manager only".',
        locator: 'L26165',
      },
    ],
    commonToBoth:
      'The authority is identical under every reading — Quality Manager only, uniformly, with no exception by work type, risk class or tag — and so is the Supervisor request path and its mandatory note. What is contested is only which surface carries the control.',
    position:
      'No release control and no request control is built on this surface, and the row renders as a cross-surface statement carrying both halves in the cells\' own words. The Hub keeps what every reading gives it: it records placement, propagation and release, and displays the hold honestly as issued, then propagating, then in force per device. `CC_RELEASE_LOT_HOLD` already exists in `@/domain/commands`; a Hub release button would be a second release path for one record, which is the defect the seam rule exists to prevent.',
  },
  {
    id: 'CONTRADICTION-RECLASSIFICATION-SURFACE',
    grade: 'C1',
    row: 'reclassify-an-anomaly-severity',
    question:
      "On which surface does the reviewing Quality Manager reclassify an anomaly's severity?",
    readings: [
      {
        text: "MOD-DOH-08's own control matrix puts it on a Hub screen: `Allowed with conditions` — recorded reason mandatory.",
        locator: 'L28304',
      },
      {
        text: 'The source-of-truth matrix puts the act in the Client Command Center column — Quality Manager reclassification with a recorded reason at review time — and marks the Delivery Operations Hub column "mirrors and records; never the trigger".',
        locator: 'L49578',
      },
      {
        text: "§9.2's ownership matrix reads the other way for the same record: reclassification of an anomaly by the reviewing Quality Manager with a recorded reason, through the Hub summary service.",
        locator: 'L13426',
      },
      {
        text: '§3.3, restated inside this module, gives the bridge and the reclassification together without naming a surface for either: Severity 1 maps to Critical, Severity 2 and below to Concern, informational flags to Info, "and the reviewing Quality Manager may reclassify with a recorded reason".',
        locator: 'L28271',
      },
    ],
    commonToBoth:
      'The recorded reason is mandatory under every reading, and the Hub holds it. So the reason, the resulting severity and who recorded it are rendered here as facts this surface owns, and nothing about them depends on settling the surface question.',
    position:
      'No reclassification control is built here. The row is classified as an act of another surface and renders as a statement, because the standing rule is that a row describing another surface is never an enabled control here whatever its token reads. This build does NOT declare L49578 right and L13426 wrong: DEC-SEAM-001 records that §9.2 and §26.7 are not reconciled, and both readings render.',
  },
] as const satisfies readonly Doh08Contradiction[]

/* ==================================================================== *
 * WHAT THE SOURCE LEAVES UNANSWERED, RECORDED RATHER THAN FILLED IN.
 * ==================================================================== */

export interface Doh08Silence {
  readonly subject: string
  readonly statement: string
  readonly locator: string
}

export const UNSPECIFIED_IN_SOURCE = [
  {
    subject: 'The anomaly category list',
    statement:
      'Row 4 conditions the Quality Manager on "a fixed category list plus free text" and §4.7.3 says the list is fixed, but no category is ever named. The catalogue therefore ships EMPTY and no category is invented, the same non-invention rule DEC-TAX-002 applies to Job Types and Service Type tags.',
    locator: 'L28303 · L28271',
  },
  {
    subject: "The card's fallback identifiers name no write pattern",
    statement:
      'The identity card names `FB-DOH-COMPUTE-006` primary, `FB-DOH-EXPORT-009` for the export and `FB-DOH-NOTIF-004` for notifications, and no write pattern — although FIVE rows of this matrix are Hub writes: mark reviewed (3), flag an anomaly (4), resolve an anomaly (6), add a correction annotation (10) and set the review toggle (14). `FB-DOH-WRITE-002` is the register\'s own pattern for a failed write and is what `@/surfaces/doh/objects` names for this module\'s two commands; naming it is recorded as this build\'s reading and is not made to look like a card citation.',
    locator: 'L28294',
  },
  {
    subject: 'Three of the five prohibition columns on rows 3, 4, 6 and 9 to 12',
    statement:
      'The cells state the bare token `Explicitly prohibited` and qualify it nowhere. The silence is recorded rather than filled in with a cause this build invented, which would read back as the source\'s.',
    locator: 'L28302-L28311',
  },
  {
    subject: 'The Tenant Admin holds two grants on a module it does not reach',
    statement:
      'Rows 1, 7 and 12 give the Tenant Admin `Allowed` on viewing a Summary, viewing the Anomaly Register and exporting, while row 2 marks it `Unavailable` on the review queue — and `Unavailable` withholds the whole module. The grants are real and are met on no screen in this slice. Recorded, not resolved in either direction.',
    locator: 'L28300 · L28301 · L28306 · L28311',
  },
] as const satisfies readonly Doh08Silence[]

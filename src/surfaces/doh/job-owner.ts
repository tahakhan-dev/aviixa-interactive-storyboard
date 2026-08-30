/**
 * The Job-Owner-of-record predicate. ONE predicate, two modules, three rows.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * JOB OWNER IS A FIELD ON THE JOB RECORD. IT IS NOT A ROLE.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The source says so three times, in three different Parts, and once in the
 * chapter whose whole subject is the closed role set. Each quotation is bound
 * to its own line, one per paragraph, because L27652 and L7151 say nearly the
 * same thing in different words and that is exactly when a quotation binds to
 * the wrong one of them.
 *
 * The Hub module's own statement, carrying the routing clause, at
 * L27652: "Job Owner is a field on the Job, not a role. It names the
 * accountable user to whom version-adoption decisions and paired-Job change
 * flags are routed. It confers no permissions; the five-role model is
 * unchanged by it." (§4.5.1.)
 *
 * The domain-model statement, carrying the same routing clause and differing
 * only in wording, at
 * L7151: "Job Owner is a field on the Job record and not a role. It names the
 * accountable user to whom version-adoption decisions and paired-Job change
 * flags are routed, and it confers no permissions". (§3.5, §4.5.1.)
 *
 * The FIVE-ROLES statement, in which Job Owner appears as a subordinate
 * clause rather than as the subject, at
 * L16282: "There are five fixed roles at V1; custom roles are deferred beyond
 * V1". The same sentence later adds that Job Owner is a field on the Job
 * record, not a role. (§4.8.1, §3.5.)
 *
 * Against that, catalogue A at L26074 gives `SCR-DOH-024`, the paired
 * scheduling view, a Primary role of **"Supervisor and Job Owner"**. Read as
 * a role list, that mints a sixth tenant role. `RoleId` in `@/domain/roles`
 * is a closed nine-member union with a compile-time exhaustiveness check
 * against `ROLES`, so a sixth tenant role cannot be added there quietly —
 * but a sixth role added there and given `reachableSurfaces` would carry
 * permissions to every Job at once, which is precisely the escalation
 * L27652's "it confers no permissions" closes. Catalogue A is naming the
 * two audiences of a screen, not two roles.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE SHAPE THAT MAKES ROLE-NESS INEXPRESSIBLE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A guard would be `if (role === 'JOB_OWNER') throw`. This file has no such
 * guard, because the question a guard would forbid is not typeable here:
 *
 * 1. **The verdict cannot be reached without naming a Job.** `jobOwnerVerdict`
 *    takes a `JobOwnerBearing` whose `jobId` and `ownerId` are both REQUIRED,
 *    not optional. A role is a property of an identity ALONE — "is Priya a
 *    Job Owner?" — and there is no function here with that signature. Only
 *    "is Priya the value of THIS Job's owner field?" can be asked. That is
 *    the whole escalation closed at the type level: an answer that does not
 *    carry a `jobId` cannot be produced, so it cannot be cached, passed to a
 *    role gate, or intersected into an allow-list.
 * 2. **The verdict carries the Job it was read from.** `JobOwnerVerdict`
 *    keeps `jobId` and `ownerId`, so a consumer that widens the answer to a
 *    second Job has to discard a field it can see, in its own code.
 * 3. **No role import decides anything.** `RoleId` is imported for one
 *    purpose only — naming which COLUMN of the source's five-column matrix a
 *    disclosed contradiction sits in. It never appears in the predicate.
 * 4. `_noIdentityOnlyOverload` below is a compile-time assertion that the
 *    predicate's own type is not assignable to the role-shaped signature.
 *
 * See also `src/studio/modules/stu-12/matrix.ts` and `versions.ts`, which
 * carry the SURF-STU half of the same rule (the seventh column of the
 * MOD-STU-12 matrix, and `adoptionRowFor`). Those are slice 5's and are not
 * rewritten here; this file is the surface-neutral home the Hub consumes,
 * and the two should be reconciled onto it in a later pass.
 */

import type { RoleId } from '@/domain/roles'

/**
 * The two fields of a Job record this predicate reads, and nothing else.
 *
 * Deliberately a structural minimum rather than the full `JobRecord` from
 * `./objects`: the predicate must not be able to consult a Job's state, its
 * scope, its approver or its parent node, because none of those is the owner
 * field and reaching for one is how "field, not role" turns back into a
 * permission model.
 *
 * Both fields are REQUIRED. `ownerId?: string` would let a caller pass a
 * Job whose owner field was never read and get `held: false` — silently
 * denying the accountable user their own routing.
 */
export interface JobOwnerBearing {
  readonly jobId: string
  readonly ownerId: string
}

/**
 * The answer, always about one named Job. There is no variant of this type
 * that omits `jobId`, which is what stops the answer from being reused as
 * "this identity is a Job Owner".
 */
export interface JobOwnerVerdict {
  readonly held: boolean
  readonly jobId: string
  /** The value of the Job's owner field, as read. Never an identity's role. */
  readonly ownerId: string
  /** Plain language for the audit trail and for the screen. Never a bare boolean. */
  readonly reason: string
}

/**
 * Is this identity the value of THIS Job's owner field?
 *
 * The comparison is `===` on the owner field. It is not a role lookup, not a
 * scope intersection and not a grant check, because L27652 says the field
 * "confers no permissions" — it ROUTES. What the routing then permits is
 * stated per row by the module matrices, and those rows are registered below.
 */
export function jobOwnerVerdict(job: JobOwnerBearing, identityId: string): JobOwnerVerdict {
  const held = job.ownerId === identityId
  return {
    held,
    jobId: job.jobId,
    ownerId: job.ownerId,
    reason: held
      ? `${identityId} is the value of the Job Owner field on ${job.jobId}. The field routes this act; it confers no permissions of its own (L27652).`
      : `The Job Owner field on ${job.jobId} names ${job.ownerId}, not ${identityId}. Job Owner is a field on the Job record and not a role, so no role grants this act on this Job (L7151, L16282).`,
  }
}

/**
 * Compile-time proof of point 4 above.
 *
 * `RoleShaped` is the signature a ROLE check would have: an identity in, an
 * answer out, no Job named anywhere. It returns `JobOwnerVerdict` on purpose
 * — differing return types would make the assertion pass for a reason that
 * has nothing to do with the Job, and an assertion that passes for the wrong
 * reason is worse than none. So the ONLY thing separating the two signatures
 * here is that `jobOwnerVerdict` demands a Job and `RoleShaped` does not.
 *
 * Make `job` optional, or reorder it behind `identityId`, and the predicate
 * becomes assignable to `RoleShaped`: `Extract` stops being `never` and this
 * line fails to build. That is the escalation caught at compile time rather
 * than forbidden by a runtime guard.
 */
type RoleShaped = (identityId: string) => JobOwnerVerdict
type _NoIdentityOnly = Extract<typeof jobOwnerVerdict, RoleShaped> extends never ? true : never
const _noIdentityOnlyOverload: _NoIdentityOnly = true
void _noIdentityOnlyOverload

/* ==================================================================== *
 * THE THREE ROWS THIS ONE PREDICATE GATES
 * ==================================================================== */

/**
 * Two modules, three rows. Registered here rather than copied into each
 * module so the three cannot drift apart — which is the whole reason the
 * predicate is shared rather than reimplemented per module.
 *
 * These are ROW IDENTITIES and their verbatim Tenant Admin cells. The full
 * five-column matrices belong to the module tasks (MOD-DOH-05, MOD-DOH-16);
 * a second copy of them here would be a second spelling of the same rows.
 */
export type JobOwnerGatedRowId =
  | 'mod-doh-05-row-10-decide-a-notified-class-version-adoption'
  | 'mod-doh-16-row-4-receive-the-review-flag'
  | 'mod-doh-16-row-5-act-on-the-review-flag'

export interface JobOwnerGatedRow {
  readonly id: JobOwnerGatedRowId
  readonly module: 'MOD-DOH-05' | 'MOD-DOH-16'
  /** The action column, verbatim. */
  readonly action: string
  readonly sourceLine: string
}

export const JOB_OWNER_GATED_ROWS = [
  {
    id: 'mod-doh-05-row-10-decide-a-notified-class-version-adoption',
    module: 'MOD-DOH-05',
    action: 'Decide a notified-class version adoption',
    sourceLine: 'L27703',
  },
  {
    id: 'mod-doh-16-row-4-receive-the-review-flag',
    module: 'MOD-DOH-16',
    action: 'Receive the review flag',
    sourceLine: 'L29616',
  },
  {
    id: 'mod-doh-16-row-5-act-on-the-review-flag',
    module: 'MOD-DOH-16',
    action: 'Act on the review flag',
    sourceLine: 'L29617',
  },
] as const satisfies readonly JobOwnerGatedRow[]

type MissingFromGatedRows = Exclude<JobOwnerGatedRowId, (typeof JOB_OWNER_GATED_ROWS)[number]['id']>
const _gatedRowsExhaustive: MissingFromGatedRows extends never ? true : never = true
void _gatedRowsExhaustive

/* ==================================================================== *
 * THE MOD-DOH-16 CONTRADICTION, DISCLOSED RATHER THAN AVERAGED
 * ==================================================================== */

/**
 * MOD-DOH-16 rows 4 and 5 contradict each other **on the Tenant Admin column
 * specifically**, and only there.
 *
 * Row 4, "Receive the review flag" (L29616), Tenant Admin:
 *     `Not applicable — the flag routes to the paired Job's Owner`
 * Row 5, "Act on the review flag" (L29617), Tenant Admin:
 *     `Allowed with conditions` — where the Tenant Admin is the paired Job's Owner
 *
 * WHAT THEY ACTUALLY SAY, having read both. Row 4's Supervisor and Quality
 * Manager cells read `Allowed with conditions` — where the Supervisor / the
 * Quality Manager is the paired Job's Owner: the SAME conditional form row 5
 * gives the Tenant Admin. The Tenant Admin cell in row 4 is the only cell in
 * either row that answers `Not applicable`, and its stated reason — "the flag
 * routes to the paired Job's Owner" — is a reason that applies identically to
 * the two columns beside it, which nevertheless answer `Allowed with
 * conditions`. Row 5 then states outright that a Tenant Admin CAN be the
 * paired Job's Owner. Row 4's reason is therefore only coherent if "the
 * paired Job's Owner" is a distinct party from the Tenant Admin — which is
 * the sixth-role reading, the one L27652, L7151 and L16282 close.
 *
 * WHY IT IS NOT AVERAGED. The two obvious resolutions are both silent
 * settlements of a client question:
 * - Pick row 5 ("a Tenant Admin who owns the paired Job receives the flag")
 *   and row 4's `Not applicable` is deleted from the build.
 * - Pick row 4 ("Tenant Admins never receive it") and row 5's condition is
 *   unreachable, so an act the source allows renders as absent.
 * A third, worse resolution makes the contradiction disappear by treating
 * Job Owner as a role, so that "Tenant Admin" and "the paired Job's Owner"
 * are different columns and neither row is about the other. That is the
 * privilege-escalation path.
 *
 * THE STRUCTURE. `readings` is a fixed-length tuple of exactly two, and
 * `JobOwnerContradiction` has **no `adopted`, `resolution`, `winner` or
 * `effective` field**. There is nowhere to put an average. A consumer that
 * wants one answer must choose one of the two in its own file, where a
 * reviewer can see the choice.
 */
export interface JobOwnerContradictionReading {
  readonly rowId: JobOwnerGatedRowId
  /** The cell, verbatim, including its backticked status token. */
  readonly cell: string
  readonly sourceLine: string
}

export interface JobOwnerContradiction {
  readonly id: 'CONTRADICTION-MOD-DOH-16-TENANT-ADMIN-REVIEW-FLAG'
  /** The one column the two rows disagree about. */
  readonly column: RoleId
  /** Exactly two. Not a list that might one day hold a third, adopted, entry. */
  readonly readings: readonly [JobOwnerContradictionReading, JobOwnerContradictionReading]
  /** Why a reader is being shown two answers instead of one. */
  readonly statement: string
}

export const MOD_DOH_16_TENANT_ADMIN_CONTRADICTION: JobOwnerContradiction = {
  id: 'CONTRADICTION-MOD-DOH-16-TENANT-ADMIN-REVIEW-FLAG',
  column: 'TENANT_ADMIN',
  readings: [
    {
      rowId: 'mod-doh-16-row-4-receive-the-review-flag',
      cell: "`Not applicable — the flag routes to the paired Job's Owner`",
      sourceLine: 'L29616',
    },
    {
      rowId: 'mod-doh-16-row-5-act-on-the-review-flag',
      cell: "`Allowed with conditions` — where the Tenant Admin is the paired Job's Owner",
      sourceLine: 'L29617',
    },
  ],
  statement:
    "MOD-DOH-16 answers the Tenant Admin column twice and the two answers cannot both hold. Row 4 (L29616) says the review flag is Not applicable to a Tenant Admin because it routes to the paired Job's Owner; row 5 (L29617) says a Tenant Admin may act on that flag where the Tenant Admin IS the paired Job's Owner. Row 4's own reason presumes the paired Job's Owner is somebody other than the Tenant Admin, which is the reading L27652, L7151 and L16282 close: Job Owner is a field on the Job record and not a sixth role. Both cells are shown because the source states both and settles neither, and because averaging them would decide, without the client, whether an owning Tenant Admin is notified at all.",
}

/* ==================================================================== *
 * THE GATE
 * ==================================================================== */

/**
 * A gated row's answer for one identity on one Job.
 *
 * `settled` carries one cell. `disclosed` carries no single cell at all — it
 * carries both readings — so a caller physically cannot render the disclosed
 * case as one answer without first choosing, in its own code, which reading
 * to render. That is the mechanism: the contradiction is not forbidden by a
 * guard, it is unrepresentable as a single cell.
 */
export type JobOwnerGateResult =
  | {
      readonly kind: 'settled'
      readonly row: JobOwnerGatedRow
      readonly verdict: JobOwnerVerdict
    }
  | {
      readonly kind: 'disclosed'
      readonly row: JobOwnerGatedRow
      readonly verdict: JobOwnerVerdict
      readonly contradiction: JobOwnerContradiction
    }

const ROW_BY_ID = new Map<JobOwnerGatedRowId, JobOwnerGatedRow>(
  JOB_OWNER_GATED_ROWS.map((r) => [r.id, r]),
)

export function jobOwnerGatedRow(id: JobOwnerGatedRowId): JobOwnerGatedRow {
  const found = ROW_BY_ID.get(id)
  if (!found) throw new Error(`Unknown Job-Owner-gated row: ${id}`)
  return found
}

/**
 * The one entry point the module tasks call.
 *
 * The verdict is computed for every row and every role — the owner field is
 * read the same way whoever is asking, because it is a field. The role only
 * decides whether the answer is ALSO contradicted, and it is contradicted in
 * exactly one place: the Tenant Admin column of MOD-DOH-16's two review-flag
 * rows.
 */
export function jobOwnerGate(
  rowId: JobOwnerGatedRowId,
  role: RoleId,
  job: JobOwnerBearing,
  identityId: string,
): JobOwnerGateResult {
  const row = jobOwnerGatedRow(rowId)
  const verdict = jobOwnerVerdict(job, identityId)
  const contradicted =
    role === MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.column &&
    MOD_DOH_16_TENANT_ADMIN_CONTRADICTION.readings.some((r) => r.rowId === rowId)
  return contradicted
    ? { kind: 'disclosed', row, verdict, contradiction: MOD_DOH_16_TENANT_ADMIN_CONTRADICTION }
    : { kind: 'settled', row, verdict }
}

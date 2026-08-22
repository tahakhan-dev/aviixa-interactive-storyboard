import { HUB_COMMAND_TYPES, type HubCommandType } from '@/domain/commands'
import type { RoleId } from '@/domain/roles'
import { CC13_OWNING_PLACES } from '@/surfaces/cc/actions/action-set'
import { DOH_MODULES, type DohModuleId } from '@/surfaces/doh/modules'
import { HUB_COMMAND_SPECS, type HubCommandSpec } from '@/surfaces/doh/objects'
import type { SeamReading } from './chapter-26'

/**
 * SEAM 21 — ONE SERVICE, TWO CALLERS, AND THE ASSERTION NO MODULE TASK CAN
 * MAKE.
 *
 * `AC-SEAM-21-01` (L50227) is the whole reason this is a task: the Command
 * Center reassign action and the Hub assignment screen must invoke the same
 * service entry point. `TEST-SEAM-21-01` (L50228) states the method — trace
 * both callers and assert one service entry point — and neither side can run
 * it, because each module task sees one caller and has to take the other on
 * trust. The source states the equivalence five times and every statement is
 * on one side or the other: L13421 in the ownership matrix, L38672 in this
 * surface's authority table, L28122 and L28193 in the Hub's assignment
 * module, and L53791 in the execution workflow.
 *
 * ── WHAT "THE SAME ENTRY POINT" MEANS IN THIS TREE ────────────────────────
 * `src/scenario/gateway.ts` is the application's only mutation entry point
 * and says so in its own banner; `reduce` and `commitTransition` are imported
 * there and nowhere else. Every Hub act reaches it as a member of
 * `HubCommand`, whose access rule, action class and fallback pattern are
 * declared exactly once per command in `HUB_COMMAND_SPECS`. So the entry
 * point a caller invokes IS the command spec its act resolves to, and two
 * callers share an entry point when their acts resolve to one spec.
 *
 * NO SCREEN CALLS THAT GATEWAY IN THIS BUILD, and this file does not pretend
 * otherwise. `dispatch` is imported by `src/scenario/store.ts` and by two
 * unit suites, and by no page and no panel — this is a storyboard, and a
 * storyboard has no execution path to trace. The equivalence is therefore
 * asserted over the registry the gateway routes through, which is where a
 * second implementation would have to appear before any screen could call
 * one. Claiming a traced call graph would be false, and the criterion the
 * source names is about the service, not about the click.
 *
 * ── HOW EACH CALLER RESOLVES, AND WHY THAT IS NOT A LABEL COMPARISON ──────
 * Each caller is resolved through the row of `MOD-DOH-07`'s own matrix that
 * states it, by asking `HUB_COMMAND_SPECS` which commands name that row:
 *
 *   Hub assignment screen   L28121, row 3, `Substitute a worker mid-run`
 *   Command Center action 8 L28122, row 4, `Reassign a run mid-shift from
 *                           the Client Command Center`
 *
 * The Hub caller resolves to exactly one command. THE COMMAND CENTER CALLER
 * RESOLVES TO NONE, AND THAT EMPTINESS IS THE GUARANTEE RATHER THAN A GAP:
 * there is no Hub-side reassign command because the act is the Hub's
 * substitution, called from somewhere else. So the assertion is not that two
 * strings match — it is that the UNION of every entry point serving either
 * caller's row has exactly one member. A second implementation on either side
 * puts a second member in that union, `reassignEntryPoint` refuses to answer,
 * and the suite goes red. Two labels being equal would survive that; this
 * does not.
 */

export type ReassignCallerId = 'SURF-CC' | 'SURF-DOH'

export interface ReassignCaller {
  readonly id: ReassignCallerId
  /** What this caller is, in one line. */
  readonly caller: string
  /**
   * The `MOD-DOH-07` matrix row that states this caller, spelled the way
   * `HUB_COMMAND_SPECS` spells a row reference in its `sourceRefs`.
   */
  readonly hubMatrixRow: string
  readonly rowLine: number
  /** The row's `Action` column, verbatim and header-keyed. */
  readonly action: string
}

export const REASSIGN_CALLERS = [
  {
    id: 'SURF-DOH',
    caller:
      'The Delivery Operations Hub assignment screen, substituting a worker on its own surface',
    hubMatrixRow: 'MOD-DOH-07 row 3',
    rowLine: 28121,
    action: 'Substitute a worker mid-run',
  },
  {
    id: 'SURF-CC',
    caller: 'The Client Command Center reassign action, action 8 of the closed set of ten',
    hubMatrixRow: 'MOD-DOH-07 row 4',
    rowLine: 28122,
    action: 'Reassign a run mid-shift from the Client Command Center',
  },
] as const satisfies readonly ReassignCaller[]

export const REASSIGN_CALLER_IDS: readonly ReassignCallerId[] = REASSIGN_CALLERS.map((c) => c.id)

export function reassignCaller(id: ReassignCallerId): ReassignCaller {
  const found = REASSIGN_CALLERS.find((c) => c.id === id)
  if (found === undefined) throw new Error(`Unknown reassign caller: ${id}`)
  return found
}

/**
 * Every Hub command whose declared access rule names this caller's row. Read
 * off `HUB_COMMAND_SPECS` at call time, so a command that acquires the row
 * tomorrow is counted tomorrow.
 */
export function reassignEntryPoints(id: ReassignCallerId): readonly HubCommandType[] {
  const row = reassignCaller(id).hubMatrixRow
  return HUB_COMMAND_TYPES.filter((t) => HUB_COMMAND_SPECS[t].access.sourceRefs.includes(row))
}

/** The union over both callers, which is the set the equivalence is about. */
export function reassignEntryPointsAcrossCallers(): readonly HubCommandType[] {
  const seen = new Set<HubCommandType>()
  for (const id of REASSIGN_CALLER_IDS) for (const t of reassignEntryPoints(id)) seen.add(t)
  return [...seen]
}

/**
 * The one entry point both callers invoke. REFUSES TO ANSWER on anything but
 * exactly one, because "the same entry point" is meaningless where the act
 * has two and false where it has none.
 */
export function reassignEntryPoint(): HubCommandType {
  const all = reassignEntryPointsAcrossCallers()
  if (all.length !== 1) {
    throw new Error(
      `Seam 21 requires one service entry point across both callers and found ${all.length}` +
        `${all.length === 0 ? '' : `: ${all.join(', ')}`}. AC-SEAM-21-01 is the criterion, and a ` +
        `second entry point is the drift the seam exists to prevent.`,
    )
  }
  return all[0] as HubCommandType
}

/** The spec object itself — one object, so both callers hold the same reference. */
export function reassignEntryPointSpec(): HubCommandSpec {
  return HUB_COMMAND_SPECS[reassignEntryPoint()]
}

/* ==================================================================== *
 * THE COMMAND CENTER'S OWN EVIDENCE — the `Executes via` column.
 * ==================================================================== */

/**
 * The `Executes via` cell for action 8 (L38672), as `MOD-CC-13`'s task read
 * it. It names a service rather than a record — the only one of the ten that
 * does — and the sentence it names it in is the equivalence itself.
 *
 * The Hub module behind that name is resolved rather than asserted:
 * `ASSIGNMENT_WORD` is the distinguishing word, exactly one `DOH_MODULES`
 * row carries it, and that row is `MOD-DOH-07`. A word matched against the
 * whole surface name would not do — `Operations` sits in `Delivery
 * Operations Hub` and in another module's name at once.
 */
export const ASSIGNMENT_WORD = 'Assignment'

export const CC_ACTION_8_OWNING_PLACE: string = (() => {
  const row = CC13_OWNING_PLACES.find((p) => p.ordinal === 8)
  if (row === undefined || row.owningPlace === null) {
    throw new Error('MOD-CC-13 action 8 has no owning place; L38672 names one.')
  }
  return row.owningPlace
})()

export const HUB_MODULE_BEHIND_ACTION_8: DohModuleId = (() => {
  const matches = DOH_MODULES.filter((m) => m.name.includes(ASSIGNMENT_WORD))
  if (matches.length !== 1) {
    throw new Error(
      `Exactly one Hub module should carry "${ASSIGNMENT_WORD}" in its name; found ${matches.length}.`,
    )
  }
  return matches[0]!.id
})()

/* ==================================================================== *
 * WHAT ONE SERVICE WITH TWO CALLERS CANNOT DO — the Quality Manager.
 * ==================================================================== */

/**
 * THE TWO CALLERS' QUALITY MANAGER CELLS DISAGREE, AND ONE SERVICE CANNOT
 * SATISFY BOTH. This is the finding that only a cross-surface reading
 * produces: each module task sees one cell and neither sees the pair.
 *
 * Read header-keyed off L28117, whose columns run Action, Tenant Admin,
 * Supervisor, Quality Manager, Read-only Auditor, Worker. Both readings are
 * carried and NEITHER IS ADOPTED. `DEC-PLUS-001` (L13456) is the recorded
 * open decision that leaves "and above" undefined across five additive,
 * non-hierarchical roles; it is named here and re-spelled nowhere.
 */
export const QUALITY_MANAGER_ON_THE_TWO_CALLERS = [
  {
    reading:
      'On the Hub assignment screen the Quality Manager is Explicitly prohibited from substituting a worker mid-run. The cell is bare, with no note and no destination.',
    sourceRefs: ['L28121'],
  },
  {
    reading:
      'Through the Command Center reassign action the Quality Manager is Allowed with conditions, the condition being stated as Supervisor and above; the seam contract states the same authority for both callers.',
    sourceRefs: ['L28122', 'L50216'],
  },
] as const satisfies readonly SeamReading[]

/**
 * What the built entry point actually admits, read off the spec rather than
 * restated. A FUNCTION rather than a constant, so a second entry point fails
 * one assertion instead of failing this module’s import and reddening every
 * unrelated check in the suite with it. It follows the Hub screen's row and refuses the Command Center's
 * — which is a position, taken by the slice that built the command, and it is
 * reported here rather than changed from another surface's file.
 */
export function builtEntryPointRoles(): {
  readonly allowed: readonly RoleId[]
  readonly denied: readonly RoleId[]
  readonly openDecision: string
  readonly openDecisionRef: string
} {
  const access = reassignEntryPointSpec().access
  return {
    allowed: access.allowedRoles,
    denied: access.deniedRoles ?? [],
    openDecision: 'DEC-PLUS-001',
    openDecisionRef: 'L13456',
  }
}

/* ==================================================================== *
 * THE CRITERION, ITS TEST, AND THE FIVE PLACES THE SOURCE STATES IT.
 * ==================================================================== */

export const SEAM_21_EQUIVALENCE = {
  criterion: 'AC-SEAM-21-01',
  criterionRef: 'L50227',
  namedTest: 'TEST-SEAM-21-01',
  namedTestRef: 'L50228',
  statedAt: ['L13421', 'L28122', 'L28193', 'L38672', 'L53791'],
  whatIsAsserted:
    'The union of every Hub command whose access rule names either caller row has exactly one member, so both callers invoke one service entry point. Not that the two cells read alike, and not that the two surfaces produce the same text.',
  whatIsNotAsserted:
    'That either screen calls the gateway. No page imports dispatch in this build, so no call graph exists to trace; the assertion is over the command registry the gateway routes through.',
} as const

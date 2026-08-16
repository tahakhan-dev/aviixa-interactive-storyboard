import type { Clock } from '@/domain/clock'
import type { ScenarioDomainState } from '@/domain/state'
import type { ScenarioRunId } from '@/domain/ids'

export interface RunLineage {
  readonly runId: ScenarioRunId
  readonly parentRunId: ScenarioRunId | null
  readonly branchedFromSequence: number | null
  readonly createdAtLogical: number
}

/**
 * A checkpoint restore never rewrites history: it creates a NEW run carrying
 * explicit parent lineage, and returns a new state object -- the parent
 * passed in is never mutated, only read. Replaying from an earlier point
 * always produces a new branch, never an edit to the run it branched from.
 *
 * `atSequence` is recorded as where the branch was taken from, but nothing
 * here truncates or replays the parent's ledger back to that point: this
 * function only has the parent's current `ScenarioDomainState` to work with,
 * not its full snapshot history, so the branch starts as a full copy of the
 * parent's current state under the new run id.
 */
export async function branchFrom(
  state: ScenarioDomainState,
  atSequence: number,
  newRunId: ScenarioRunId,
  clock: Clock,
): Promise<{ readonly lineage: RunLineage; readonly state: ScenarioDomainState }> {
  if (atSequence < 0 || atSequence > state.sequence) {
    throw new Error(
      `Branch sequence ${atSequence} is out of range for parent run "${state.runId}" at sequence ${state.sequence}`,
    )
  }
  if (newRunId === state.runId) {
    throw new Error(`Branch run id must differ from the parent's run id "${state.runId}"`)
  }

  const lineage: RunLineage = {
    runId: newRunId,
    parentRunId: state.runId,
    branchedFromSequence: atSequence,
    createdAtLogical: clock.now(),
  }

  const branchedState: ScenarioDomainState = {
    ...state,
    runId: newRunId,
  }

  return { lineage, state: branchedState }
}

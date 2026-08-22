import type { CcModuleId } from './modules'

/**
 * The `SURF-CC` cross-slice seam registry.
 *
 * TWO ROWS, AND BOTH ARE DECLARED HERE RATHER THAN DISCOVERED IN SLICE 9.
 * Slice 8 builds two Command Center modules — `MOD-CC-02` and `MOD-CC-10` —
 * into a surface whose other eleven modules and all thirteen screens arrive
 * in slice 9. Each of those two therefore reaches for a half that does not
 * exist yet, and a silent stub is the defect a seam registry exists to
 * prevent: the shipped idiom is a named interface stating plainly which
 * slice owns the missing half, as `src/surfaces/doh/seams.ts` and
 * `src/studio/seams.ts` already do.
 *
 * `status` is DERIVED from `ownerSlice`, never stored beside it, for the
 * reason `dohSeamStatus` gives: a second field is a second thing to keep in
 * step, and it will not be kept in step.
 *
 * ── BOTH ROWS ARE NOW CLOSED, AND EACH WAS CHECKED SEPARATELY ─────────────
 * Slice 9 built both owning halves and no slice-9 task owned this file, so
 * the number stayed at 8 while both rows named 9 and both therefore reported
 * `open`. It was the second thing to keep in step that removing the stored
 * `status` field was supposed to prevent — moved one level up rather than
 * removed. `THIS_SLICE` now reads 9, and neither closure was taken on the
 * calendar's word alone:
 *
 * - `sync-state-chrome-host` — the recorded expectation was that `MOD-CC-01`
 *   would give `MOD-CC-02`'s chrome a host. `app/command-center/
 *   live-shift-board/page.tsx` passes `chrome={<BoardSyncChrome />}`, which
 *   is that host, filled with `MOD-CC-02`'s own components.
 *   RECORDED EXPECTATION CORRECT.
 * - `operational-action-set` — the recorded expectation was that action 5
 *   would belong to `MOD-CC-13`'s set rather than to the panel.
 *   `src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx` exists and is mounted
 *   by every module screen that exercises an action, the sync-conflict review
 *   panel among them. RECORDED EXPECTATION CORRECT.
 *
 * ── WHAT A CLOSED ROW SAYS, AND WHY IT IS NOT A THIRD IDIOM ───────────────
 * `whatIsMissing` is written in the tense of the seam's own status FROM HERE,
 * not frozen at the moment the consumer was built. That is `SURF-DOH`'s
 * shipped answer — its `worker-shift-meter` row carries the note explaining
 * that a heading reading "closed" over a description saying "stubs the
 * inputs here" is the heading contradicting itself — and `SURF-STU` never
 * faced the question because its `contract` field is status-neutral. This
 * field is not: it was written in the present tense of an absent half, so
 * closing the row without rewriting it would leave prose that is false in a
 * second way.
 *
 * THE ROWS ARE KEPT. A closed row is the evidence that the seam was declared
 * before the half existed and then honoured; deleting it throws that away and
 * leaves nothing to distinguish a seam that was planned from one nobody ever
 * looked up. What a closed row must NOT do is claim more than the calendar
 * plus the evidence above — the rule `src/ui/doh/SeamNotice.tsx` states for
 * the component that draws one.
 *
 * WHERE A CLOSED ROW STILL RENDERS. `CommandCenterShell`'s local `SeamNotice`
 * returns `null` for a closed seam, so the two mount points fall silent on
 * closure: a screen that is not `SCR-CC-02` draws no chrome because the
 * chrome is not its to draw, which is a different statement from the absence
 * the notice used to make. `MOD-CC-10`'s panel prints this field
 * unconditionally under "What this panel does not own", so the row that has a
 * screen still states its record on it.
 */
const THIS_SLICE = 9

export type CcSeamId = 'sync-state-chrome-host' | 'operational-action-set'

export interface CcSeamDefinition {
  readonly id: CcSeamId
  /** The module built now that needs the missing half. */
  readonly consumingModule: CcModuleId
  /** The module that owns the missing half. */
  readonly owningModule: CcModuleId
  /** The slice that builds the owning half. */
  readonly ownerSlice: number
  /**
   * What is missing, and what the consuming module does without it — while
   * the row is `open`. On a `closed` row this is the record of what was
   * missing and what closed it, written in the tense of the status the
   * derivation gives it now. The name is the open row's name and it is kept:
   * renaming the field would touch `CommandCenterShell` and `MOD-CC-10`'s
   * panel, neither of which is this change's to edit.
   */
  readonly whatIsMissing: string
  /** The frozen-source line that makes this a seam rather than a guess. */
  readonly sourceRef: string
}

export const CC_SEAMS = [
  {
    id: 'sync-state-chrome-host',
    consumingModule: 'MOD-CC-02',
    owningModule: 'MOD-CC-01',
    ownerSlice: 9,
    whatIsMissing:
      'MOD-CC-02 is surface chrome and owns no route, so it has no screen of its own to render on. The register puts it on SCR-CC-02 beside MOD-CC-01, and MOD-CC-01 — the live shift board that hosts the freshness marker, the device list and the connectivity banner — was slice 9\'s to build. That board landed in this slice and is the host: app/command-center/live-shift-board/page.tsx passes the chrome into the shell as MOD-CC-02\'s own components. The row is kept because it said where the chrome had to end up before there was anywhere to put it, and a screen that is not SCR-CC-02 now draws no chrome because the chrome is not that screen\'s rather than because it does not exist.',
    sourceRef: 'L48387',
  },
  {
    id: 'operational-action-set',
    consumingModule: 'MOD-CC-10',
    owningModule: 'MOD-CC-13',
    ownerSlice: 9,
    whatIsMissing:
      'Resolve and Resolve All are not MOD-CC-10\'s own powers; they are action 5 of MOD-CC-13\'s closed set of ten, executed through the owning Delivery Operations Hub service. MOD-CC-13 was slice 9\'s to build and it landed in this slice. It still appears in no row of the screen register, so it owns no screen of its own — the action set reaches a client only by its control rail mounting inside another module\'s screen, and this panel is one of the screens that mounts it. So the panel exercises action 5 rather than implementing resolution, which is the drift the closed set exists to prevent — MOD-CC-13 (L38175) reads "exercises action 5 of `MOD-CC-13`".',
    sourceRef: 'L38669',
  },
] as const satisfies readonly CcSeamDefinition[]

export function ccSeam(id: CcSeamId): CcSeamDefinition {
  const found = CC_SEAMS.find((s) => s.id === id)
  if (found === undefined) throw new Error(`Unknown Command Center seam: ${id}`)
  return found
}

export type CcSeamStatus = 'open' | 'closed'

export function ccSeamStatus(seam: CcSeamDefinition): CcSeamStatus {
  return seam.ownerSlice <= THIS_SLICE ? 'closed' : 'open'
}

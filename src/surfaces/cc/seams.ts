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
 */
const THIS_SLICE = 8

export type CcSeamId = 'sync-state-chrome-host' | 'operational-action-set'

export interface CcSeamDefinition {
  readonly id: CcSeamId
  /** The module built now that needs the missing half. */
  readonly consumingModule: CcModuleId
  /** The module that owns the missing half. */
  readonly owningModule: CcModuleId
  /** The slice that builds the owning half. */
  readonly ownerSlice: number
  /** What is missing, and what the consuming module does without it. */
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
      'MOD-CC-02 is surface chrome and owns no route, so it has no screen of its own to render on. The register puts it on SCR-CC-02 beside MOD-CC-01, and MOD-CC-01 — the live shift board that hosts the freshness marker, the device list and the connectivity banner — is slice 9\'s. Until that board exists there is no host, and the honest statement is that the chrome has nowhere to be rather than that it is absent.',
    sourceRef: 'L48387',
  },
  {
    id: 'operational-action-set',
    consumingModule: 'MOD-CC-10',
    owningModule: 'MOD-CC-13',
    ownerSlice: 9,
    whatIsMissing:
      'Resolve and Resolve All are not MOD-CC-10\'s own powers; they are action 5 of MOD-CC-13\'s closed set of ten, executed through the owning Delivery Operations Hub service. MOD-CC-13 is slice 9\'s and appears in no row of the screen register at all, so the action set has neither a module nor a screen in this slice. A sync-conflict panel that implements resolution itself, rather than exercising action 5, is the drift the closed set exists to prevent — MOD-CC-13 (L38175) reads "exercises action 5 of `MOD-CC-13`".',
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

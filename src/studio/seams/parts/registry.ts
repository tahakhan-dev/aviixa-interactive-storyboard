import type { TenantId } from '@/domain/ids'

/**
 * THE PARTS REGISTRY SEAM — the far side of `MOD-STU-10`, and the one
 * dependency on this surface that BELONGS TO NO SLICE IN THE BUILD ORDER.
 *
 * `MOD-DOH-19` Parts Registry is registered in the module inventory as
 * `not-represented`, was explicitly EXCLUDED from slice 4, and is named in
 * no later slice's stated scope. `MOD-STU-10` depends on it entirely. The
 * seam row in `@/studio/seams` carries `ownerSlices: []`, which is what
 * makes `stuSeamStatus` derive `unscheduled` and what makes
 * `StudioSeamNotice` render "Owner stated, no slice assigned" — the owner is
 * known and the schedule is not, and neither half is invented from the
 * other. This file is the CONTRACT that goes with that declaration.
 *
 * R21 — A STUB THAT ALWAYS SUCCEEDS IS INVISIBLE UNTIL IT IS NOT. "A stub
 * that returns a minted identifier without a confirmed hand-off is invisible
 * until a package carries an unresolvable part reference", which is exactly
 * the failure `FUNC-STU-10-02-B-1` (L33143) refuses: "if the hand-off cannot
 * be confirmed, the reference is not created, because a reference to a part
 * that does not exist in the registry would break genealogy." So the
 * interface's create call returns a CONFIRMED or an UNCONFIRMED outcome as
 * two arms of a closed union — not a nullable identifier a caller could
 * forget to check — and the unconfirmed path is the one the gate exercises.
 *
 * EXACTLY ONE WRITABLE FIELD (L33207). "The seam is a single, narrow write
 * path with exactly one writable field. It cannot be used to edit or delete
 * an existing registry record." There is no `editPart` and no `deletePart`
 * on this interface, and `PART_SEAM_WRITABLE_FIELDS` is the written
 * vocabulary the covering test asserts against — a test that walked whatever
 * fields happened to exist would pass on an interface that had grown one.
 *
 * DETERMINISM. Every implementation below is a frozen fixture. No clock, no
 * randomness, and the minted identifier is derived from the tenant and the
 * name rather than from a counter that would differ between runs.
 */

/** L33207: one field, and the vocabulary is written down rather than inferred. */
export const PART_SEAM_WRITABLE_FIELDS = ['name'] as const

export type PartSeamWritableField = (typeof PART_SEAM_WRITABLE_FIELDS)[number]

/**
 * L33129: "The registry record is Skeletal until completed in the Delivery
 * Operations Hub, then Complete. The Studio never advances the state; it
 * only creates the Skeletal record."
 */
export type RegistryPartState = 'Skeletal' | 'Complete'

export const REGISTRY_PART_STATES = [
  'Skeletal',
  'Complete',
] as const satisfies readonly RegistryPartState[]

type MissingFromPartStates = Exclude<RegistryPartState, (typeof REGISTRY_PART_STATES)[number]>
const _partStatesExhaustive: MissingFromPartStates extends never ? true : never = true
void _partStatesExhaustive

export interface RegistryPart {
  readonly partId: string
  readonly name: string
  readonly state: RegistryPartState
  readonly tenant: TenantId
}

/**
 * The hand-off outcome. TWO ARMS, and the unconfirmed one carries a reason
 * the author can read. A nullable identifier would let a caller write
 * `?? mint()` and reintroduce exactly the invisible stub R21 names.
 */
export type PartHandOff =
  | { readonly confirmed: true; readonly part: RegistryPart }
  | { readonly confirmed: false; readonly reason: string }

/**
 * The interface `MOD-STU-10` consumes. Three members, all reads except one
 * narrow create.
 *
 * There is deliberately no `editPart`, no `deletePart` and no `setPartId`:
 * `AC-STU-092` (L33216) is "the platform mints the part identifier; no
 * author input influences it", and `FUNC-STU-10-02-A-2` (L33141) states
 * "Roles allowed: none may set it. Roles prohibited: every role."
 */
export interface PartsRegistrySeam {
  readonly id: 'parts-registry'
  /** How this fixture answers, in one phrase, for the notice a screen draws. */
  readonly disposition: string
  /** Live registry search from inside a work-instruction step. */
  readonly search: (tenant: TenantId, name: string) => readonly RegistryPart[]
  /** The ONE write. Name only; the platform mints the identifier. */
  readonly createSkeletal: (tenant: TenantId, name: PartName) => PartHandOff
  /** Re-resolution at recovery and at submission (L33211). */
  readonly resolve: (tenant: TenantId, partId: string) => RegistryPart | null
  /**
   * `false` where the registry itself cannot be reached — `FB-STU-07`. Kept
   * apart from an unconfirmed hand-off because they are different sentences
   * to the author: one says "try again later", the other says "this did not
   * happen".
   */
  readonly reachable: boolean
}

/**
 * The name, and nothing else. A branded alias rather than a bare `string`
 * so a call site cannot pass an identifier where a name belongs and have it
 * typecheck.
 */
export type PartName = string & { readonly __partName?: never }

/** Deterministic minting: no counter, no clock, no randomness. */
function mint(tenant: TenantId, name: string): string {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `PRT-${String(tenant)}-${slug}`
}

/** The one part Bright Bikes has already registered, for the search path. */
const SEEDED_PARTS = (tenant: TenantId): readonly RegistryPart[] => [
  { partId: mint(tenant, 'Wheel bolt M12'), name: 'Wheel bolt M12', state: 'Complete', tenant },
]

function searchSeeded(tenant: TenantId, name: string): readonly RegistryPart[] {
  const needle = name.trim().toLowerCase()
  return SEEDED_PARTS(tenant).filter((p) => p.name.toLowerCase() === needle)
}

/**
 * The registry confirms the hand-off. `TEST-STU-097`'s normal path.
 */
export const confirmedPartsRegistry: PartsRegistrySeam = {
  id: 'parts-registry',
  disposition: 'The Delivery Operations Hub registry confirms the skeletal record.',
  reachable: true,
  search: searchSeeded,
  createSkeletal: (tenant, name) => ({
    confirmed: true,
    part: { partId: mint(tenant, name), name, state: 'Skeletal', tenant },
  }),
  resolve: (tenant, partId) => {
    const seeded = SEEDED_PARTS(tenant).find((p) => p.partId === partId)
    if (seeded !== undefined) return seeded
    return partId.startsWith(`PRT-${String(tenant)}-`)
      ? { partId, name: partId, state: 'Skeletal', tenant }
      : null
  },
}

/**
 * THE PATH THE GATE EXERCISES. The registry is reachable and answers, but
 * the creation is not confirmed — the last message of L33170's sequence
 * diagram never arrives. No reference may be attached.
 */
export const unconfirmedPartsRegistry: PartsRegistrySeam = {
  id: 'parts-registry',
  disposition:
    'The Delivery Operations Hub registry did not confirm the skeletal record, so nothing was created.',
  reachable: true,
  search: searchSeeded,
  createSkeletal: () => ({
    confirmed: false,
    reason:
      'The hand-off to the Delivery Operations Hub parts registry could not be confirmed, so no ' +
      'part was created and no reference was attached. A reference to a part that does not exist ' +
      'in the registry would break genealogy.',
  }),
  resolve: (tenant, partId) => SEEDED_PARTS(tenant).find((p) => p.partId === partId) ?? null,
}

/**
 * `FB-STU-07`'s first fallback: the registry cannot be reached at all. The
 * picker goes read-only, new references are blocked and existing ones are
 * never cleared, and the author may proceed with no part reference —
 * because the reference is optional (L33137).
 */
export const unreachablePartsRegistry: PartsRegistrySeam = {
  id: 'parts-registry',
  disposition:
    'The Delivery Operations Hub parts registry cannot be reached, so the mini-form is disabled and existing references are left exactly as they are.',
  reachable: false,
  search: () => [],
  createSkeletal: () => ({
    confirmed: false,
    reason:
      'The Delivery Operations Hub parts registry could not be reached, so no part was created ' +
      'and no reference was attached. You may continue authoring without a part reference: a ' +
      'reference is optional per part and a step is never forced to carry one.',
  }),
  resolve: () => null,
}

/**
 * `DEC-PARTSTUB-001` (L33203), newly proposed and **unspecified in the
 * Statement of Work**. It is NOT one of the twenty-nine `SURF-STU`
 * decisions `@/studio/disclosure/decisions` carries, so it cannot be
 * rendered through `DecisionDisclosure`; it renders as its own
 * "unspecified in source" entry, with every option and the recommendation
 * beside them, never as a settled interval.
 */
export const DEC_PARTSTUB_001 = {
  id: 'DEC-PARTSTUB-001',
  status: 'not specified in the Statement of Work — newly proposed',
  question:
    'How long may a skeletal part record stay incomplete before the Tenant Admin is reminded?',
  whyItMatters:
    'An accumulation of name-only stubs degrades the registry’s usefulness for genealogy and reporting.',
  options: [
    'No reminder.',
    'A fixed platform interval.',
    'A tenant-configurable interval.',
  ],
  recommendation:
    'A tenant-configurable interval defaulting to seven days, because completion effort varies by tenant.',
  tradeOffs:
    'No reminder risks silent accumulation; a fixed interval will suit few tenants.',
  decisionOwner: 'the client’s product owner',
  sourceRef: 'DEC-PARTSTUB-001 · L33203',
} as const

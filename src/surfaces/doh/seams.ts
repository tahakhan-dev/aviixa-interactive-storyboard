import type { DohModuleId } from './modules'

/**
 * The SURF-DOH spine, part 6 of 6: the seven named cross-slice seams. Spec §5.
 *
 * A silent stub is the defect this registry exists to prevent (R10): each
 * seam is a named interface with a seeded fixture behind it, rendered by
 * `@/ui/doh/SeamNotice`, stating plainly which slice owns the missing half.
 */
export type DohSeamId =
  | 'worker-shift-meter'
  | 'archival-cascade'
  | 'shift-digest-delivery'
  | 'platform-access-history-audit'
  | 'qualification-gate'
  | 'tenant-contact-email-delivery'
  | 'certification-expiry-digest'

export interface DohSeamDefinition {
  readonly id: DohSeamId
  /** The slice-4 module that needs the missing half. */
  readonly consumingModule: DohModuleId
  /** The module that owns the missing half — not necessarily in slice 4. */
  readonly ownerModule: string
  readonly ownerSlice: number
  readonly description: string
}

export const DOH_SEAMS = [
  {
    id: 'worker-shift-meter',
    consumingModule: 'MOD-DOH-01',
    ownerModule: 'MOD-DOH-07',
    ownerSlice: 6,
    description:
      'Worker-Shift meter inputs are assignment events MOD-DOH-07 emits. MOD-DOH-01 ships the ' +
      'meter as a state machine and stubs the inputs here.',
  },
  {
    id: 'archival-cascade',
    consumingModule: 'MOD-DOH-02',
    ownerModule: 'MOD-DOH-05',
    ownerSlice: 6,
    description:
      'A Site or Area archival cascade enumerates the Jobs it must pause; MOD-DOH-05 owns Jobs ' +
      'and the cascade completion.',
  },
  {
    id: 'shift-digest-delivery',
    consumingModule: 'MOD-DOH-03',
    ownerModule: 'MOD-DOH-10',
    ownerSlice: 10,
    description:
      'The per-shift digest-time field registers a delivery preference; MOD-DOH-10 owns the ' +
      'delivery itself.',
  },
  {
    id: 'platform-access-history-audit',
    consumingModule: 'MOD-DOH-13',
    ownerModule: 'MOD-DOH-11',
    ownerSlice: 10,
    description:
      "Platform Access History reads the tenant's own audit records; MOD-DOH-11 owns the audit " +
      'store — one audit truth per tenant (D14), never a second store built to make this slice ' +
      'self-contained.',
  },
  {
    id: 'qualification-gate',
    consumingModule: 'MOD-DOH-04',
    ownerModule: 'MOD-DOH-06 / MOD-DOH-07',
    ownerSlice: 6,
    description:
      'MOD-DOH-04 owns the qualification record and its evaluator; the gate at assignment ' +
      '(MOD-DOH-07) and at run start (MOD-DOH-06) is enforced in slice 6 — two of the three ' +
      'enforcement points.',
  },
  {
    id: 'tenant-contact-email-delivery',
    consumingModule: 'MOD-DOH-12',
    ownerModule: 'MOD-DOH-10',
    ownerSlice: 10,
    description:
      'The tenant contact email is a field MOD-DOH-12 records on its configuration screen; ' +
      'MOD-DOH-10 owns everything after that. Sending is not delivery, delivery is not ' +
      'opening, opening is not acknowledgement, and acknowledgement is not the business action ' +
      '— four transport states, none of them the outcome, and no screen may collapse them ' +
      'into one.',
  },
  {
    id: 'certification-expiry-digest',
    consumingModule: 'MOD-DOH-14',
    ownerModule: 'MOD-DOH-10',
    ownerSlice: 10,
    description:
      'MOD-DOH-14 originates no notification of its own; its one notification row, and its ' +
      'fallback-of-fallback when the projection cannot compute, are both the certification-' +
      'expiry section of the per-shift digest. MOD-DOH-14 owns only the expiry facts that ' +
      'section carries — MOD-DOH-10 owns the digest and its delivery. This is not ' +
      'shift-digest-delivery: that seam’s consumer is MOD-DOH-03’s digest-time ' +
      'preference field, a different module and a different dependency. The fallback-of-' +
      'fallback is unavailable until slice 10 ships MOD-DOH-10, so this degraded path is not ' +
      'something the Calendar can reach today.',
  },
] as const satisfies readonly DohSeamDefinition[]

type MissingFromSeams = Exclude<DohSeamId, (typeof DOH_SEAMS)[number]['id']>
const _seamsExhaustive: MissingFromSeams extends never ? true : never = true
void _seamsExhaustive

const BY_ID = new Map(DOH_SEAMS.map((s) => [s.id, s]))

export function dohSeamById(id: DohSeamId): DohSeamDefinition {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown SURF-DOH seam: ${id}`)
  return found
}

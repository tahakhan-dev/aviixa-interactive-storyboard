import { classifyTierTwoRefusal, type Tier2Classification } from '@/studio/access/refusal'

/**
 * **THE FIVE TYPED STORES, AND THE BOUNDARY AROUND THEM (L34162, L34322).**
 *
 * L34162: *"The tenant's manufacturing memory is five distinct, persistent
 * stores, not one: **working memory** (the live context of a Run),
 * **episodic** (past cases and events, such as prior deviations for a part),
 * **semantic** (standards, specifications, and domain facts), **procedural**
 * (how-to and learned routines), and **profile** (worker and operator
 * profiles). **The Studio writes the procedural and semantic layers** ... The
 * memory architecture itself is platform-owned; a tenant may set retention
 * within the allowed bounds and the personal-information policy on profile
 * memory, never the architecture."*
 *
 * ## THE STUDIO WRITES TWO OF THE FIVE, AND CANNOT NAME THE OTHER THREE
 *
 * `StudioWrittenStore` is `'procedural' | 'semantic'`, derived with `Extract`
 * from the five so a rename over there fails to compile here.
 * `writeOnPublication` takes that type, so a caller wanting to write profile
 * memory from the Studio has nowhere to put the store name — the refusal is
 * the absence of a parameter it would fit, not a branch that says no.
 *
 * ## THE ARCHITECTURE REFUSAL IS ALREADY BUILT
 *
 * *"Adding a sixth typed memory store"* is L12039's own example of the
 * Tier-2 `never define` verb, and `MOD-STU-01` transcribed that table into
 * `src/studio/access/refusal.ts`. This module reads
 * `classifyTierTwoRefusal('alter-memory-architecture')` rather than writing a
 * second refusal beside it: row 7 of this card (L34200) and L12039 are one
 * rule, and two spellings of one rule is how they come to disagree.
 *
 * ## ANONYMISATION IS THE PLATFORM'S ONE IRREVERSIBLE ACT
 *
 * L34322: *"Worker personal data anonymises at 24 months for standard
 * commercial tenants and never in Regulated-Industry mode; measurement,
 * result, and evidence survive and the identity becomes an opaque worker
 * identifier. **Anonymisation is the platform's one irreversible act.**"*
 *
 * The Studio neither performs it nor offers it — no cell of this card
 * mentions it and no control here does either. It is STATED, because a
 * screen about memory that never mentions the one thing that cannot be
 * undone would be an honest-looking omission.
 */

/* ==================================================================== *
 * THE FIVE STORES.
 * ==================================================================== */

export type MemoryStoreId = 'working' | 'episodic' | 'semantic' | 'procedural' | 'profile'

export const MEMORY_STORE_IDS = [
  'working',
  'episodic',
  'semantic',
  'procedural',
  'profile',
] as const satisfies readonly MemoryStoreId[]

type MissingFromStoreIds = Exclude<MemoryStoreId, (typeof MEMORY_STORE_IDS)[number]>
const _storeIdsExhaustive: MissingFromStoreIds extends never ? true : never = true
void _storeIdsExhaustive

/** The two the Studio writes (L34162). Derived, so a rename cannot split them. */
export type StudioWrittenStore = Extract<MemoryStoreId, 'procedural' | 'semantic'>

export const STUDIO_WRITTEN_STORES = [
  'procedural',
  'semantic',
] as const satisfies readonly StudioWrittenStore[]

/**
 * The other three, and the proof that they stay the other three.
 *
 * `STUDIO_WRITTEN_STORES` alone does not hold this: widening
 * `StudioWrittenStore` to admit `'profile'` leaves that array satisfying the
 * wider type, leaves `writeOnPublication`'s two entries unchanged, and leaves
 * every runtime assertion green — a plant proved exactly that. What fails is
 * this pair of mutual-extends checks, which pin the complement in BOTH
 * directions, so admitting a fourth store to the writable set stops
 * compiling.
 */
export type StudioUnwrittenStore = Exclude<MemoryStoreId, StudioWrittenStore>

const _threeStoresTheStudioNeverWrites: StudioUnwrittenStore extends
  | 'working'
  | 'episodic'
  | 'profile'
  ? 'working' | 'episodic' | 'profile' extends StudioUnwrittenStore
    ? true
    : never
  : never = true
void _threeStoresTheStudioNeverWrites

export interface MemoryStoreDefinition {
  readonly id: MemoryStoreId
  readonly name: string
  /** The source's own parenthesis for this store, verbatim (L34162). */
  readonly holds: string
  /** Whether the Studio writes this layer. Two of five. */
  readonly writtenByStudio: boolean
  /** What a tenant may set on this store, or `null` where the source names nothing. */
  readonly tenantMaySet: string | null
  readonly sourceRefs: readonly string[]
}

export const MEMORY_STORES = [
  {
    id: 'working',
    name: 'Working memory',
    holds: 'the live context of a Run',
    writtenByStudio: false,
    tenantMaySet: 'Retention within the allowed bounds, in the tenant administration area.',
    sourceRefs: ['L34162'],
  },
  {
    id: 'episodic',
    name: 'Episodic memory',
    holds: 'past cases and events, such as prior deviations for a part',
    writtenByStudio: false,
    tenantMaySet: 'Retention within the allowed bounds, in the tenant administration area.',
    sourceRefs: ['L34162'],
  },
  {
    id: 'semantic',
    name: 'Semantic memory',
    holds: 'standards, specifications, and domain facts',
    writtenByStudio: true,
    tenantMaySet: 'Retention within the allowed bounds, in the tenant administration area.',
    sourceRefs: ['L34162', 'FUNC-STU-16-01-A-2 L34219'],
  },
  {
    id: 'procedural',
    name: 'Procedural memory',
    holds: 'how-to and learned routines',
    writtenByStudio: true,
    tenantMaySet: 'Retention within the allowed bounds, in the tenant administration area.',
    sourceRefs: ['L34162', 'FUNC-STU-16-01-A-1 L34218'],
  },
  {
    id: 'profile',
    name: 'Profile memory',
    holds: 'worker and operator profiles',
    writtenByStudio: false,
    tenantMaySet:
      'Retention within the allowed bounds, and the personal-information policy, both in the ' +
      'tenant administration area. Profile memory holds aggregates only, and the ' +
      'personal-information redaction policy applies (L34162, L34322).',
    sourceRefs: ['L34162', 'L34322'],
  },
] as const satisfies readonly MemoryStoreDefinition[]

type MissingFromStores = Exclude<MemoryStoreId, (typeof MEMORY_STORES)[number]['id']>
const _storesExhaustive: MissingFromStores extends never ? true : never = true
void _storesExhaustive

/* ==================================================================== *
 * THE STUDIO'S OWN WRITES — a system function, not a role's act.
 * ==================================================================== */

/**
 * `FUNC-STU-16-01-A-1` (L34218) and `-A-2` (L34219). Both read *"Roles
 * allowed: system function on publication. Roles prohibited: no role writes
 * memory directly."*
 *
 * There is therefore NO CONTROL for this anywhere on the screen and no row
 * of the matrix for it: a person cannot ask for it, so a person is not
 * offered it. The screen states what publication writes and to which two
 * layers.
 */
export interface MemoryWrite {
  readonly store: StudioWrittenStore
  readonly what: string
  readonly versionNumber: string
  /** L34218 — "version-bound". */
  readonly note: string
}

/**
 * What publishing a Workflow version writes into memory. The store is typed
 * to the two the Studio writes, so this function cannot address the other
 * three at all.
 */
export function writeOnPublication(
  versionNumber: string,
  qualificationRequirements: readonly string[],
): readonly MemoryWrite[] {
  return [
    {
      store: 'procedural',
      what: `The published Workflow version ${versionNumber}`,
      versionNumber,
      note:
        'How things are done, version-bound: every published Workflow becomes part of what the ' +
        'agents can draw on (L34218). Written by the system on publication — no role writes ' +
        'memory directly.',
    },
    {
      store: 'semantic',
      what:
        qualificationRequirements.length === 0
          ? 'No qualification requirements on this version'
          : `${qualificationRequirements.length} qualification requirements: ${qualificationRequirements.join(', ')}`,
      versionNumber,
      note:
        'Domain facts the agents reason over, including the Shift Handoff readiness ' +
        'cross-reference (L34219). Written by the system on publication.',
    },
  ]
}

/* ==================================================================== *
 * THE ARCHITECTURE BOUNDARY — read from MOD-STU-01, never rewritten.
 * ==================================================================== */

/**
 * Row 7 of this card (L34200) is `Explicitly prohibited` in every column, and
 * `FUNC-STU-16-01-B-1` (L34221) states the shape: *"Refuse any tenant change
 * to the memory architecture, permitting only retention within allowed
 * bounds and the personal-information policy on profile memory ... Roles
 * allowed: none for the architecture. Roles prohibited: every tenant role."*
 *
 * The classification comes from `MOD-STU-01`'s transcription of the Tier-2
 * verb table, where *"Adding a sixth typed memory store"* is the source's own
 * worked example (L12039).
 */
export function memoryArchitectureRefusal(): Tier2Classification {
  return classifyTierTwoRefusal('alter-memory-architecture')
}

/* ==================================================================== *
 * ISOLATION AND ANONYMISATION — stated, never offered.
 * ==================================================================== */

/**
 * L34179, and `AC-STU-142` (L34336) binds it "at any privilege level". Row 8
 * of the card (L34201) is the permission form of the same fact: every column
 * `Explicitly prohibited`.
 */
export const TENANT_ISOLATION_STATEMENT =
  'Everything learned stays strictly inside this tenant’s own manufacturing memory: nothing is ' +
  'shared across tenants, and nothing is exported as external training data — at any privilege ' +
  'level, by any role, any agent, and any platform operator outside the named access classes. ' +
  'Anonymised cross-tenant learning is, at most, a future opt-in requiring explicit consent, and ' +
  'is outside scope (L34179, L34251, AC-STU-142 L34336).'

/** L34322's two modes, and the second one never anonymises. */
export type TenantDataMode = 'standard-commercial' | 'regulated-industry'

export interface AnonymisationPolicy {
  readonly mode: TenantDataMode
  /** Months until worker personal data anonymises, or `null` where it never does. */
  readonly anonymisesAfterMonths: number | null
  readonly irreversible: true
  readonly statement: string
}

export function anonymisationPolicy(mode: TenantDataMode): AnonymisationPolicy {
  const survives =
    'Measurement, result, and evidence survive it, and the identity becomes an opaque worker ' +
    'identifier. Anonymisation is the platform’s one irreversible act (L34322). The Studio ' +
    'neither performs it nor offers it: no cell of this module’s permission table names it and ' +
    'no control here does either.'

  return mode === 'regulated-industry'
    ? {
        mode,
        anonymisesAfterMonths: null,
        irreversible: true,
        statement: `In Regulated-Industry mode worker personal data never anonymises. ${survives}`,
      }
    : {
        mode,
        anonymisesAfterMonths: 24,
        irreversible: true,
        statement: `For a standard commercial tenant, worker personal data anonymises at 24 months. ${survives}`,
      }
}

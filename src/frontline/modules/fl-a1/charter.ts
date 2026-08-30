/**
 * `MOD-FL-A1` — Identity, Authentication and Device Mode. THE IDENTITY CARD,
 * TRANSCRIBED.
 *
 * The card is §22.10's own five statements at L40174, L40176, L40178, L40180
 * and L40182 — the odd lines between them are blank. Nothing here is
 * paraphrased and nothing is trimmed to fit a card: where the source's
 * sentence is long, the sentence is carried whole, which is the shape
 * `src/studio/modules/stu-01/charter.ts` established and the reason its
 * covering test can walk this list against the rendered markup.
 *
 * FOUR STATEMENTS BEYOND THE CARD, EACH LABELLED AS SUCH. `states`,
 * `offline`, `fallback` and `logout-place` are read from L40207, L40224,
 * L40250 and L40218. They are not part of the L40174-L40182 span and they
 * carry their own locators, because the views need them and a statement
 * rendered without its own line is how a citation drifts one section over.
 *
 * WHAT IS DELIBERATELY NOT HERE. No auto-logout interval, no elapsed figure,
 * no comparison to another worker. `AC-FL-000-5` (L39100), `AC-SCR-FL-002`
 * (L48690) and `AC-SCOPE-045` (L2683) forbid a pace figure, a countdown
 * against expectation and a comparison to another worker in any state of any
 * screen. `FUNC-A1-03-1-2` (L40270) records that the source states the
 * auto-logout is configurable and NAMES NO DEFAULT VALUE — `TBD — Client
 * Decision Required` in its own words — so there is no number to render even
 * if rendering one were permitted.
 */

export type A1CharterStatementId =
  | 'identifier'
  | 'purpose'
  | 'user-benefit'
  | 'owning-surface'
  | 'roles'
  | 'states'
  | 'offline'
  | 'fallback'
  | 'logout-place'

export const A1_CHARTER_STATEMENT_IDS = [
  'identifier',
  'purpose',
  'user-benefit',
  'owning-surface',
  'roles',
  'states',
  'offline',
  'fallback',
  'logout-place',
] as const satisfies readonly A1CharterStatementId[]

type MissingFromStatementIds = Exclude<
  A1CharterStatementId,
  (typeof A1_CHARTER_STATEMENT_IDS)[number]
>
const _statementIdsExhaustive: MissingFromStatementIds extends never ? true : never = true
void _statementIdsExhaustive

export interface A1CharterStatement {
  readonly id: A1CharterStatementId
  /** The heading the claim renders under. */
  readonly heading: string
  /** The claim, in the frozen source's own words, with its own markup dropped. */
  readonly text: string
  readonly sourceRef: string
  /** How the source classifies the claim, in the source's own vocabulary. */
  readonly sourceClass: string
  /** `true` for the five statements of the L40174-L40182 identity card. */
  readonly onTheCard: boolean
}

export const A1_CHARTER_STATEMENTS = [
  {
    id: 'identifier',
    heading: 'Identifier and name',
    text: 'MOD-FL-A1. Identity, Authentication and Device Mode.',
    sourceRef: 'L40174',
    sourceClass: 'SoW Fact — §7.3',
    onTheCard: true,
  },
  {
    id: 'purpose',
    heading: 'Purpose',
    text: 'To establish and maintain a trustworthy, attributable identity on the device, because attribution, qualification, language, and security all key off who is logged in, not which device this is.',
    sourceRef: 'L40176',
    sourceClass: 'SoW Fact — §7.5',
    onTheCard: true,
  },
  {
    id: 'user-benefit',
    heading: 'User benefit',
    text: 'A worker picks up any conformant tablet and finds their own work, their own certifications, and their own language, with no setup. A Supervisor can approve a step without displacing the worker. A tenant gets accurate attribution without asking the floor to write names on paper headers.',
    sourceRef: 'L40178',
    sourceClass: 'SoW Fact — carried without a classification tag of its own',
    onTheCard: true,
  },
  {
    id: 'owning-surface',
    heading: 'Owning surface',
    text: "Frontline Worker Application (SURF-FL). Credential provisioning and reset are owned by the Delivery Operations Hub's managed-credential path; device enrollment and device-mode setting are owned by the Super Admin platform console.",
    sourceRef: 'L40180',
    sourceClass: 'SoW Fact — §7.5.1, §7.5.2, §7.11',
    onTheCard: true,
  },
  {
    id: 'roles',
    heading: 'Roles that see and use it',
    text: 'Worker, for the session. Supervisor and Quality Manager, momentarily, through the second-identity step-up.',
    sourceRef: 'L40182',
    sourceClass: 'SoW Fact — §7.5.3',
    onTheCard: true,
  },
  {
    id: 'states',
    heading: 'States',
    text: 'STATE-A1-UNAUTH no session; STATE-A1-ACTIVE authenticated and active; STATE-A1-IDLE authenticated but idle, pending auto-logout; STATE-A1-STEPUP an active session with a momentary second identity engaged; STATE-A1-LOCKED Personal Identification Number lockout after repeated failures; STATE-A1-SUSPENDED compliance stop, all logins blocked.',
    sourceRef: 'L40207',
    sourceClass: 'SoW Fact — §7.5.2, §7.11, §4.2.3',
    onTheCard: false,
  },
  {
    id: 'offline',
    heading: 'Offline behaviour',
    text: 'Cached credentials and qualifications are trusted within the tenant-set offline trust window, default about 24 hours with a platform ceiling of 72 hours; a tenant may shorten it and may never exceed the ceiling. Login within the window succeeds. Step-up for a forced-sync action does not proceed offline, because the whole point of forcing the sync is that the identities and authority those actions record are fresh, not stale cache.',
    sourceRef: 'L40224',
    sourceClass: 'SoW Fact — §7.10.5, §1.7',
    onTheCard: false,
  },
  {
    id: 'fallback',
    heading: 'Fallback identifier',
    text: 'FB-FL-AUTH-01 primary; FB-FL-SEC-01 for lockout, suspension, and de-authorisation; FB-FL-CORE-01 for connectivity loss.',
    sourceRef: 'L40250',
    sourceClass: 'SoW Fact — carried without a classification tag of its own',
    onTheCard: false,
  },
  {
    id: 'logout-place',
    heading: 'Where the worker logs out',
    text: 'At shift end the worker logs out from Profile-lite, and the device returns to the charging bay.',
    sourceRef: 'L40218 (happy path, step 8)',
    sourceClass: 'SoW Fact — §7.5.2',
    onTheCard: false,
  },
] as const satisfies readonly A1CharterStatement[]

/**
 * Total over the nine. Never throws: a placeholder that DISCLOSES the
 * registry defect on screen beats a render that crashes, and the covering
 * test holds the ids and the records equal, so it is unreachable while that
 * test holds.
 */
export function a1CharterStatement(id: A1CharterStatementId): A1CharterStatement {
  return (
    A1_CHARTER_STATEMENTS.find((s) => s.id === id) ?? {
      id,
      heading: 'Missing charter statement',
      text: `No charter statement is recorded for “${id}”. This is a defect in this build’s registry, stated here rather than hidden.`,
      sourceRef: 'none',
      sourceClass: 'unrecorded',
      onTheCard: false,
    }
  )
}

/** The five statements of the L40174-L40182 card, in the source's order. */
export const A1_IDENTITY_CARD = A1_CHARTER_STATEMENTS.filter((s) => s.onTheCard)

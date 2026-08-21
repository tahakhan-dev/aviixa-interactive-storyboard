/**
 * `MOD-FL-A7` — Security and Data Protection. THE IDENTITY CARD,
 * TRANSCRIBED.
 *
 * The card is §22.16's own five statements at L41283, L41285, L41287,
 * L41289 and L41291 — the even lines between them are blank. Nothing here
 * is paraphrased and nothing is trimmed to fit a card, which is the shape
 * `src/frontline/modules/fl-a1/charter.ts` established and the reason its
 * covering test can walk this list against the frozen source line by line.
 *
 * SIX STATEMENTS BEYOND THE CARD, EACH LABELLED AS SUCH. `states`,
 * `happy-path`, `alternate-paths`, `offline`, `reconnect` and `fallback`
 * are read from L41315, L41317, L41319, L41323, L41325 and L41351. They are
 * not part of the L41283-L41291 span, they carry their own locators, and
 * `onTheCard` is `false` on every one of them — a statement rendered
 * without its own line is how a citation drifts one section over.
 *
 * THE OFFLINE STATEMENT IS THE ONE THIS MODULE MUST NOT SOFTEN. L41323: "No
 * suspension, de-authorisation, or wipe command can arrive, and no surface
 * may imply otherwise." A screen that draws a lock, a wipe or a suspension
 * as something that could reach a dark device makes exactly the claim that
 * sentence forbids. `TEST-A7-6` (L41440) tests for it directly.
 *
 * WHAT IS DELIBERATELY NOT HERE. No lockout attempt count and no lockout
 * duration. `FUNC-A7-03-1-1` (L41371) records that both are `Not specified
 * in the Statement of Work` and `TBD — Client Decision Required`, so there
 * is no number to render. No pace figure, countdown or worker comparison
 * either — `AC-FL-000-5` (L39100), `AC-SCR-FL-002` (L48690) and
 * `AC-SCOPE-045` (L2683) forbid all three in any state of any screen.
 *
 * NO BAND OR GRADE IS TRANSCRIBED. The build plan grades this task `C1`.
 * That is a build-plan rigour grade and not a source value: the frozen
 * source's own module-inventory table (header L39844) carries a **Band**
 * column, and `MOD-FL-A7`'s row at L39852 reads `A`. Neither value is
 * carried into the module, because one is not the source's and the other is
 * not this module's to restate.
 */

export type A7CharterStatementId =
  | 'identifier'
  | 'purpose'
  | 'user-benefit'
  | 'owning-surface'
  | 'roles'
  | 'states'
  | 'happy-path'
  | 'alternate-paths'
  | 'offline'
  | 'reconnect'
  | 'fallback'

export const A7_CHARTER_STATEMENT_IDS = [
  'identifier',
  'purpose',
  'user-benefit',
  'owning-surface',
  'roles',
  'states',
  'happy-path',
  'alternate-paths',
  'offline',
  'reconnect',
  'fallback',
] as const satisfies readonly A7CharterStatementId[]

type MissingFromStatementIds = Exclude<
  A7CharterStatementId,
  (typeof A7_CHARTER_STATEMENT_IDS)[number]
>
const _statementIdsExhaustive: MissingFromStatementIds extends never ? true : never = true
void _statementIdsExhaustive

export interface A7CharterStatement {
  readonly id: A7CharterStatementId
  /** The heading the claim renders under. */
  readonly heading: string
  /** The claim, in the frozen source's own words, with its own markup dropped. */
  readonly text: string
  readonly sourceRef: string
  /** How the source classifies the claim, in the source's own vocabulary. */
  readonly sourceClass: string
  /** `true` for the five statements of the L41283-L41291 identity card. */
  readonly onTheCard: boolean
}

export const A7_CHARTER_STATEMENTS = [
  {
    id: 'identifier',
    heading: 'Identifier and name',
    text: 'MOD-FL-A7. Security and Data Protection.',
    sourceRef: 'L41283',
    sourceClass: 'SoW Fact — §7.3',
    onTheCard: true,
  },
  {
    id: 'purpose',
    heading: 'Purpose',
    text: 'To hold the security positions of this scope: an application-managed encrypted on-device store, server-triggered remote data wipe with a final-sync attempt, media that never leaves the application, Personal Identification Number lockout with a managed reset path, minimal on-device data scope, and honoured suspension states including the immediate compliance stop.',
    sourceRef: 'L41285',
    sourceClass: 'SoW Fact — §7.11',
    onTheCard: true,
  },
  {
    id: 'user-benefit',
    heading: 'User benefit',
    text: "A worker's recorded work is never silently destroyed. A tenant's data does not spread across a shared device or into a camera roll. A worker who forgets a code has a clear, supervised way back.",
    sourceRef: 'L41287',
    sourceClass: 'SoW Fact — carried without a classification tag of its own',
    onTheCard: true,
  },
  {
    id: 'owning-surface',
    heading: 'Owning surface',
    text: "Frontline Worker Application (SURF-FL). Credential reset is owned by the Delivery Operations Hub's managed-credential path. Device wipe and de-authorisation are critical-class actions approved by the Root Super Admin in the Super Admin platform console. Suspension states originate in the Delivery Operations Hub lifecycle or the Super Admin platform console.",
    sourceRef: 'L41289',
    sourceClass: 'SoW Fact — §7.11, §8.8.3, §4.2.3',
    onTheCard: true,
  },
  {
    id: 'roles',
    heading: 'Roles that see and use it',
    text: 'Worker, who experiences lockout and suspension states. Supervisor, Quality Manager, and Tenant Admin, who initiate credential resets in the Delivery Operations Hub. Platform roles, who initiate wipe and de-authorisation under critical-class approval.',
    sourceRef: 'L41291',
    sourceClass: 'SoW Fact — carried without a classification tag of its own',
    onTheCard: true,
  },
  {
    id: 'states',
    heading: 'States',
    text: 'STATE-A7-NORMAL; STATE-A7-SOFTSUSP; STATE-A7-HARDSUSP; STATE-A7-COMPLIANCELOCK; STATE-A7-PINLOCK; STATE-A7-WIPEPENDING; STATE-A7-WIPED.',
    sourceRef: 'L41315',
    sourceClass: 'Derived Clarification — state names, per the section source status at L41446',
    onTheCard: false,
  },
  {
    id: 'happy-path',
    heading: 'Happy path',
    text: 'The happy path for this module is invisibility: the encrypted store operates, media stays inside it, the device holds only what the assigned Runs require, and no lock state is ever entered.',
    sourceRef: 'L41317',
    sourceClass: 'SoW Fact — carried without a classification tag of its own',
    onTheCard: false,
  },
  {
    id: 'alternate-paths',
    heading: 'Alternate paths',
    text: 'Personal Identification Number lockout after repeated failures. Soft suspension, where master-data writes are blocked platform-side and operations continue in full. Hard suspension, where the device starts no new Runs while in-flight Runs complete, capture, sync, compute summaries, and close. Compliance suspension, where the application locks immediately, preserves all local data, and shows the fixed message. Worker or device de-authorisation, with a final sync attempt before erasure.',
    sourceRef: 'L41319',
    sourceClass: 'SoW Fact — §7.11, §4.2.3',
    onTheCard: false,
  },
  {
    id: 'offline',
    heading: 'Offline behaviour',
    text: 'No suspension, de-authorisation, or wipe command can arrive, and no surface may imply otherwise. Personal Identification Number lockout still operates, because the failure counter is local. The encrypted store operates unchanged.',
    sourceRef: 'L41323',
    sourceClass: 'SoW Fact — §7.2.2, §7.11',
    onTheCard: false,
  },
  {
    id: 'reconnect',
    heading: 'Reconnect behaviour',
    text: 'Pending security commands are pulled, validated, and applied in order at safe boundaries. A pending wipe attempts its final sync of pending captures before erasing.',
    sourceRef: 'L41325',
    sourceClass: 'SoW Fact — §7.11',
    onTheCard: false,
  },
  {
    id: 'fallback',
    heading: 'Fallback identifier',
    text: 'FB-FL-SEC-01 primary; FB-FL-CMD-01 for command delivery; FB-FL-STORE-01 where storage participates; FB-FL-AUTH-01 for credential paths.',
    sourceRef: 'L41351',
    sourceClass: 'SoW Fact — carried without a classification tag of its own',
    onTheCard: false,
  },
] as const satisfies readonly A7CharterStatement[]

/**
 * Total over the eleven. Never throws: a placeholder that DISCLOSES the
 * registry defect on screen beats a render that crashes, and the covering
 * test holds the ids and the records equal, so it is unreachable while that
 * test holds. Same shape as `a1CharterStatement`, and deliberately so — a
 * second failure idiom for the same failure is a second thing to read.
 */
export function a7CharterStatement(id: A7CharterStatementId): A7CharterStatement {
  return (
    A7_CHARTER_STATEMENTS.find((s) => s.id === id) ?? {
      id,
      heading: 'Missing charter statement',
      text: `No charter statement is recorded for “${id}”. This is a defect in this build’s registry, stated here rather than hidden.`,
      sourceRef: 'none',
      sourceClass: 'unrecorded',
      onTheCard: false,
    }
  )
}

/** The five statements of the L41283-L41291 card, in the source's order. */
export const A7_IDENTITY_CARD = A7_CHARTER_STATEMENTS.filter((s) => s.onTheCard)

/**
 * The seven state identifiers of L41315, split out so a screen can name one
 * without re-spelling the list. DERIVED from the charter statement rather
 * than transcribed a second time — the covering test splits L41315 itself
 * and holds the two equal, so there is no second copy to drift.
 */
export const A7_STATES: readonly string[] = a7CharterStatement('states')
  .text.replace(/\.$/, '')
  .split(';')
  .map((s) => s.trim())

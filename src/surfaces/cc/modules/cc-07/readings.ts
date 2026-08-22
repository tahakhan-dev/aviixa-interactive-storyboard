import type { DecisionReading } from '@/disclosure/decisions'

/**
 * WHERE ANOTHER STATEMENT ANSWERS ONE OF `MOD-CC-07`'S QUESTIONS DIFFERENTLY.
 *
 * The common brief names FOUR tables that answer the same permission question
 * for this surface. **On this module there is a fifth, and it is the one that
 * disagrees.** `MTX-TEN-02c` (introduced L22054, header L22056, separator
 * L22057, thirteen data rows L22058-L22070) answers the question at MODULE
 * level for all thirteen Command Center modules, with its tokens BACKTICKED
 * and a `[K*]` condition key beside each. This module's row is L22064.
 *
 * It is not a fourteenth screen or a rival register; it is a different
 * granularity of the same question, and its answers for this module are not
 * derivable from the seven capability rows at L37505-L37511. Two of its three
 * granted cells contradict the capability table outright.
 *
 * **No decision identifier covers any of this.** `AC-CC-502` requires every
 * cell to carry an explicit status and every cell does. That five statements
 * give different statuses to the same actor is tested by no acceptance
 * criterion at all — and L60827 says this module carries no open decision.
 *
 * So this file carries readings, never a verdict.
 *
 * ── THE SHAPE IS WHAT KEEPS IT HONEST ────────────────────────────────────
 *
 * `DecisionReading` is the canon's own type, imported rather than re-declared.
 * It has exactly two fields, `text` and `locator`, so there is nowhere on a
 * reading to mark it the winner — not by a `preferred` flag, not by an
 * `adopted` field, not by anything a later hand could add without changing a
 * shared type twenty-nine canon records depend on. `readings` is a
 * fixed-length pair, so a third reading is a type error rather than a review
 * comment.
 *
 * `src/surfaces/cc/decisions/disclosure.ts` is the surface's own local
 * disclosure register and is NOT edited or extended here. Its records are
 * keyed on a `CcDecisionId`, and these five divergences have no `DEC-*`
 * identifier to key on — that absence is the finding, and forcing one of them
 * into a register of identified decisions would erase it.
 */

/** Exactly two readings. A third is a type error. */
export type TwoReadings = readonly [DecisionReading, DecisionReading]

export interface Cc07Divergence {
  readonly id: string
  /** What the disagreement is about, in this module's own words. */
  readonly subject: string
  /** This module's own matrix row where one exists, or `null`. */
  readonly ownRow: number | null
  /** The persona or field the disagreement lands on. */
  readonly column: string
  /** The question the statements answer differently. Never rhetorical. */
  readonly question: string
  readonly readings: TwoReadings
  /**
   * Every statement found in the source, with its line. Separate from
   * `readings` on purpose: eight statements can make two readings, and
   * collapsing statements into readings is how "three different statuses" gets
   * written down for a cell that carries two.
   */
  readonly statements: readonly { readonly text: string; readonly line: number }[]
  /** What a client actually sees under each reading. Never a paraphrase. */
  readonly renderedConsequence: string
}

export const CC07_DIVERGENCES = [
  {
    id: 'tenant-admin-read-only-or-prohibited',
    subject: 'The Tenant Admin on this module',
    ownRow: null,
    column: 'Tenant Admin',
    question:
      'Does the Tenant Admin have read-only access to feedback signal capture, or is the ' +
      'Tenant Admin categorically excluded from every capability on it?',
    readings: [
      {
        text:
          'Read-only at module level. MTX-TEN-02c gives the Tenant Admin `Read-only` on twelve ' +
          'of the thirteen Command Center modules, this one among them, under condition [K1]: ' +
          '"DEC-TACC-001: report-format authoring places the Tenant Admin on this surface, and ' +
          'the source does not state whether the Tenant Admin sees the monitoring modules. ' +
          'Until decided, read-only monitoring access is served and no operational action is ' +
          'granted." So the exclusion is a pending decision, and the served behaviour is a read.',
        locator: 'MTX-TEN-02c · L22064; condition [K1] · L22072',
      },
      {
        text:
          'Explicitly prohibited on every capability. §21.10\'s own matrix gives the Tenant ' +
          'Admin `Explicitly prohibited` on all seven rows, and row 7 adds a note that reads as ' +
          'a statement about the module rather than about the actor: "no such gating exists for ' +
          'any role". No cell of the seven grants a read of anything.',
        locator: 'MOD-CC-07 §21.10 · L37505-L37511',
      },
    ],
    statements: [
      { text: 'Read-only', line: 22064 },
      { text: 'Explicitly prohibited', line: 37505 },
      { text: 'Explicitly prohibited', line: 37506 },
      { text: 'Explicitly prohibited', line: 37507 },
      { text: 'Explicitly prohibited', line: 37508 },
      { text: 'Explicitly prohibited', line: 37509 },
      { text: 'Explicitly prohibited', line: 37510 },
      { text: 'Explicitly prohibited', line: 37511 },
    ],
    renderedConsequence:
      '`src/ui/WriteControl.tsx` draws `explicitlyProhibited` at `BASE_ROLE` as nothing at all, ' +
      'and `readOnly` is not a refusal at all — it is a grant to see. Under reading A a Tenant ' +
      'Admin opening this module sees the aggregated effect of feedback; under reading B the ' +
      'module is not there. The concentration table (L35249) settles neither: it names the ' +
      'Supervisor principal and the Quality Manager secondary and lists only the Read-only ' +
      'Auditor and the Worker as not users — where MOD-CC-05\'s row (L35247) names the Tenant ' +
      'Admin among its own non-users explicitly. Silence on this row is not a third reading.',
  },
  {
    id: 'granted-roles-conditioned-or-plain',
    subject: 'The Supervisor and the Quality Manager on this module',
    ownRow: null,
    column: 'Supervisor and Quality Manager',
    question:
      'Are the two granted roles granted with a stated condition, or granted plainly on five ' +
      'capabilities and refused on the rest?',
    readings: [
      {
        text:
          'One module-level grant, conditioned. MTX-TEN-02c gives BOTH the Supervisor and the ' +
          'Quality Manager `Allowed with conditions` under the same key [K11], whose whole text ' +
          'is "Annotations feed the feedback signal". One capability, one condition, both roles ' +
          'identical.',
        locator: 'MTX-TEN-02c · L22064; condition [K11] · L22072',
      },
      {
        text:
          'Seven capabilities in three tokens, and the two roles differ on three of them. ' +
          '§21.10 uses no `Allowed with conditions` anywhere: the Supervisor is `Explicitly ' +
          'prohibited — no gate decision authority` on row 1, `Explicitly prohibited` on row 5, ' +
          'and `Read-only — through the learning read view` on row 6, where the Quality Manager ' +
          'is `Allowed` on all three. A module-level "both alike" erases every one of those.',
        locator: 'MOD-CC-07 §21.10 · L37505, L37509, L37510',
      },
    ],
    statements: [
      { text: 'Allowed with conditions', line: 22064 },
      { text: 'Explicitly prohibited — no gate decision authority', line: 37505 },
      { text: 'Explicitly prohibited', line: 37509 },
      { text: 'Read-only — through the learning read view', line: 37510 },
    ],
    renderedConsequence:
      'A screen built from the module-level row would draw the Supervisor and the Quality ' +
      'Manager identically on every control this module offers. The capability table says they ' +
      'differ on three of seven rows, including the one row that governs this module\'s own ' +
      'screen. The module-level token is also not a token this table uses at all, so the two ' +
      'cannot be joined by their status text — only by the act they are about.',
  },
  {
    id: 'learning-read-view-supervisor',
    subject: 'Who may open the learning read view, SCR-CC-13',
    ownRow: 6,
    column: 'Supervisor',
    question:
      'May a Supervisor open the learning read view read-only, or is the screen the Quality ' +
      "Manager's alone?",
    readings: [
      {
        text:
          'Quality Manager alone. The screen register\'s `Roles that can open it` column for ' +
          'SCR-CC-13 reads `Quality Manager`, with no second role named — the only Command ' +
          'Center screen row that names exactly one role.',
        locator: '§25.5 screen register · L48398',
      },
      {
        text:
          'The Supervisor holds a read. This module\'s row 6 gives the Supervisor `Read-only — ' +
          'through the learning read view`, naming the screen in the cell; and the view\'s own ' +
          'functionality, FUNC-CC-0605-1-1 in MOD-CC-06, records "Roles allowed: Quality ' +
          'Manager, Supervisor read-only". Two statements against the register\'s one.',
        locator: 'MOD-CC-07 §21.10 row 6 · L37510; FUNC-CC-0605-1-1 · L37434',
      },
    ],
    statements: [
      { text: 'Quality Manager', line: 48398 },
      { text: 'Read-only — through the learning read view', line: 37510 },
      { text: 'Roles allowed: Quality Manager, Supervisor read-only', line: 37434 },
    ],
    renderedConsequence:
      'This is the divergence that lands on this module\'s own route. Under reading A a ' +
      'Supervisor reaching /command-center/learning-read-view is refused at the door; under ' +
      'reading B the same Supervisor is served the page and every decision control on it is ' +
      'inert, which is what `Read-only` means. `routeBySurface(\'SURF-CC\')` already admits the ' +
      'Supervisor to this surface, so reading A is not enforced anywhere today and reading B is ' +
      'what a Supervisor would meet. The register row is rendered on screen verbatim beside ' +
      'row 6 rather than reconciled with it, and `src/surfaces/cc/screens.ts` — which carries ' +
      'the register row as `rolesThatCanOpen: [QM]` — is another task\'s file and is not edited.',
  },
  {
    id: 'feat-cc-0603-names-three-things',
    subject: 'What FEAT-CC-0603 is, and therefore what shares this screen',
    ownRow: null,
    column: 'Feature identifier',
    question:
      'Is the MOD-CC-06 half of SCR-CC-13 the feature §21.9 calls FEAT-CC-0603, or the feature ' +
      'the register describes?',
    readings: [
      {
        text:
          'The identifier is authoritative. §21.9 names FEAT-CC-0603 "Aging" — a 30-day stale ' +
          'flag and a never-expire rule, both server-side and neither a read view — so ' +
          'SCR-CC-13 shows aging beside MOD-CC-07.',
        locator: 'MOD-CC-06 §21.9 · L37420; register · L48398',
      },
      {
        text:
          'The description is authoritative and the identifier is shifted. The register\'s own ' +
          'Purpose for SCR-CC-13 is "Read what the platform has learned, changing nothing" and ' +
          'FUNC-CC-0605-1-1\'s own Purpose, under FEAT-CC-0605 "The learning read view", is ' +
          '"show what the platform has learned, changing nothing" — the same sentence in every ' +
          'word but the verb, and no other functionality in the chapter carries it. It is a ' +
          'near-quotation and not a quotation, which is worth saying: a paraphrase that is true ' +
          'of a set can be false of the words. And §25\'s inventory shifts MOD-CC-06\'s ' +
          'feature names by one step against ' +
          'their identifiers — L47538 gives FEAT-CC-0602 the name of §21.9\'s FEAT-CC-0603, and ' +
          'L47539 gives FEAT-CC-0603 the name of §21.9\'s FEAT-CC-0604 — because that table is ' +
          'capped at three features per module (L47518: "Thirteen source-stated modules, ' +
          'thirty-nine features") while §21.9 specifies five, so FEAT-CC-0604 and FEAT-CC-0605 ' +
          'have no row in it at all.',
        locator: '§25.5 · L48398; FEAT-CC-0605 · L37432 and L37434; §25 inventory · L47538, L47539',
      },
    ],
    statements: [
      { text: 'Aging', line: 37420 },
      { text: 'The package test', line: 47539 },
      { text: 'The learning read view', line: 37432 },
    ],
    renderedConsequence:
      'This screen serves two modules and the boundary between them is drawn on this ' +
      'identifier. MOD-CC-07 owns the route because it owns the slug; the other half is ' +
      'MOD-CC-06\'s and is not built here under either reading. The consequence of choosing is ' +
      'that one reading mounts a stale-flag panel and the other mounts a read-only learning ' +
      'history, so the register row is rendered verbatim on screen and the question is left ' +
      'open for the task that owns MOD-CC-06.',
  },
  {
    id: 'open-decision-on-this-module',
    subject: 'Whether this module carries an open client decision',
    ownRow: null,
    column: 'Open decisions',
    question:
      'Does MOD-CC-07 carry an open client decision, or none?',
    readings: [
      {
        text:
          'None. The chapter-31 module-to-decision table gives this module\'s `Open decisions` ' +
          'cell as `Not applicable — no open decision on this module`, the same cell twelve ' +
          'other rows of that table carry.',
        locator: 'Module-to-decision table · header L60819, row L60827',
      },
      {
        text:
          'One, and two of its four named writes are this module\'s. §21.10\'s own Source ' +
          'status files case-relevance marks and optional feedback as ' +
          '"surface-originating writes outside the counted ten: `DEC-CCWRITE-001` (`Client ' +
          'Decision Required`)", and the decision card itself names both acts, attributing the ' +
          'second to §6.8 — this module\'s own source section.',
        locator: 'Source status · L37630; DEC-CCWRITE-001 · L35350',
      },
    ],
    statements: [
      { text: 'Not applicable — no open decision on this module', line: 60827 },
      { text: 'DEC-CCWRITE-001 (Client Decision Required)', line: 37630 },
      { text: 'optional one-tap feedback on agent outputs [SoW Fact — §6.8.2]', line: 35350 },
    ],
    renderedConsequence:
      'Nothing renders differently, which is why it is worth recording: a client reading the ' +
      'module-to-decision table would conclude there is nothing to decide here, and two of ' +
      'DEC-CCWRITE-001\'s four outside-writes originate on this module. The register that holds ' +
      'them is wave 0\'s `src/surfaces/cc/actions/outside-writes.ts` and is read, not re-minted.',
  },
] as const satisfies readonly Cc07Divergence[]

export function cc07Divergence(id: string): Cc07Divergence {
  const found = CC07_DIVERGENCES.find((d) => d.id === id)
  if (found === undefined) throw new Error(`MOD-CC-07 has no divergence "${id}"`)
  return found
}

/* ==================================================================== *
 * TWO GAPS THAT ARE NOT DIVERGENCES. One statement each, and what is
 * missing is the finding.
 * ==================================================================== */

export interface Cc07Gap {
  readonly id: string
  /** The criterion or rule that binds, and what it asserts. */
  readonly binds: string
  /** What is absent, stated as a measurement rather than an impression. */
  readonly absence: string
  /** Why it is not repaired here. */
  readonly notRepaired: string
  readonly sourceRefs: readonly string[]
}

export const CC07_GAPS = [
  {
    id: 'no-freshness-class-assignment',
    binds:
      'AC-CC-110 (L35907) — "Every rendered element carries exactly one assigned freshness ' +
      'class, and the assignment is discoverable in the element\'s specification." ' +
      '§21.3\'s supporting table (introduced L35880, header L35882, separator L35883) is where ' +
      'that assignment is made for this surface, and it carries eighteen data rows at ' +
      'L35884-L35901.',
    absence:
      'MOD-CC-07 appears in no row of those eighteen. Its `Module` column names eleven of the ' +
      'thirteen modules and the two it does not name are MOD-CC-07 and MOD-CC-13, so no element ' +
      'of this module has an ' +
      'assigned class — including row 6\'s "aggregated effect of feedback", which is a rendered ' +
      'element of this module\'s own screen, and the signal volume the learning read view shows ' +
      'so that "a gap is visible rather than assumed" (L37607).',
    notRepaired:
      'Choosing a class would be this build assigning one, which is exactly what AC-CC-110 ' +
      'requires the specification to do. `src/surfaces/cc/live/model.ts` transcribes the ' +
      'eighteen rows and is another task\'s file; a nineteenth row invented here would be a ' +
      'value where the source has none.',
    sourceRefs: ['L35880', 'L35882', 'L35884', 'L35901', 'L35907', 'L37607'],
  },
  {
    id: 'absent-from-the-surface-matrix',
    binds:
      'DEC-CCWRITE-001 (L35350) says of this module\'s two writes that they "originate here and ' +
      'are not enumerated anywhere". The surface matrix at §21.1.2 — header L35002, separator ' +
      'L35003, twenty data rows L35004-L35023 — is the enumeration that would carry them.',
    absence:
      'None of this module\'s seven capabilities appears among those twenty rows, and no row of ' +
      'the twenty carries the word "feedback" or "relevan" in its Capability column at all. So ' +
      '"not enumerated anywhere" is measured rather than quoted: the two writes are granted at ' +
      'L37506 and L37508 and counted in no surface-level list.',
    notRepaired:
      'Adding a row would be this build enumerating what the decision records as unenumerated, ' +
      'and would settle DEC-CCWRITE-001 by construction. The register of the six writes that ' +
      'sit outside the ten is wave 0\'s and is consumed rather than extended.',
    sourceRefs: ['L35002', 'L35004', 'L35023', 'L35350', 'L37506', 'L37508'],
  },
] as const satisfies readonly Cc07Gap[]

/**
 * The two of `DEC-CCWRITE-001`'s four that are this module's, SELECTED from
 * wave 0's register by act rather than re-typed.
 *
 * IT LIVES HERE AND NOT IN THE PANEL. The panel became a `'use client'` file
 * when `pnpm build` refused a server component passing an event handler to
 * `WriteControl`'s enabled branch — and a client module exporting a plain data
 * object is the slice-7 defect: a server component reading it gets undefined
 * strings at prerender, invisible to every component test.
 *
 * A gate in this module's suite now checks what a client file EXPORTS rather
 * than whether it is one, and this constant is what it caught first.
 */
export const OWN_OUTSIDE_WRITE_ACTS = [
  'Marking a prior case relevant or not relevant',
  'Optional one-tap feedback on agent outputs',
] as const satisfies readonly string[]

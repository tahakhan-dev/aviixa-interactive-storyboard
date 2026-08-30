/**
 * WHERE `MTX-TEN-02a`'S ROW FOR `MOD-DOH-09` AND `MOD-DOH-09`'S OWN CARD SAY
 * OPPOSITE THINGS, AND WHY THIS IS THE WORST MODULE FOR IT TO HAPPEN ON.
 *
 * ── THE MODULE'S MATRIX IS NOW HERE, AND THIS PARAGRAPH USED TO SAY IT ────
 * ── WAS NOT ──────────────────────────────────────────────────────────────
 * FINAL WHOLE-UNIT REVIEW (unit-02, Important 3 and 4). This file used to
 * open by explaining that `MOD-DOH-09` kept its matrix in
 * `app/hub/permissions-roles-and-access/fixtures.ts`, that `matrix.ts` was
 * "deliberately absent" from this directory, and that "the generated reach
 * map is byte-identical with and without it". All three statements are now
 * false, and the reason they had to become false is a defect this record was
 * adjacent to and did not catch.
 *
 * That fixtures file was superseded whole by this unit's Task 3 and left
 * with ZERO importers anywhere in the codebase — yet
 * `scripts/build-doh-module-reach.mjs` was still deriving this module's
 * REACH from it, so a dead file was deciding what the live module rail drew.
 * The matrix now lives beside this file, in `./matrix.ts`, and the dead file
 * is deleted. See that file's own header for the move and for the three
 * corrected cells.
 *
 * ── THE DISAGREEMENT ─────────────────────────────────────────────────────
 * Under the header at line 22005, the chapter-22 row for this module marks
 * the Supervisor AND the Quality Manager `Unavailable`. The module's own
 * twelve-row card grants both of them capabilities: the Supervisor can issue
 * or reset a managed personal identification number in own scope (line
 * 28531), and both roles read the user and role register in own scope (line
 * 28532). Derived reach is therefore four roles, both of them included.
 *
 * **THIS IS THE PERMISSIONS MODULE.** Every other tension of this shape puts
 * a person on a screen they may not need; this one puts two roles on the
 * screen where roles and scopes are administered, after a table in the RBAC
 * chapter said neither of them has it. The two capabilities they hold are a
 * write (the managed personal identification number) and a read of the
 * register — so the disagreement is not academic even at V1.
 *
 * ── WHAT THE BUILD DOES, AND WHAT WAS RECORDING IT BEFORE ────────────────
 * Reach USED to be derived from the card, by `rolesReachingByMatrix`, the
 * same rule every Hub module runs — and until this file, the ONLY record of
 * the disagreement anywhere was a line in
 * `docs/census/2026-08-19-surf-doh-slice04-raw-maps.json`, a census artefact
 * outside the source tree that nothing imports and no gate reads. A reader
 * meeting this module met the derived answer and no statement that the source
 * says otherwise. That absence is what this file closes.
 *
 * ── WHICH READING THE BUILD ADOPTED, AND WHEN ────────────────────────────
 * FINAL WHOLE-UNIT REVIEW (unit-02). This paragraph used to end "**NOTHING
 * HERE RESOLVES THE SOURCE'S DISAGREEMENT**", and as a statement about THIS
 * FILE that is still true — no field below marks a reading as the answer.
 * As a statement about the BUILD it had already stopped being true: this
 * unit's Task 3 adopted reading one on the screen, with a reviewed citation,
 * when it set `PermissionsScreen.tsx`'s `VIEW_REQUEST` to
 * `['TENANT_ADMIN', 'READONLY_AUDITOR']`. The module rail went on deriving
 * reading two from the card, so the build held BOTH readings at once and the
 * rail offered two roles a link to a screen that refused them on arrival.
 *
 * `./matrix.ts` now carries reading one as well, so the screen gate and the
 * rail agree. Adopting it is a BUILD decision made under a source that does
 * not settle the question, not a finding that the question is settled: no
 * `DEC-*` identifier in the frozen source names this row (`[H17]` and
 * `[H18]` are its only conditions and both are about the Tenant Admin and
 * the Worker), and `readings` below still carries both readings verbatim
 * with neither marked correct. `wouldChange` is now a description of what
 * this build DID, not of what a client ruling would do.
 *
 * This module is data. It computes nothing and decides nothing.
 */

export const DOH_09_MODULE_ROW_TENSION = {
  question:
    'May the Supervisor and the Quality Manager reach Permissions, Roles and Access — the ' +
    'chapter-22 row says neither may, the module’s own card gives each of them capabilities on ' +
    'it, and one of those capabilities is a write.',
  moduleRow: { matrix: 'MTX-TEN-02a', line: 22015, headerLine: 22005 },
  cardRows: { firstLine: 28522, lastLine: 28533, headerLine: 28520 },
  readings: [
    {
      text:
        'Neither reaches it. The tenant-role-to-module matrix marks both roles `Unavailable` on ' +
        'this module, which under the build’s own rule is the token that withholds a route ' +
        'outright rather than merely granting nothing.',
      locator: 'MTX-TEN-02a row for this module · L22015, under the header at L22005',
    },
    {
      text:
        'Both reach it, on named capabilities. The module’s card gives the Supervisor a scoped ' +
        'write — issue or reset a managed personal identification number — and gives both the ' +
        'Supervisor and the Quality Manager a scoped read of the user and role register. Ten of ' +
        'the card’s twelve rows refuse both; two do not.',
      locator: 'MOD-DOH-09 §19.11 permission matrix · L28531 and L28532, header L28520',
    },
  ],
  /**
   * Every statement of the question found in the source, verbatim, with the
   * line and the column it is a cell of. Held to EXACT equality against that
   * table's own header-keyed cell by `tests/unit/doh-permissions.test.ts`, so
   * a text rewritten to the value that would erase the disagreement reds
   * rather than passing.
   */
  statements: [
    { text: '`Unavailable`', line: 22015, column: 'Supervisor', headerLine: 22005 },
    { text: '`Unavailable`', line: 22015, column: 'Quality Manager', headerLine: 22005 },
    {
      text: '`Allowed with conditions` — own scope, for workers',
      line: 28531,
      column: 'Supervisor',
      headerLine: 28520,
    },
    { text: '`Read-only` — own scope', line: 28532, column: 'Supervisor', headerLine: 28520 },
    { text: '`Read-only` — own scope', line: 28532, column: 'Quality Manager', headerLine: 28520 },
  ],
  derivedFrom:
    'The module row, through rolesReachingByMatrix over src/surfaces/doh/modules/doh-09/' +
    'matrix.ts. UNTIL UNIT-02’s final whole-unit review this read "the card, through ' +
    'rolesReachingByMatrix over app/hub/permissions-roles-and-access/fixtures.ts" — a file ' +
    'that by then had zero importers and had been superseded by that unit’s Task 3, while ' +
    'still deciding this module’s rail. The three cells where the two tables disagree now ' +
    'carry MTX-TEN-02a’s `Unavailable`, so clause two withholds both roles and the derived ' +
    'reach matches PermissionsScreen.tsx’s own VIEW_REQUEST.',
  derivedReach: ['TENANT_ADMIN', 'READONLY_AUDITOR'],
  /**
   * What the card alone derived, before the module row was adopted. Kept so
   * the change this record describes can be read off it rather than only
   * asserted in prose above.
   */
  derivedReachBeforeAdoption: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'],
  /**
   * MEASURED over the live matrix and pinned in
   * `tests/unit/doh-permissions.test.ts`: how many screen rows each disputed
   * role actually holds. Two and one, not twelve — the card refuses both
   * roles everywhere else, which is why the row’s reading is arguable.
   */
  measured: {
    SUPERVISOR: { holdsScreenRows: 0, unavailableScreenRows: 2 },
    QUALITY_MANAGER: { holdsScreenRows: 0, unavailableScreenRows: 1 },
  },
  /**
   * What the CARD alone measured, before the module row was adopted: two
   * held rows for the Supervisor and one for the Quality Manager, neither
   * carrying an `Unavailable` cell anywhere. Those are the three cells
   * `./matrix.ts` corrected, and the pair of numbers is kept here so the
   * correction's exact extent is legible from this record.
   */
  measuredBeforeAdoption: {
    SUPERVISOR: { holdsScreenRows: 2, unavailableScreenRows: 0 },
    QUALITY_MANAGER: { holdsScreenRows: 1, unavailableScreenRows: 0 },
  },
  notResolved:
    'Both readings are recorded and the SOURCE still settles nothing — no DEC-* identifier ' +
    'names this row. What changed in unit-02 is that the BUILD stopped holding both at once: ' +
    'Task 3 adopted the module row at the screen gate (PermissionsScreen.tsx VIEW_REQUEST) ' +
    'while the rail still derived the card, so two roles were offered a link to a screen that ' +
    'refused them. The module row is now adopted in both places. Adopting a reading under an ' +
    'unsettled source is a build decision, and this record is where it is stated.',
  wouldChange:
    'ALREADY DONE, and this field now records the consequence rather than predicting it. ' +
    'Adopting the module row removed the rail link and the route for both roles, and with it ' +
    'the scoped read of the user and role register — the only place either role could see ' +
    'what authority the people they supervise hold. The write went too: nowhere else in the ' +
    'Hub issues a managed personal identification number, so the Supervisor’s cell at line ' +
    '28531 now names a capability with no surface. A client ruling for the CARD would reverse ' +
    'all of it, and would also have to move PermissionsScreen.tsx’s VIEW_REQUEST back.',
  decisionRef: null,
  decisionSearch:
    'No `DEC-*` identifier in the frozen source names this row. `[H17]` states the Tenant ' +
    'Admin’s five-roles-three-scopes remit and `[H18]` explains the Worker’s prohibition; ' +
    'neither mentions the Supervisor or the Quality Manager.',
  /**
   * WHERE THIS WAS RECORDED BEFORE, named so the census line and this record
   * cannot drift into two independent findings. A census artefact is not a
   * disclosure: nothing imports it and no gate reads it.
   */
  priorRecord:
    'docs/census/2026-08-19-surf-doh-slice04-raw-maps.json — the slice-4 census, outside the ' +
    'source tree, recording both readings and nothing rendering or asserting them.',
} as const

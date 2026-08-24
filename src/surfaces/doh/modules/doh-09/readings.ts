/**
 * WHERE `MTX-TEN-02a`'S ROW FOR `MOD-DOH-09` AND `MOD-DOH-09`'S OWN CARD SAY
 * OPPOSITE THINGS, AND WHY THIS IS THE WORST MODULE FOR IT TO HAPPEN ON.
 *
 * ── THE MODULE'S MATRIX IS NOT HERE, AND THAT IS WHY THIS FILE IS ─────────
 * `MOD-DOH-09` keeps its permission matrix in
 * `app/hub/permissions-roles-and-access/fixtures.ts` — one of the slice-4
 * eight, whose matrices live beside their route rather than under `src/`.
 * `scripts/build-doh-module-reach.mjs` reads it there and there is nothing
 * wrong with that, but it leaves this module with no file under `src/` where
 * a disclosure about its reach could sit. So the disclosure sits here, in the
 * directory the reach generator's FIRST candidate names and does not find:
 * `matrix.ts` is deliberately absent, this file is `readings.ts`, and the
 * generated reach map is byte-identical with and without it.
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
 * Reach is derived from the card, by `rolesReachingByMatrix`, the same rule
 * every Hub module runs — and until this file, the ONLY record of the
 * disagreement anywhere was a line in
 * `docs/census/2026-08-19-surf-doh-slice04-raw-maps.json`, a census artefact
 * outside the source tree that nothing imports and no gate reads. A reader
 * meeting this module met the derived answer and no statement that the source
 * says otherwise. That absence is what this file closes.
 *
 * **NOTHING HERE RESOLVES THE SOURCE'S DISAGREEMENT.** The record has no
 * field on which a reading could be marked the answer, and no `DEC-*`
 * identifier in the frozen source names this row: `[H17]` and `[H18]` are its
 * only conditions and both are about the Tenant Admin and the Worker.
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
    'The card, through rolesReachingByMatrix over app/hub/permissions-roles-and-access/' +
    'fixtures.ts. Clause one finds the two capabilities; clause two withholds nothing, because ' +
    'neither role carries an `Unavailable` cell anywhere on the card.',
  derivedReach: ['TENANT_ADMIN', 'SUPERVISOR', 'QUALITY_MANAGER', 'READONLY_AUDITOR'],
  /**
   * MEASURED over the live matrix and pinned in
   * `tests/unit/doh-permissions.test.ts`: how many screen rows each disputed
   * role actually holds. Two and one, not twelve — the card refuses both
   * roles everywhere else, which is why the row’s reading is arguable.
   */
  measured: {
    SUPERVISOR: { holdsScreenRows: 2, unavailableScreenRows: 0 },
    QUALITY_MANAGER: { holdsScreenRows: 1, unavailableScreenRows: 0 },
  },
  notResolved:
    'Both readings are recorded and neither is adopted. This build derives from the card ' +
    'because the card is the table that names capabilities, not because the source settles it.',
  wouldChange:
    'A client ruling for the module row would remove the rail link and the route for both ' +
    'roles, and with it the scoped read of the user and role register — which is the only ' +
    'place either role can see what authority the people they supervise hold. The write would ' +
    'go too: nowhere else in the Hub issues a managed personal identification number, so the ' +
    'Supervisor’s cell at line 28531 would name a capability with no surface.',
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

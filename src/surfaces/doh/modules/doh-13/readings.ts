/**
 * WHERE `MTX-TEN-02a`'S ROW FOR `MOD-DOH-13` AND `MOD-DOH-13`'S OWN CARD SAY
 * OPPOSITE THINGS — AND THE ONE MEASUREMENT THAT KEEPS THE OBVIOUS EXPLANATION
 * FROM BEING WRITTEN DOWN AS THE REASON.
 *
 * ── WHY THIS FILE, AND NOT THE MATRIX ────────────────────────────────────
 * `MOD-DOH-13` keeps its permission matrix in
 * `app/hub/tenant-view-of-platform-administration/fixtures.ts`, beside its
 * route, as the slice-4 eight do. That leaves the module with no file under
 * `src/` for a disclosure about its reach, so this one sits in the directory
 * the reach generator's first candidate names and does not find. `matrix.ts`
 * is deliberately absent here; the generated reach map is byte-identical with
 * and without this file.
 *
 * ── THE DISAGREEMENT ─────────────────────────────────────────────────────
 * Under the header at line 22005, the chapter-22 row gives the Supervisor and
 * the Quality Manager `Read-only` on this module. Derived reach is
 * `TENANT_ADMIN, READONLY_AUDITOR`: neither granted role is offered the
 * route.
 *
 * ── AND THERE ARE TWO INDEPENDENT REASONS, WHICH IS THE POINT ────────────
 * The easy account is that both roles hold only `chrome` rows, and clause one
 * of `rolesReachingByMatrix` counts screen rows alone. That is true as far as
 * it goes — their whole holding is the three banner-and-announcement rows at
 * lines 29198, 29199 and 29200, all classified `chrome` because the support
 * banner and the announcement ride on every screen of the surface rather than
 * on this one.
 *
 * **BUT IT IS NOT THE ONLY REASON, AND ON ITS OWN IT WOULD BE A FRAGILE
 * DISCLOSURE.** Measured over the live matrix: this card has exactly TWO rows
 * classified `screen` — Platform Access History (line 29197) and the
 * post-session report (line 29205) — and BOTH read `Unavailable` for both
 * roles. So clause two withholds the route as well, independently. Reclassify
 * all three `chrome` rows as `screen` tomorrow and the answer does not move:
 * the two `Unavailable` cells still withhold it. `measured` below records
 * both counts and the unit suite pins them, so a disclosure resting on one
 * clause cannot quietly become the whole story.
 *
 * **NOTHING HERE RESOLVES THE SOURCE'S DISAGREEMENT.** No `DEC-*` identifier
 * names this row: `[H26]` is its only condition and it qualifies the Tenant
 * Admin's cell, naming Platform Access History, the support-session banner
 * with its End-session control, and platform announcements.
 *
 * This module is data. It computes nothing and decides nothing.
 */

export const DOH_13_MODULE_ROW_TENSION = {
  question:
    'May the Supervisor and the Quality Manager reach Tenant View of Platform Administration? ' +
    'The chapter-22 row gives both `Read-only`; the card refuses both on both of its screen ' +
    'rows and grants them only chrome that rides on every other screen.',
  moduleRow: { matrix: 'MTX-TEN-02a', line: 22019, headerLine: 22005 },
  cardRows: { firstLine: 29197, lastLine: 29206, headerLine: 29195 },
  readings: [
    {
      text:
        'Both hold the module read-only. That is the standing the tenant-role-to-module matrix ' +
        'states for them, and it is the same token it gives the Read-only Auditor on the same ' +
        'row — a role this build does offer the route.',
      locator: 'MTX-TEN-02a row for this module · L22019, under the header at L22005',
    },
    {
      text:
        'Neither reaches the module. On the card’s two own-screen rows both roles read ' +
        '`Unavailable`, and everything they do hold — seeing the support-session banner, ending ' +
        'a session from it, seeing an announcement — is surface chrome carried on every screen ' +
        'of the Hub rather than a capability of this one.',
      locator: 'MOD-DOH-13 §19.15 permission matrix · L29197 and L29205, header L29195',
    },
  ],
  /**
   * Every statement of the question found in the source, verbatim, with the
   * line and the column it is a cell of. Held to EXACT equality against that
   * table's own header-keyed cell by `tests/unit/doh-permissions.test.ts`.
   * The three chrome rows are included on purpose: the disclosure's claim is
   * about what those rows ARE, so their texts have to be checkable too.
   */
  statements: [
    { text: '`Read-only`', line: 22019, column: 'Supervisor', headerLine: 22005 },
    { text: '`Read-only`', line: 22019, column: 'Quality Manager', headerLine: 22005 },
    { text: '`Unavailable`', line: 29197, column: 'Supervisor', headerLine: 29195 },
    { text: '`Unavailable`', line: 29197, column: 'Quality Manager', headerLine: 29195 },
    { text: '`Unavailable`', line: 29205, column: 'Supervisor', headerLine: 29195 },
    { text: '`Unavailable`', line: 29205, column: 'Quality Manager', headerLine: 29195 },
    { text: '`Allowed`', line: 29198, column: 'Supervisor', headerLine: 29195 },
    {
      text:
        '`Allowed with conditions` — any signed-in web user seeing the banner may end it, ' +
        'because the control belongs to the tenant',
      line: 29199,
      column: 'Supervisor',
      headerLine: 29195,
    },
    { text: '`Allowed`', line: 29200, column: 'Quality Manager', headerLine: 29195 },
  ],
  derivedFrom:
    'The card, through rolesReachingByMatrix over ' +
    'app/hub/tenant-view-of-platform-administration/fixtures.ts. Both clauses withhold ' +
    'independently, which is what `measured` records.',
  derivedReach: ['TENANT_ADMIN', 'READONLY_AUDITOR'],
  /**
   * MEASURED over the live matrix and pinned in
   * `tests/unit/doh-permissions.test.ts`. `holdsChromeRows` is what the easy
   * explanation rests on; `unavailableScreenRows` is why the answer does not
   * depend on it.
   */
  measured: {
    screenRows: 2,
    SUPERVISOR: { holdsScreenRows: 0, holdsChromeRows: 3, unavailableScreenRows: 2 },
    QUALITY_MANAGER: { holdsScreenRows: 0, holdsChromeRows: 3, unavailableScreenRows: 2 },
    reachIsIndependentOfChromeClassification: true,
  },
  notResolved:
    'Both readings are recorded and neither is adopted. Nothing here decides whether chrome a ' +
    'role meets on every screen is module standing.',
  wouldChange:
    'A client ruling for the module row would offer both roles the rail link and the route, and ' +
    'what they would meet is a screen whose two own rows both read `Unavailable` for them — the ' +
    'empty-screen outcome the derivation exists to avoid. Nothing they hold today would change: ' +
    'the banner, the End-session control and the announcement already reach them as chrome, ' +
    'wherever they are standing.',
  decisionRef: null,
  decisionSearch:
    'No `DEC-*` identifier in the frozen source names this row. `[H26]` is its only condition ' +
    'and it qualifies the Tenant Admin’s cell.',
} as const

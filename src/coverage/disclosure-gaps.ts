/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THREE GAPS THIS BUILD PUBLISHES RATHER THAN CLOSES.
 *
 * The first two are named literals, and both exist for the same reason: the
 * figure they
 * hold is a measurement over `tests/` and over the built export, and a Server
 * Component can read neither. So the measurement is written down once, the
 * page derives its sentence from it, and a release gate compares the literal
 * against a fresh measurement BY EQUALITY. A literal nobody checks is a
 * hardcoded assumption; a literal a gate checks every run is a ratchet.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * ── R6-B03 item 2 · THE RESIDUAL SOURCE CONTRADICTIONS ALREADY DISCLOSED ───
 *
 * `registries/generated/source-reconciliation.json` carries 45 residual
 * contradictions — source disagreements the frozen document never resolves —
 * and NOT ONE of them reached a reader. They are, however, not 45 NEW facts:
 * this build already discloses most of them through `@/disclosure/decisions`,
 * whose open-decision records render every reading of a question the source
 * leaves open, on the screens where the question bites.
 *
 * MEASURED over every built page EXCEPT the coverage dashboard itself, with
 * the flight payload stripped: 31 of the 45 carry a `DEC-` identifier a
 * reader can already find rendered elsewhere in the export, across the 30
 * distinct identifiers below. 14 reach no other page at all — seven that
 * carry an identifier nothing else renders, and seven count conflicts the
 * register states without minting one.
 *
 * THE DASHBOARD IS EXCLUDED FROM THAT MEASUREMENT ON PURPOSE. It is the page
 * doing the rendering, so counting it would let a record justify its own
 * omission — and one did: `DEC-SCHED-001` appears on `/coverage/` inside a
 * reconciliation row and nowhere else, which is a citation, not a disclosure
 * of the disagreement. It was on this list until the gate excluded the
 * dashboard and convicted it.
 *
 * SO THIS BUILD RENDERS THE 14 AND NOT THE 45. A second rendering of a
 * contradiction a reader can already read in full is noise, not coverage, and
 * the overlap is published beside the 14 so the choice is visible rather than
 * implied. `tests/coverage/reconciliation-table.test.ts` asserts this list
 * against `out/` in both directions: an identifier here that stops being
 * rendered anywhere goes red, and a contradiction rendered nowhere that is not
 * in the 14 goes red.
 */
export const CONTRADICTIONS_DISCLOSED_ELSEWHERE = [
  "DEC-ANON-001", "DEC-AREA-001", "DEC-AUDITQM-001", "DEC-AUDSTU-001",
  "DEC-CAP-001", "DEC-CCWRITE-001", "DEC-CMDCLASS-001", "DEC-CONTLAUNCH-001",
  "DEC-DELEG-001", "DEC-FEAT-001", "DEC-FINISH-001", "DEC-GATE-001",
  "DEC-LANEB-001", "DEC-LANEBAUTH-001", "DEC-LIB-001", "DEC-PKGFIELD-001",
  "DEC-PLUS-001", "DEC-REPORT-001", "DEC-ROLE-001", "DEC-ROOTSUCC-001",
  "DEC-SITE-001", "DEC-STORE-001", "DEC-STUCK-001",
  "DEC-STUDIO-001", "DEC-SUBAUTH-001", "DEC-SUSP-001", "DEC-SYNC-001",
  "DEC-TAX-002", "DEC-WIDIFF-001", "DEC-WIPE-001",
] as const satisfies readonly string[]

/** The leading `DEC-` identifier of a residual-contradiction record, if it has one. */
export function contradictionIdentifier(record: string): string | null {
  return /\b(DEC-[A-Z0-9]+-[0-9]+)\b/.exec(record)?.[1] ?? null
}

/**
 * The residual contradictions that reach no reader anywhere else in the build.
 * Derived, so a decision record added later removes its contradiction from
 * this page without anyone editing the page.
 */
export function contradictionsDisclosedNowhereElse(
  records: readonly string[],
): readonly string[] {
  const elsewhere: ReadonlySet<string> = new Set<string>(CONTRADICTIONS_DISCLOSED_ELSEWHERE)
  return records.filter((r) => {
    const id = contradictionIdentifier(r)
    return id === null || !elsewhere.has(id)
  })
}

/**
 * ── R6-B07 · ACCEPTANCE CRITERIA CITED IN THE PRODUCT AND IN NO TEST ───────
 *
 * Master prompt §9.2 requires a typed traceability chain and §29.4 forbids a
 * completion claim while "an acceptance criterion lacks a test". Measured over
 * every `.ts`/`.tsx` file: 799 distinct `AC-*` identifiers are cited under
 * `src/` and `app/`; 399 distinct ones appear under `tests/`; the 440 below
 * are cited in the product and appear in NO test file. Every one was checked
 * against the frozen source and is a real identifier there — none is a
 * build-coined shape.
 *
 * WHAT THIS IS NOT. It is not a claim that 440 criteria are untested. A
 * criterion can be tested without its identifier appearing in the test — but
 * then no traceability chain exists for it either, which §9.2 requires
 * separately, so the honest reading of this list is "no chain", not "no test".
 *
 * HOW IT MUST NOT BE CLOSED, stated here because it is the cheap way out. It
 * must not be closed by narrowing what counts as a citation, and it must not
 * be closed by sprinkling identifiers into test names. Pasting an identifier
 * into a `describe` string removes a row from this list and proves nothing.
 * `tests/coverage/reconciliation-table.test.ts` compares this list against a
 * fresh measurement by equality IN BOTH DIRECTIONS, so the only edits that go
 * green are: a criterion genuinely gaining a test that names it (remove a
 * row), or the product citing a new criterion (add one). Both are deliberate.
 *
 * THE AUDIT REPORTED 804 / 451 AND THIS FILE REPORTS 799 / 440. The
 * difference is token anchoring, not scope: without a trailing
 * `(?![A-Za-z0-9-])` the scan also matches the PREFIX of a longer identifier,
 * counting the truncated stem of `AC-SA-06-03` as a criterion in its own
 * right. A stem is not a criterion. The wider `AC-` shape is kept in every other respect —
 * the canonical digit-suffixed shape alone would report 790, and reporting the
 * smaller number is exactly what this finding forbids.
 */
export const AC_CITED_IN_PRODUCT_NOT_IN_TESTS = [
  "AC-009-01", "AC-009-04", "AC-15-01", "AC-16-03", "AC-16-39",
  "AC-16-41", "AC-16-42", "AC-30B-501", "AC-30B-502",
  "AC-30C-1204", "AC-30C-705", "AC-30D-1302", "AC-36-301",
  "AC-36-304", "AC-36-501", "AC-36-505", "AC-36-506",
  "AC-36-603", "AC-36-604", "AC-37-2", "AC-37-201",
  "AC-37-3", "AC-37-4", "AC-37-5", "AC-37-6",
  "AC-37A-101", "AC-37A-102", "AC-37A-103", "AC-37A-104",
  "AC-37A-105", "AC-37A-106", "AC-37A-107", "AC-37A-108",
  "AC-37A-109", "AC-37A-110", "AC-37A-111", "AC-37A-112",
  "AC-37A-201", "AC-37A-202", "AC-37A-203", "AC-37A-204",
  "AC-37A-205", "AC-37A-206", "AC-37A-207", "AC-37A-208",
  "AC-37A-209", "AC-37A-210", "AC-37A-211", "AC-37A-301",
  "AC-37A-302", "AC-37A-303", "AC-37A-304", "AC-37A-305",
  "AC-37A-306", "AC-37A-307", "AC-37A-308", "AC-37A-309",
  "AC-37A-310", "AC-37A-401", "AC-37A-402", "AC-37A-403",
  "AC-37A-404", "AC-37A-405", "AC-37A-406", "AC-37A-407",
  "AC-37A-408", "AC-37A-409", "AC-37A-410", "AC-37A-501",
  "AC-37A-502", "AC-37A-503", "AC-37A-504", "AC-37A-505",
  "AC-37A-506", "AC-37A-507", "AC-37A-508", "AC-37A-509",
  "AC-37A-510", "AC-37A-601", "AC-37A-602", "AC-37A-603",
  "AC-37A-604", "AC-37A-605", "AC-37A-606", "AC-37A-607",
  "AC-37A-608", "AC-37A-609", "AC-37A-610", "AC-37A-701",
  "AC-37A-702", "AC-37A-703", "AC-37A-704", "AC-37A-705",
  "AC-37A-706", "AC-37A-707", "AC-37A-708", "AC-37A-709",
  "AC-43-251", "AC-43-312", "AC-43-336", "AC-43-351",
  "AC-43-352", "AC-44A-01-1", "AC-44A-05-1", "AC-44A-05-3",
  "AC-44A-05-4", "AC-44A-05-6", "AC-44A-06-1", "AC-44A-07-1",
  "AC-44A-07-5", "AC-44A-09-2", "AC-44A-11-4", "AC-44A-12-1",
  "AC-44A-12-4", "AC-44A-13-1", "AC-44A-16-6", "AC-44A-17-5",
  "AC-44A-18-5", "AC-44A-19-1", "AC-44A-21-1", "AC-44A-21-2",
  "AC-44A-21-3", "AC-44A-21-4", "AC-44A-21-5", "AC-44A-22-1",
  "AC-44A-22-2", "AC-44A-22-3", "AC-44A-22-4", "AC-44A-22-5",
  "AC-44A-23-1", "AC-44A-23-2", "AC-44A-23-3", "AC-44A-23-4",
  "AC-44A-23-5", "AC-44A-24-1", "AC-44A-24-2", "AC-44A-24-3",
  "AC-44A-24-4", "AC-44A-24-5", "AC-44A-25-1", "AC-44A-25-3",
  "AC-44A-25-4", "AC-44A-25-5", "AC-44A-26-1", "AC-44A-26-2",
  "AC-44A-26-3", "AC-44A-26-4", "AC-44A-26-5", "AC-44A-27-1",
  "AC-44A-27-2", "AC-44A-27-3", "AC-44A-27-4", "AC-44A-27-5",
  "AC-44A-28-1", "AC-44A-28-2", "AC-44A-28-3", "AC-44A-28-4",
  "AC-44A-28-5", "AC-44A-29-1", "AC-44A-29-2", "AC-44A-29-3",
  "AC-44A-29-4", "AC-44A-29-5", "AC-44A-30-1", "AC-44A-30-2",
  "AC-44A-30-3", "AC-44A-30-4", "AC-44A-30-5", "AC-4803",
  "AC-4810", "AC-4853", "AC-4870", "AC-4873",
  "AC-4883", "AC-51-12", "AC-51-15", "AC-51-41",
  "AC-A2-1", "AC-A2-4", "AC-A2-7", "AC-A3-1",
  "AC-A3-2", "AC-A3-3", "AC-A3-4", "AC-A3-5",
  "AC-A3-6", "AC-A3-7", "AC-A3-9", "AC-A5-1",
  "AC-A5-2", "AC-A5-6", "AC-A5-7", "AC-A5-8",
  "AC-A6-1", "AC-A6-10", "AC-A6-2", "AC-A6-4",
  "AC-A6-5", "AC-A6-6", "AC-A6-9", "AC-A7-1",
  "AC-A7-2", "AC-A7-5", "AC-A7-8", "AC-AI-003",
  "AC-AI-007-1", "AC-AI-008-2", "AC-AI-008-3", "AC-AI-011-1",
  "AC-AI-011-2", "AC-AI-011-4", "AC-AI-011-8", "AC-AI-014-8",
  "AC-AI-105-5", "AC-AUTH-006", "AC-B10-1", "AC-B10-2",
  "AC-B10-3", "AC-B10-4", "AC-B10-5", "AC-B10-8",
  "AC-B11-1", "AC-B11-3", "AC-B11-6", "AC-B11-7",
  "AC-B8-1", "AC-B8-2", "AC-B8-4", "AC-B9-1",
  "AC-B9-3", "AC-B9-4", "AC-B9-5", "AC-B9-8",
  "AC-CC-072", "AC-CC-140", "AC-CC-143", "AC-CC-153",
  "AC-CC-160", "AC-CC-200", "AC-CC-201", "AC-CC-206",
  "AC-CC-207", "AC-CC-226", "AC-CC-241", "AC-CC-264",
  "AC-CC-269", "AC-CC-284", "AC-CC-304", "AC-CC-322",
  "AC-CC-323", "AC-CC-324", "AC-CC-344", "AC-CC-346",
  "AC-CC-409", "AC-CH27-02", "AC-COV-112", "AC-DOH-01-1",
  "AC-DOH-01-10", "AC-DOH-012-1", "AC-DOH-014-1", "AC-DOH-03-1",
  "AC-DOH-03-2", "AC-DOH-03-3", "AC-DOH-03-4", "AC-DOH-03-5",
  "AC-DOH-03-6", "AC-DOH-04-1", "AC-DOH-04-10", "AC-DOH-04-11",
  "AC-DOH-04-6", "AC-DOH-04-7", "AC-DOH-04-8", "AC-DOH-04-9",
  "AC-DOH-05-1", "AC-DOH-05-11", "AC-DOH-05-2", "AC-DOH-05-4",
  "AC-DOH-05-5", "AC-DOH-07-1", "AC-DOH-07-2", "AC-DOH-07-3",
  "AC-DOH-07-4", "AC-DOH-07-7", "AC-DOH-07-8", "AC-DOH-09-9",
  "AC-DOH-12-1", "AC-DOH-12-4", "AC-DOH-12-6", "AC-DOH-13-1",
  "AC-DOH-13-2", "AC-DOH-13-3", "AC-DOH-13-5", "AC-DOH-13-6",
  "AC-DOH-14-4", "AC-DOH-15-3", "AC-DOH-16-4", "AC-FL-001-5",
  "AC-FL-006-4", "AC-FL-026-5", "AC-FLOOR-003", "AC-GOAL-051",
  "AC-GOAL-064", "AC-GOAL-065", "AC-NFR-1105", "AC-OFF-404",
  "AC-PKG-401", "AC-PKG-402", "AC-PKG-404", "AC-PKG-405",
  "AC-PKG-503", "AC-PKG-504", "AC-PKG-601", "AC-PKG-602",
  "AC-PROD-054", "AC-RBAC-004", "AC-RBAC-005", "AC-RBAC-104",
  "AC-RBAC-203", "AC-RBAC-602", "AC-RUN-002", "AC-RUN-003",
  "AC-RUN-005", "AC-SA-000-06", "AC-SA-01-06", "AC-SA-01-08",
  "AC-SA-02-03", "AC-SA-02-06", "AC-SA-02-07", "AC-SA-04-05",
  "AC-SA-05-01", "AC-SA-05-04", "AC-SA-05-06", "AC-SA-07-05-01",
  "AC-SA-07-05-03", "AC-SA-07-06-01", "AC-SA-07-07-02", "AC-SA-07-07-03",
  "AC-SA-07-08-02", "AC-SA-07-08-03", "AC-SA-07-09-01", "AC-SA-07-10-01",
  "AC-SA-07-11-02", "AC-SA-07-12-03", "AC-SA-07-13-04", "AC-SA-07-13-06",
  "AC-SA-07-14-01", "AC-SA-07-14-05", "AC-SA-07-15-03", "AC-SA-08-02",
  "AC-SA-08-03", "AC-SA-08-04", "AC-SA-08-06", "AC-SA-08-09",
  "AC-SA-08-10", "AC-SA-08-11", "AC-SA-09-01", "AC-SA-09-03",
  "AC-SA-09-04", "AC-SA-09-05", "AC-SA-09-06", "AC-SA-09-08",
  "AC-SA-09-11", "AC-SA-09-12", "AC-SA-10-02", "AC-SA-10-03",
  "AC-SA-10-04", "AC-SA-12-05", "AC-SA-12-06", "AC-SA-14-03",
  "AC-SA-15-05", "AC-SA-15-08", "AC-SA-15-10", "AC-SA-19-02",
  "AC-SA-19-05", "AC-SA-19-09", "AC-SA-20-3-01", "AC-SCHED-182",
  "AC-SCHED-184", "AC-SCHED-253", "AC-SCHED-254", "AC-SCOPE-034",
  "AC-SCOPE-043", "AC-SCR-FL-001", "AC-SCR-FL-004", "AC-SCR-FL-006",
  "AC-SEC-602", "AC-STU-006", "AC-STU-043", "AC-STU-052",
  "AC-STU-060", "AC-STU-063", "AC-STU-067", "AC-STU-069",
  "AC-STU-074", "AC-STU-077", "AC-STU-083", "AC-STU-085",
  "AC-STU-086", "AC-STU-087", "AC-STU-089", "AC-STU-091",
  "AC-STU-096", "AC-STU-105", "AC-STU-110", "AC-STU-113",
  "AC-STU-115", "AC-STU-116", "AC-STU-128", "AC-STU-130",
  "AC-STU-131", "AC-STU-132", "AC-STU-133", "AC-STU-135",
  "AC-STU-136", "AC-STU-139", "AC-STU-141", "AC-STU-147",
  "AC-STU-153", "AC-WF-AUT-006-01", "AC-WF-AUT-007-01", "AC-WF-AUT-010-01",
  "AC-WF-AUT-010-02", "AC-WF-AUT-010-03", "AC-WF-AUT-010-04", "AC-WF-DVC-001-01",
  "AC-WF-DVC-001-03", "AC-WF-DVC-002-01", "AC-WF-DVC-003-01", "AC-WF-FEAT-002-01",
  "AC-WF-ORG-003-01", "AC-WF-ORG-003-02", "AC-WF-ORG-004-04", "AC-WF-PLT-003-01",
  "AC-WF-PLT-008-03", "AC-WF-QLT-006-02", "AC-WF-ROLE-018-01", "AC-WF-ROLE-018-02",
  "AC-WF-ROLE-024-01", "AC-WF-WKR-001-02", "AC-WF-WKR-001-03", "AC-WF-WKR-001-04",
] as const satisfies readonly string[]

/**
 * ── R6-B05 · A CAPABILITY THE MASTER PROMPT REQUIRES AND THIS BUILD LACKS ──
 *
 * Recorded here rather than built, and recorded because a stated absence is
 * worth more than a partial capability presented as the required one.
 *
 * Master prompt §26.2 requires screenshot comparison with three baseline
 * tiers — canonical state of every screen; the critical denied, invalid,
 * stale, offline, queued, conflict, fallback, fallback-failed, terminal-safe
 * and recovered states; and representative responsive, locale, theme and
 * high-contrast combinations — plus a retained diff report, and forbids a
 * baseline being regenerated during final verification. §27.2 requires a
 * `screenshot-manifest.json` keyed by sixteen fields.
 *
 * Measured: `toHaveScreenshot`, `toMatchSnapshot`, `pixelmatch` and
 * `maxDiffPixel` occur zero times across `tests/` and `playwright.config.ts`.
 * The `screenshots` Playwright project captures 102 single-state PNGs, is not
 * inside `pnpm verify`, and compares nothing to anything. The manifest carries
 * five keys, one of which is on §27.2's list.
 *
 * THE CONSEQUENCE, WHICH IS THE PART A READER IS OWED. §29.4's second
 * blocking condition — "a baseline was regenerated during final verification"
 * — cannot be evaluated in EITHER direction, because no baseline exists to
 * regenerate. A completion claim cannot honestly say that condition is false.
 *
 * WHY IT IS NOT BEING BUILT HERE. It is slice-13 scope. A single tier built
 * now would satisfy none of §26.2's three and would make the §29.4 condition
 * evaluable only by inventing the baseline it asks about.
 *
 * WHY `pnpm screenshots` WAS NOT ADDED TO `pnpm verify` EITHER. It writes into
 * `docs/screenshots/`, and §29.4's third condition forbids a completion claim
 * when the documentation changed after verification. A verify step that
 * rewrites a committed artefact mid-run is the shape `registry-freshness`
 * already had to be reordered out of. Running the capture proves the routes
 * render and nothing about whether they changed.
 */
export interface KnownLimitation {
  readonly id: string
  readonly title: string
  /** What the governing document requires, named section by section. */
  readonly owed: string
  /** What exists in the tree today, measured. */
  readonly today: string
  /** What a reader must not conclude from the gap being disclosed. */
  readonly consequence: string
  /** Where it is expected to land, and why not sooner. */
  readonly disposition: string
}

export const KNOWN_LIMITATIONS = [
  {
    id: 'LIM-VISUAL-01',
    title: 'No visual-regression capability exists',
    owed:
      'Master prompt §26.2 requires deterministic screenshot comparison across three baseline tiers with a retained diff report; §27.2 requires a screenshot manifest keyed by sixteen fields.',
    today:
      'Zero screenshot comparisons exist anywhere in the suite. The screenshots project captures 102 single-state images, is outside pnpm verify, and compares them to nothing; the manifest carries five keys, one of them on the required list.',
    consequence:
      'Master prompt §29.4’s second blocking condition — that no baseline was regenerated during final verification — cannot be evaluated in either direction, because no baseline exists to regenerate. No completion claim may report that condition as satisfied.',
    disposition:
      'Slice 13. Deliberately not partially built: one tier of three, presented as the required capability, would be worse than this stated absence.',
  },
] as const satisfies readonly KnownLimitation[]

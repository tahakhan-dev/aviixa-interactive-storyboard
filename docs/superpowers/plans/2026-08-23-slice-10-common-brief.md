# Slice 10 — the common half of every dispatch

**Notifications, schedules, audit and reports.** Four modules — `MOD-DOH-10`, `MOD-DOH-11`,
`MOD-DOH-18`, and a build-local scheduled-work spine the source mints no `MOD-*` identifier for —
across **five routes** and **thirteen transcribed matrices**. Fifteen dispatches. Every one reads
this file first.

## The three lines every dispatch carries verbatim

1. **Re-measure the citation split before you quote it.** Slice 8's briefs carried "1,019 of 1,203
   confirmed" for a whole slice; it was stale by roughly three times and nobody noticed, because a
   number quoted verbatim in twenty briefs looks more authoritative each time it is repeated. This
   brief therefore quotes **no** citation figure. `npx vitest run tests/coverage/citation-graph.test.ts`
   and `tests/coverage/locator-fidelity.test.ts` are what measure it. Report what you measure.
2. **This brief is a hypothesis. Prove its quotations AND its locators against the frozen source
   before you build from them.** Slice 8's briefs carried eleven wrong assertions and slice 9's
   carried forty-three — **every one the controller's, and every one found by an agent opening the
   line.** Six of slice 8's were counts. Finding another is a success, not an obstruction.
3. This brief contains **no test code, no assertions, no matchers and no expected strings.** You
   write the tests after the code exists, against the frozen source.

## Count the rows. Never infer them from a span.

A span like `L28687-L28700` states **where a table is**, not how many rows it has. The difference is
the header, the separator, and wherever the body actually stops. Slice 9 has four cases where **the
source states a count beside an enumeration that contradicts it** — L48368 says three prohibitions
and lists four; L81763 says "the four sync items" of a range of five; L85155 calls an eleven-column
table "the nine-column coordination table". **When the source states a count next to an
enumeration, count the enumeration** — and report both numbers.

Every count in this brief is a hypothesis. This slice's headline hypothesis: **137 rows across
thirteen matrices.** Count yours yourself.

## The frozen source

```
/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md
sha256  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
        18,565,031 bytes · 122,241 lines
```

Read-only. `sed -n 'A,Bp'` and `grep -n`. **Cite the blueprint line, never a graph node.**

**Read the whole line.** Three times in slice 9 a controller check nearly overturned a correct agent
finding by truncating one, and the costliest brief error of the slice dropped a third of a sentence —
"both device timestamps" for "Both device timestamps **and server receipt**" — which a model built to
it renders two-of-three **and passes any check written from the same truncation.**

**Never spell a line number in a comment unless that line carries what you say it carries.**
`tests/coverage/locator-fidelity.test.ts` lexes any `L`-number in a comment as a citation and has
caught six agents across two slices, including one describing a *planted* defect.

## What already exists — and the re-plan's mechanism list is stale in four places

The re-plan (`docs/superpowers/plans/2026-08-21-replan-slices-05-13.md`, §"Slice 10") was written
before slices 6-9 landed. **Four of the seven mechanisms it asks this slice to build already exist,
measured on the tree at slice 9's close:**

| the re-plan says build | measured position |
|---|---|
| lift `DecisionDisclosure` to a surface-agnostic home | **already lifted** — `src/disclosure/DecisionDisclosure.tsx` and `src/disclosure/decisions.ts`. Slice 9 gates assert identifiers are ABSENT from that canon; adding yours is the intended path, and the `alias` field survives. |
| a shared `FiveSurfaceEffects`, currently Studio-scoped | **already shared** — `src/ui/shared/FiveSurfaceEffects.tsx` with `src/ui/shared/journey.ts`. |
| a `CrossSurfaceStatement` component, "none exists" | **exists** — `src/ui/doh/CrossSurfaceStatement.tsx`, beside `src/ui/doh/SeamNotice.tsx`. Read both before minting anything; this slice's eleven cross-surface cells are its first non-Studio load. |
| **defect** — `src/studio/seams.ts` names `MOD-DOH-17 / MOD-DOH-18` for the tenant-audit-log seam | **already corrected** on 2026-08-22 to `MOD-DOH-11`, with the misreading that produced it written into the comment. Do not "fix" it again. |
| **defect** — `src/surfaces/doh/modules.ts` records `MOD-DOH-18` as `ownedBy: 'Slice 6'` | **already corrected** — it reads `ownedBy: 'Slice 10'`. |

**Three of the seven are genuinely absent and are wave-0 work:** `LockedControl` (no file anywhere
under `src/` or `app/` names it), the closed state vocabularies (`src/domain/state.ts` carries a
`Ledgers` shape with `notifications` and `schedules` arrays and **no state unions at all**), and the
non-human matrix column type (`PermissionOutcome` at `src/policy/decision.ts:13` is a nine-member
union that covers every token measured in this slice — **the outcome union is not what is missing;
the column type is**, because `evaluateAccess` and `ControlMatrixRow` are keyed on `TenantRoleId`
while 45A Matrix A has five non-human columns, `MOD-SA-18` six mixed ones, and `MOD-SA-14` an
aggregate "Any tenant role").

**One recorded defect is real and unfixed.** `registries/generated/scheduled-work.json` holds
**67 rows** and its `reconciledCount` is `null`. The rows include a two-digit `SCHED-01`…`SCHED-05`
series interleaved with the three-digit one — false positives from `PER-SCHED-NN` (L99229-L99256),
`FB-SCHED-01`/`FB-SCHED-02` (L18628) and `SB-030A-SCHED-01` (L66443) — plus the prose template token
`SCHED-0NN` (L102465). **The true registers are 35 numbered discovery findings (L98341-L98375) and
24 deployable obligations (L102396-L102419).** This slice owns the scheduled-work inventory closure
and cannot close it against a contaminated denominator.

## The traps, by grade — every locator a hypothesis to open

**C1 — the routing branch that reads as a prohibition.** `MOD-DOH-11`'s full-log row gives the
Quality Manager `Explicitly prohibited` and **names a permission in the same cell** ("scoped to
Summary and run-state events only"), while the very next row grants exactly those events
`Read-only`. *L28865 against L28866.* The alternative is on the same screen and immediately
adjacent, so this renders **DISABLED with the named reason**, not ABSENT.

**C1 — `Read-only` on an action row.** `MOD-DOH-10` gives the Read-only Auditor `Read-only` on
"Acknowledge a notification". *L28699.* `Read-only` renders as STATE-06 with the cause named,
reading as "disabled by object state" — but acknowledgement is a **write** the Auditor may never
perform in any state.

**C1 — six scheduled-work findings carry a field-complete card AND are classified "not a scheduled
obligation".** Cards SCHED-006 L99406, -008 L99410, -009 L99412, -010 L99414, -017 L99428, -020
L99430 against crosswalk rows L102497, L102499, L102500, L102501, L102508, L102511. Clearance lapse
and the qualification-calendar horizon are covered by the do-not-use-cron register (DNC-02, DNC-03
at L98486-L98487), **so a sweeper there is a named prohibition, not a design choice.**

**C1 — two notification registers share one key space.** Ch27.7 L51686-L51712 (**25 data rows**;
`NOTIF-001` = "Subscription or tier lifecycle change" L51688, `NOTIF-010` = "Severity 1 escalation"
L51697) against Ch30C.2's thirteen family tables L72948-L73096 (**87 data rows**; `NOTIF-001` =
"Tenant workspace activated" L72950, `NOTIF-010` = "Hard suspension entered" L72959). Ch27.7 calls
itself the shorter form at L51611 **but its identifiers are not a subset — they are a different
assignment.** `registries/generated/notifications.json` already carries a `register` field, so the
data shape exists and no runtime resolver does. **Tag every row with its register and make a bare
`NOTIF-*` literal fail at the type level.**

**C1 — the categorical→ABSENT rule inverts a screen.** The 30C.10 preference matrix reads
`Explicitly prohibited` in **every cell of three of its five columns** (L73706-L73710) while the same
section's storyboard SB-PREF-01 (L73684) requires those controls **visible and locked with an inline
reason**. Applying the inherited rule deletes the Always-sent and Protected groups and leaves a
preferences screen showing only what can be switched off — the exact inversion of what the source
draws. **This is what `LockedControl` is for.**

**C2 — permissive cells for roles that cannot open the screen.** Four of `MOD-DOH-10`'s twelve rows
(L28690, L28693, L28695, L28699) grant all five roles, while `SCR-DOH-19` admits **the Tenant Admin
alone** (L48113).

**C2 — `Allowed with conditions` whose stated condition IS another surface.** `MOD-DOH-18` at L29923
and L29927, confirmed against `MOD-CC-11`'s own row L38294, which holds the schedule control. And
**every permissive tenant cell in scheduled-work Matrix B is a cross-surface statement — rule four
of the section says so in words** (rows L99271, L99274, L99283, Auditor cell L99263, against the rule
at L99201).

**C2 — two already-built Super Admin screens must be VERIFIED, not assumed.** `MOD-SA-14`'s "Any
tenant role" column reads `Allowed with conditions` on a row where all four platform roles are
`Explicitly prohibited` (L45659, against the act's real home L28689 and its screen L48113) — the
built module is 761+ lines and the question is whether it rendered a tenant-preference editor on the
console. `MOD-SA-18` carries two `Allowed` cells whose stated location is the Hub (L46163) — it is
1203+ lines built and this slice builds `SCR-DOH-20`, so **the same read must not exist twice with
two different scope filters.** Both are slice-3 files: any task touching them is **serialised**, and
its diff must say plainly that it carries slice-3 bytes.

**C2 — an audit matrix marking a surface ABSENT that renders the data anyway.** The five-surface
audit matrix marks Command Center and Frontline `Unavailable — no audit reader on this surface`
(L74281, L74282, sense B → ABSENT), yet `MOD-CC-09`'s feed renders who was notified, who
acknowledged and when, which timeouts fired and where fallback went (L51624, `MOD-CC-09` rows
L37864/L37867). **The escalation routing state is a notification projection, not an audit read** —
and slice 9 built that feed, so the reconciliation is against shipped code.

**C3 — a prose class distribution that does not match its own catalogue.** L72929 claims 34/9/12/8/0/6/15/3;
counted across L72950-L73096 (**87 rows, all accounted**): 37 Notification, 11 Action-required, 8
Escalation, 8 Alert, 7 Reminder, 6 Approval request, 5 Command-linked, 2 "Notification with in-product
banner", 1 "Notification with persistent banner", 1 "Reminder and escalation", 1 "Approval request then
notification". **No folding of the compound tokens yields 15 escalations or 3 command-linked. The 87
total and the thirteen families reconcile and are the only counts safe to render.**

**C3 — a classification contradicted by its own justification.** 45A.1 classifies `SURF-DOH` as
`TC-01`, no time-based behaviour, **and the same cell's justification names the finish window**, a
TC-05 deadline (L98137); nineteen lines later seven Hub modules carry time-based classifications
(L98147, L98149, L98152, L98156, L98157, L98160, L98164).

**C3 — a derived rule that deletes the source's own pointer.** `MOD-CC-09`'s routing row is
`Explicitly prohibited` in all five columns with the reason "authored in the Standards and Operations
Studio" (L37870) — a cross-surface pointer with **no role holding the act on this screen**. Slice 4's
routing branch requires another role on the same screen to hold the act; none does, so the derived
rule sends it to ABSENT and deletes the only sentence telling a Quality Manager where escalation
routing lives — **against the source's own principle at L34595. The rule and the principle disagree
here, and the slice says so rather than picking silently.**

## Decisions to disclose — about nineteen, and three have no card anywhere

Full locator sets are in the re-plan's slice-10 section; **open them, do not trust them.** The ones
whose shape changes what you build:

- **`DEC-AUDITSUP-001` has THREE readings, not two**, and the three tokens render three different
  ways — STATE-06, ABSENT, and DISABLED-with-decision-identifier. (Ch17 L22017 with note [H23]
  L22027 · Ch19.13 L28865-L28867 · Ch30D.4 L74217 with L74178 and flow node L74198 · SCR-DOH-20's
  role list L48114, which omits the Supervisor and agrees with the second reading.) **Nine
  references, no card in §51.9.** `DEC-AUDITQM-001` is the same shape, and the source writes its own
  argument for the extension at L74178.
- **`DEC-SCHED-011` has three mutually exclusive readings**: it does not exist (L51002 bounds the
  band at 001-010); it is open with nine references (§51.12 index row L115148); it is **closed**
  ("That crosswalk closes DEC-SCHED-011, which recorded its absence", L102392, restated L102547).
  **Render all three, settle none, and pin all three locators in a gate.**
- **`DEC-SCHED-MISFIRE-001` versus `DEC-SCHED-002` — one question, two identifiers, no
  cross-reference.** MEASURED: MISFIRE-001 appears **zero** times inside L97959-L103156, the chapter
  that owns scheduled work; DEC-SCHED-002 is never mentioned by the chapter that mints MISFIRE-001.
  **Register `DEC-SCHED-002` canonical, MISFIRE-001 as its alias, render BOTH, and say on screen that
  the build registered an alias rather than dropping one.** The `alias` field in the decision canon
  exists for exactly this.
- **`DEC-FINISH-002` has no readings written down at all** (minted L98703, indexed L115082, no card
  anywhere). **That absence is the disclosure:** record the question and state plainly that neither
  reading was recorded. Do not invent two.
- **`DEC-REPORT-001` is settled where it matters and it is a scoping instruction, not a preference.**
  L113022: "Blocking for Delivery Operations Hub Band B module 18 sets 4 and 5; non-blocking for sets
  1 to 3." **Sets 1-3 build; sets 4-5 render decision-blocked with both wordings.** The count of five,
  Hub ownership, and Command Center rendering are **not** open.
- **`DEC-NOTIFSEV-001` / `DEC-NOTIFPRI-001`** — the four severity levels, the three priority levels
  and the whole assignment table (7 data rows in ONE table, L73149-L73157) are `Recommendation — R&D`,
  **not SoW Fact**, so **no screen may present a notification severity as a source-backed value.**
- **`DEC-NOTIFCOUNT-001`** — the eighty-seven is a `Derived Clarification` and **must carry that
  label wherever it renders.**
- **`DEC-NOSHIFT-001`** — the decision is open, but **AC-27.7-07 (L51733) is not**: it makes the
  visible fallback marking testable on every surface that renders it, and that obligation ships.
- **A scheduler identity register collision with three spellings and no DEC identifier**:
  `IDENT-SCHEDCTL`/`IDENT-SCHEDWKR` (L17887-L17888, L18612 — Ch14.5's carries the eighteen-field
  non-human identity contract), `IDENT-SCHED-CTL`/`IDENT-SCHED-WRK` (L98883, L98885), and seven
  `IDENT-*` spellings proposed as `Derived Clarification` at L51000. 45A.7 rule two (L99197) requires
  the audit to record identity and action and never "acting as role" — **so an audit row keyed on one
  spelling is unfindable by a search on another.** Mint no DEC identifier; disclose all three;
  register one canonical with the others as aliases.

## What every task owes

- **Report your own reachability from `app/`.** A component imported by no page and no test is not
  shipped. Slice 8 left nineteen such files and the best disclosure it produced sat unreachable for a
  whole slice. **A stated abstention and an oversight look identical from outside**, so state the
  abstention.
- **Count the call sites before and after any shared fix, and put both counts in the report.** The
  meta-rule under four of this build's ten shipped defect shapes is *fix once, where all callers
  route*; its recorded failure reached one call site of three.
- **Scope is enforced in what a screen READS, not what it DRAWS.** This slice's form of it is
  AC-30D-105 (L74032): "Audit reading never bypasses the authorisation of the objects it
  references." **The selector must filter, and the gate must assert the selector rather than the
  render.**
- **`pnpm build`, not only the suites.** Six of slice 9's seven panels shipped a server/client
  boundary defect that every unit and component suite passed and only a build could see — and the
  build **stops at the first failing route**, so a shape must be counted across all callers rather
  than found one rebuild at a time. Report the exported page count.
- **A gate that forbids a mechanism rather than a misuse of it will eventually forbid the fix.** Five
  slice-9 tasks independently wrote a gate forbidding `'use client'`; all five were wrong. The defect
  is a client module **exporting plain data** a server component reads, whose strings return
  `undefined` at prerender.
- **You never run git.** The controller commits. Read-only `git log`/`show`/`diff` is fine.
- **Prefix every scratchpad file with `slice10-t<NN>-`.**

## Gates that could not fail — the running catalogue, all found by planting

`textContent` welding adjacent elements · a `hidden` attribute defeating the same read · a defaulted
parameter not counting toward `Function.length` · **`Allowed` being a prefix of `Allowed with
conditions`** · `toEqual([...MY_CONSTANT])` · a shared helper used as its own test whose only firing
branch could not fire · a table check satisfied by the `|---|---|` separator row · a position check
true of both a defect and its fix · a `\b` pattern missing the plural · an allowance taking its
allowed string from the value under test · a check reading `sourceRef` alone · a `for...of` over the
constant it was meant to verify, which shrank along with its subject · **a count check true of both
the defect and the fix because two categories had the same number of rows** · a locator check
satisfied by a token most cells carry · a row-count gate proved by a defect that renamed a row
instead of deleting one · a classifier plant that was accidentally correct because `Object.keys`
preserved insertion order · a pointer that could point at itself · a gate red on the shipped tree
because the module's own comment named the field it refuses to have · and a gate whose failure
message asserted more than its predicate tested, and convicted an innocent module.

**Assume your gate cannot fail until you have seen it red on a real plant into a real file**, and
restore every plant byte-identically against a checksum taken **before** the first plant — slice 9
lost a restore to a baseline taken *after* the corruption.

## Wave order — fifteen tasks

*Wave 0 — spine, all landing before any route consumes them. Each was a mid-slice retrofit in slice 5.*
1. Cross-surface control evaluator + the **non-human matrix column type**.
2. The slice-10 decision canon in `src/disclosure/`, **including both alias pairs**.
3. The six closed vocabularies with real exhaustiveness checks — 19 notification states (L51605), 14
   command states (L50583 claims 14 "at a glance"; the chapter opener L50547 walks 8 named
   transitions — **both numbers**), 13 capture states (L50711), 4 severity + 3 priority
   (L73149-L73157), TC-01..TC-13 (L98082).
4. `LockedControl` — visible, inoperable, reason inline; distinct from `PermissionNotice` and from
   ABSENT. **Reuse `CrossSurfaceStatement`, `SeamNotice` and `FiveSurfaceEffects` where they already
   exist rather than minting siblings.**
5. The signal registries — **both** notification registers with the collision disclosure, the event
   catalogue (25 counted against 28 `EVT-*` in the registry), the command catalogue (16 counted
   against 17, the extra being the illustrative `CMD-BB-000097`).

*Wave 1 — the scheduled-work spine (2).* 6. The four scheduled-work registers + the
card-versus-crosswalk conflict fixture. 7. The 22-operation two-matrix permission model + the tenant
cross-surface ruling.

*Wave 2 — routes, file-disjoint (4).* 8. `MOD-DOH-10` at `/hub/notifications`. 9. `MOD-DOH-11` at
`/hub/audit-and-retention` **with the read-scope selector**. 10. `MOD-DOH-18` as a component with **no
route**; `DEC-REPORT-001` blocks sets 4-5. 11. The two **uncatalogued** scheduler routes — no numbered
`SCR-SA-NN` literal may be minted for either.

*Wave 3 — closure (2).* 12. The two verifications against already-built Super Admin screens
(**serialised**; the seam-owner correction the re-plan assigned here is already made). 13. The
registry-generator repair for the scheduled-work contamination, plus coverage descriptors.

*Wave 4.* 14. `tests/coverage/slice-10-gates.test.ts`, **strictly after every build task**, so
directory enumeration cannot pass on an empty scan. 15. Verification.

## What could not be established, and ships marked so

1. **Which surface RENDERS the tenant-scope scheduled-run ledger.** L100424 says the Hub "Holds" it
   and L100427 says the Hub "Displays occurrence state", yet no row of L48095-L48117 names a scheduler
   screen and `SCR-SA-SCHED-01` is explicitly platform-scope layer-1 telemetry (L99687). **The source
   names a display obligation with no screen to carry it.**
2. **Which module owns `SCR-SA-SCHED-01` and `SCR-SA-SCHED-02`.** L98141 classifies `SURF-SA` as
   `TC-10` and points at `MOD-SA-07`, whose matrix carries no scheduler operation. **No `MOD-*`
   identifier claims either screen.**
3. **`DEC-FINISH-002`'s two readings** — named as a contradiction (L98703), indexed (L115082), never
   written down.

**Two `PermissionOutcome` members are first exercised here** and neither has a rendering precedent in
the repo: `cachedReadOnlyOffline` (L100427, L73774) and `queuedOffline` (L73774-L73776). L31515 records
why the distinction matters — where they appear they describe **"the Frontline consequence of a Studio
configuration, not a Studio user's own experience."**

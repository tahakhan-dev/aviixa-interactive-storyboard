# Fix stream F — round-2 prose and published-figure findings

Authority APP-016 item 1, slice-11 audit round 2. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen
source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, 122,241 lines, read-only.

Findings are numbered `R2-P01`…`R2-P08` here. A concurrent stream owns round 2's gate findings
(`R2-G01`…`R2-G05`) in five `tests/coverage/` files: `offline-phrasing`, `citation-graph`,
`slice-2b-gates`, `registry-freshness`, `screenshot-manifest`. **Do not write to those five.**

Every count below was measured by a read-only auditor and the two Criticals were re-verified by the
controller. Everything else is still a hypothesis — measure before you act.

## R2-P01 · Critical · eight screens tell a reader a route does not exist, and it does

`src/surfaces/cc/modules/cc-13/rail.ts:320-330` (`CC13_AUDIT_POINTER`) renders "No route under
`app/hub/` is an audit view, so an anchor would point at a route that does not exist", with
`destinationBuilt: false` driving `data-audit-linked="no"` on all ten rail rows. Rendered at
`Cc13ActionRail.tsx:217`, and `grep -rl Cc13ActionRail app/` returns **eight** Command Center pages.

**Controller-verified:** `app/hub/audit-and-retention/` holds `page.tsx` and
`AuditAndRetentionScreen.tsx`; that screen is `SCR-DOH-20`, the audit log explorer, and L48114 is
its source row. The route was built by slice-11 wave 2. The pointer's own sentence says "a link is
offered the day a Hub audit route exists" — that day arrived and nothing came back.

**And the covering test pins the stale value**: `tests/unit/cc-13.test.ts:499` asserts
`destinationBuilt).toBe(false)`. So this is the abstention-rot shape for the third time in this
build, and the first where a test locked it in.

Wire the link, and make the assertion **derive from the route's existence** rather than pin a
boolean — an abstention has to red when it stops being true.

## R2-P02 · Critical · a published figure the artefact's own rows refute

`scripts/build-registries.mjs:2042-2043` publishes `countedThing` for `ai-storyboards.json`: "every
`SB-*` identifier in the identifier index (613), split across **four** separate, clearly labelled
registers". Rendered at `app/coverage/[registry]/page.tsx:99`. Second copy at
`src/coverage/registry-schema.ts:39`.

**Controller-verified: there are five.** Grouping the artefact's own `rows[].register` gives
30 + 490 + 45 + 18 + 30 = 613, and the generator's own `STORYBOARD_REGISTERS` literal has five
entries. Audit C-28's repair is what split `SB-AI-*` into two registers and turned four into five —
so the summary line and the table below it now give different answers on the same page.

Interpolate the length. A count typed beside a derived list is the defect, not the number.

## R2-P03 · Important · "ninety-nine source files" measures 25

`scripts/build-registries.mjs:969`, published into `modules.json` as `statusNote`; same figure in
comments at `build-registries.mjs:499-501` and `:711-713`, `src/coverage/descriptors.ts:27`, and
`tests/unit/registry-build.test.ts:923`. Claim: `MOD-FL-A4`, `A5`, `B8`, `B9`, `B11` are
"ninety-nine source files between them". Measured: **25** files (4/5/6/5/5), 12,173 lines. No
reading reproduces 99 — all twelve `fl-*` directories are 58 files, all of `src/frontline` is 67,
the import closure from the five panels is 18.

The rest of the sentence checks out: all five are imported by
`app/frontline/run-player/page.tsx` and none names a `MOD-` id in its text. Replace the quantity
with a measured one or drop it and keep the part that is true and checkable.

## R2-P04 · Important · the named enforcement mechanism is not where the gate lives

`src/surfaces/doh/modules.ts:530-534` and the `doNotEdit` field of
`registries/generated/doh/module-reach.json` claim "the eight module suites in `tests/unit` compare
this field against their own live matrices and go red on the edited entry — each non-vacuously".

Measured: **ten** DOH suites touch the field, and exactly **two** compare it against a live matrix
(`doh-cloning.test.ts:647`, `doh-sso.test.ts:221-225`). The general derivation gate is not in
`tests/unit` at all — it is `tests/coverage/slice-06-gates.test.ts:1073-1082` over seven ids. The
suites that look like the claim compare **matrix against matrix**, with the generated file on
neither side, so an edit to it cannot red them.

**Consequence, and this is the finding:** `MOD-DOH-10` and `MOD-DOH-11` fall outside both gate
populations, and swapping one valid role for another in either entry survives the whole suite.
Widen the real gate's population to all DOH modules, and rewrite the comment to name that gate.

## R2-P05 · Moderate · a stated sweep span that is 67 lines short at one end and 199 long at the other

`src/surfaces/sa/ai-failure-authority.ts:24-25` says chapter 43 "runs from the section heading at
L89880 to the last content line before chapter 44 opens, L91585". Measured: chapter 43 opens at
**L89813**, chapter 44 at **L91386**. L89880 is the `## 43.1` sub-heading; L91585 is 199 lines
*inside* chapter 44. The tree records the right boundary twice already
(`build-registries.mjs:1944`, `registry-build.test.ts:265`).

The conclusion survives — the twelve `MOD-FL-*` at L91181-L91192 are the only `MOD-*` tokens in the
true range, and both the head and the overreach contain none. Fix the bounds; the file calls this a
measurement, so a verifier re-running it must re-run the right span.

## R2-P06 · Moderate · an exclusivity claim the surface's own gate contradicts

`MOD-CC-13` is called "the ONLY routeless module on this surface" at `cc-13/rail.ts:226` and in
`CC13_ROUTELESSNESS.onlyRoutelessModule` (`:255`), at
`app/command-center/learning-read-view/page.tsx:34` (with no qualifier at all), and at
`build-registries.mjs:493-494`. Measured: `src/surfaces/cc/modules.ts` has **two** `slug: null`
entries — `MOD-CC-02` (`:127`) and `MOD-CC-13` (`:238`) — and
`tests/coverage/slice-09-gates.test.ts:735` asserts exactly that pair.

Worse, `tests/unit/cc-13.test.ts:469` is **titled** "is the ONLY routeless module" while its body
only asserts the set contains `MOD-CC-13` and not `MOD-CC-07` — it never tests uniqueness. Say what
is true ("the only routeless *action* module", if that is the distinction), at all four sites, and
rename the test to what it checks.

## R2-P07 · Moderate · a registered finding that states the opposite of the registry

`cc-13/rail.ts:340` — `CC13_MOUNT_FINDINGS[1].finding` reads "`MOD-CC-13` has no route and its rail
is imported by no page." **Eight** pages import and render it, and `modules.json` derives
`mounted-in-another-screen` from precisely those imports. The claim was true when written
(`Cc13ActionRail.tsx:61-65` records that the task owned no file under `app/`); the wiring landed
afterwards and the finding did not come back. Reword or close it.

## R2-P08 · Moderate · a true claim about one register generalised into a false one about the chapter

`app/coverage/page.tsx:279-281` (comment) and the rendered sentence at `:293-295` say chapter 44's
`AC-*` and `TEST-*` registers "are cited by nothing this build ships". The narrow claim in
`src/coverage/uninventoried.ts` is about `AC-44-*` and `TEST-44-*` and is **true** (both sweeps
return 0). But chapter 44 also holds the `## 44A` registers, and measured: **74** distinct
`AC-44A-*` and **57** `TEST-44A-*` tokens across `src`/`app`/`tests`. Narrow both sentences to the
registers they mean.

## Non-negotiable

- **Regenerate, never hand-edit, anything under `registries/`.** Then prove reproducibility with
  `npx vitest run --project release tests/coverage/registry-freshness.test.ts` — but note a
  concurrent stream owns that file; if it is mid-edit, run the generator and diff instead, and say
  so.
- **Every fix that closes a rotted claim needs something that reds when it rots again.** R2-P01 and
  R2-P07 are the third and fourth abstention-rot instances in this build; a comment is not a gate.
- Plant, watch it red, check the red is the assertion you meant, restore byte-identically, and put
  both `shasum -a 256` values in the report.
- Report exact counts from the unit, component and release projects, `npx tsc --noEmit`, and
  `pnpm build`.

## R2-P09 · Important · added after dispatch — the warrant for R2-P01's abstention cites a file that refuses

`src/surfaces/cc/modules/cc-13/Cc13ActionRail.tsx:67-70` reads: "THE EXACT MOUNT, WHICH ALREADY
EXISTS FOR THE OTHER TREATMENT. `app/command-center/live-shift-board/page.tsx` — another task's
file — already passes `actionRail={<ActionRail viewerRole={…} />}` to `CommandCenterShell`."

Measured by a second auditor: that file imports no `ActionRail`, and its own comment at `:57-79`
says the opposite — "`MOD-CC-13`'S ACTION RAIL IS DELIBERATELY NOT MOUNTED HERE … So `actionRail`
is left unfilled and the shell renders its declared `operational-action-set` seam." `<ActionRail`
occurs in no file under `app/` at all.

This sentence is the *warrant* for R2-P01's abstention — the evidence that the mount is one line
away — and it points a reader at a refusal. Point it at one of the eight pages that does fill
`actionRail`, and drop the `<ActionRail>` spelling, which names a different component
(`src/surfaces/cc/actions/ActionRail.tsx`) that another stream is fixing.

**Two independent round-2 streams found R2-P01 and R2-P07 separately**, which is why those two are
the highest-confidence items in this brief.

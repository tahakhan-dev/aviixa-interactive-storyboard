# Fix stream P — nineteen source-stated obligations reported as unknowable

Authority APP-016 item 1, slice-11 audit round 5, finding `R5-A01`. Register:
`docs/process/audits/2026-08-25-slice-11-audit-round-5-findings.md`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

**This is round 4's R4-01 recurring, and the gate written to stop it recurring cannot see it.** That
is the whole finding, and the gate half matters more than the four pages.

---

## The four panels

Two Super Admin pages render abstentions saying the build cannot know content the frozen source
states in full. **Controller-verified for the second and fourth rows below**; open every line for all
four before building anything.

| page | the abstention | what the line carries |
|---|---|---|
| `app/super-admin/platform-audit/` | `SB-RBAC-04` "named as a screen of this module and never described. No layout, no columns, no controls" | line **20953** describes it: a per-release divergence panel, counts by surface and by action identifier, zero the only passing value, a four-role access line, and "No write control exists on the panel." |
| `app/super-admin/platform-audit/` | `AC-SA-18-03`, `-07`, `-09` "never extracted … three of this module's ten criteria are therefore unknown to this build" | line **46193** carries all ten `AC-SA-18-01…-10` with complete text. `-03` requires every one of the twenty named event classes to be recorded, including attempts on locked settings. |
| `app/super-admin/platform-audit/` | `FUNC-SA-18-01-A1` through `-04-A4` "with no definition anywhere in the extract. Nine unknown functions" | lines **46175–46189** define all nine, each with Purpose, Allowed, Prohibited, Online, Offline and Fallback. |
| `app/super-admin/trace-viewer/` | `AC-SA-06-01, -02, -05, -06, -07` "not carried by the extraction … their content is unknown here and is not guessed at" | lines **43962–43969** carry all eight `AC-SA-06-01…-08` in a table. **`-07` is the criterion requiring the trace-viewer absence to be stated in the console — the subject of the page abstaining from it.** |

**Build them from the cited lines and delete the abstentions.** Nineteen obligations: one storyboard
panel, eight acceptance criteria, nine functionalities, plus the `SB-RBAC-04` panel description.

Where a criterion is genuinely a backend obligation with no screen (for example an audit-write
atomicity rule), say that plainly with its citation — that is a different statement from "the source
does not carry it", and the difference is the entire finding.

## The gate, which is the more important half

`tests/coverage/rendered-absence-claims.test.ts` was written in round 4 to convict exactly this class
and misses all four. Two independent reasons, both measured by replaying the gate in node:

1. **Its run detector requires bare `-NN` continuations.** These four enumerations spell every
   identifier in full (`AC-SA-18-03, AC-SA-18-07 and AC-SA-18-09`), so the detector returns an empty
   run and the check never runs. This is the vacuity shape: a population of zero reads exactly like
   compliance.
2. **None of its eight absence markers matches any phrasing used here** — "not carried by the
   extraction", "never extracted", "never described", "no definition anywhere in the extract",
   "unknown to this build".

**Fix the gate to hold the class rather than the wording.** Drop the bare-`-NN` requirement so a
fully-spelled enumeration is also a run; widen the markers. A wider marker sweep over `app/` and
`src/` returned exactly these four sentences and nothing else, so **after your fix the offender
population should reach zero and the gate must still have a non-empty subject population** — assert
the population size, not only the offender count. Round 3's shape was a correct fix that emptied a
gate's population and nothing reded.

**Prove the widened gate convicts all four as they ship today.** Plant each of the four abstentions
back verbatim into a scratch copy (or replay in node), watch it red naming the offender, restore
byte-exact against a checksum. A plant that changes nothing is not evidence — round 3 lost a cycle to
`&& true &&`.

Then ask the question that produced this finding: **what phrasing would still get past your widened
markers?** If the answer is "any sentence a future author writes differently", say so in the gate's
own comment and consider convicting on the structural signal — an identifier named in rendered text
alongside any negation, checked against the source — rather than on a phrase list.

---

## Files you own

```
app/super-admin/platform-audit/**        app/super-admin/trace-viewer/**
tests/coverage/rendered-absence-claims.test.ts
tests/component/sa-platform-audit*.test.tsx    tests/component/sa-trace-viewer*.test.tsx
tests/unit/sa-platform-audit*.test.ts          tests/unit/sa-trace-viewer*.test.ts
```

**Two other streams are running.** Fix stream N owns `app/super-admin/{core-agents-and-composed-agent-review,platform-settings,platform-overview-and-health,usage-and-metering}/**`,
`tests/unit/{routes,stu-content-libraries}.test.ts`, `tests/coverage/citation-graph.test.ts` and two
docs files. Fix stream Q owns `app/{coverage,review,workflows}/**`, `src/{coverage,review}/**`,
`scripts/build-registries.mjs`, `registries/**` and four other `tests/coverage/` files. **Write to
none of those.**

**Do not run `scripts/build-registries.mjs` and do not write under `registries/`.** Your `app/`
changes will make the generated registries stale and `pnpm test:freshness` will red — **report that
and leave it**; the controller regenerates once after every stream lands.

## Non-negotiable

- **Never run `git`.** The controller commits.
- **Open every line before you build from it.** Round 4 shipped two figures that survived an auditor,
  a controller and a register before an implementer opened the source.
- **Assert the population, not only the offenders.**
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears**, including in a
  comment about a bad citation. Write suspect locators as separate `id` and `line` fields.
- Bare `§N.N` means the **blueprint**; write "master prompt §X" for the prompt.

## Verification before you report

```
npx tsc --noEmit
pnpm lint
pnpm test:unit
pnpm test:component
pnpm test:release
pnpm build
npx playwright test --project=chromium
```

`pnpm test:freshness` may red from your own `app/` changes — say so and do not regenerate. Report per
finding: what you built from which line, the abstention you deleted, the gate change, and the four
plants with their red output.

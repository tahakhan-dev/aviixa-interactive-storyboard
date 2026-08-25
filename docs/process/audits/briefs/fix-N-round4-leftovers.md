# Fix stream N — the leftovers three streams could not reach

Authority APP-016 item 1, slice-11 audit round 4. Findings `R4-M01`, `R4-K01`, and the nine
unindexed citation claims fix stream M graded but could not fix. Register:
`docs/process/audits/2026-08-25-slice-11-audit-round-4-findings.md`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen source
`../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

**Every one of these exists because it fell between two streams' file lists.** Nothing here is
large. What matters is that each is closed at its cause and that the three self-retiring quarantine
entries other streams left behind are deleted in the same change, or their gates red.

---

## R4-M01 · Critical · a fourth broken title, shipping an empty module name

**Controller-verified.** `out/super-admin/core-agents-and-composed-agent-review/index.html` ships:

```
<title> — Super Admin Platform Console · AVIIXA Interactive Storyboard</title>
```

`app/super-admin/core-agents-and-composed-agent-review/page.tsx` reads `MODULE` from its own
`'use client'` screen module. On the server that binding is a throwing client-reference proxy — but
this page reads a **property** off it rather than calling it, and a property read does not throw. It
renders empty.

This is the last of four sites; fix stream M closed the other three and scanned all 87
`app/**/page.tsx` for the cause, finding **4 before, 1 after**. Follow the pattern M used and that
`app/hub/devices/` already used: move the binding into a non-client sibling module that both the
server page and the client screen import.

**Then delete the quarantine.** `tests/unit/routes.test.ts` holds this page in an
`OUTSIDE_THIS_STREAM` list asserted **by equality**, so the suite reds until the entry is removed.
That is the design working; remove the entry in the same change as the fix, and confirm the static
cause check at `routes.test.ts` now reports **0 sites**.

Verify the built title is the real module name — not merely non-empty — by rebuilding and reading it:

```
grep -o '<title>[^<]*</title>' out/super-admin/core-agents-and-composed-agent-review/index.html
```

## R4-K01 · Important · the fifth site of R4-02's bad pair

`app/super-admin/platform-settings/PlatformSettingsScreen.tsx` cites the pair `65401` and `20740` for
a Platform Engineer emergency-pause proposal. Fix stream K re-pointed four other sites and left this
one, with a defensible reason: the action is a *proposal*, and both lines do support "maker only,
submits into the approval cycle".

**But `65404`, not `65401`, is the emergency-pause row, and it reads `Explicitly prohibited` for
that column.** And `20740` is the role-register row, which states neither half of what the build
attributes to it — `grep -c "enter tenant context"` over the frozen source returns **0**.

**Open 65401, 65404, 20740, 21166 and 48810 before you change anything.** Then either re-point the
citation at the lines that actually carry the claim, or — if reading them shows the rendered claim
itself is wrong for this action — correct the claim. Do not preserve a sentence the source does not
state in order to keep a citation tidy.

## The nine unindexed citation claims

Fix stream M closed hole 3 in `tests/coverage/citation-graph.test.ts`: a citation whose identifier is
absent from `registries/blueprint-locators.json` is now graded against the frozen source instead of
being dropped. That surfaced 163 previously ungraded citations — 149 exact, 4 within-section, **10
uncorroborated across 9 claims**. M named them in a `UNINDEXED_UNCORROBORATED` literal list and could
fix none, because all sit outside its path list.

**Two identifiers occur nowhere in the frozen source.** These are the worse half — a citation to
something that does not exist:

| identifier | line cited | sites |
|---|---|---|
| `SB-SEC-013-S1` | 105076 | `app/super-admin/platform-overview-and-health/OverviewScreen.tsx`, `docs/census/2026-08-17-surf-sa-build-map.md` |
| `WF-LEDGER-EXPORT` | 2765 | `app/super-admin/usage-and-metering/fixtures.ts` (2 sites) |

For each: search the frozen source for the real identifier the build meant. If one exists, re-point
to it. If none exists, **the claim resting on it must go or be relabelled** — a build-invented
identifier presented as a source citation is the extraction failure mode this whole audit round
exists to catch.

**A thirteenth instance of R4-C04's shape.** `FUNC-STU-07-04-B-1` is cited at a line carrying
`FUNC-STU-07-01-B-1`; its own line is 22 later. Sites: `tests/unit/stu-content-libraries.test.ts` and
`docs/process/audits/briefs/fix-G-round2-reachability.md`. Open both lines, then correct both sites —
the brief is a historical record, so correct it with a bracketed note rather than a silent edit.

**Four where the identifier occurs later than the cited line.** These may be the legitimate forward
section idiom and may not; each needs its line opened and read:

| identifier | line cited |
|---|---|
| `FB-STU-01` | 31443 |
| `FB-STU-05` | 32647 |
| `SURF-CC` | 35014 |
| `AC-STU-049` | 31910 |

**Do not "correct" one that turns out to be the section idiom** — a citation may name the line a
section opens at rather than the identifier's own line, and round 2 nearly broke five accurate
citations by misreading exactly this. Where you leave one as correct, say why in your report and
leave it in the named list with a comment recording the reading.

As you close each, **delete its entry from `UNINDEXED_UNCORROBORATED`** — the list is asserted by
equality in both directions and the suite reds if a fixed claim stays listed.

## The third quarantine

`CODE_UNCORROBORATED` in `tests/coverage/citation-graph.test.ts` is a named list of eight, replacing
a `≤20` ceiling that let eight wrong citations land silently. Any entry you fix must leave the list
in the same change.

---

## Files you own

```
app/super-admin/core-agents-and-composed-agent-review/**
app/super-admin/platform-settings/**
app/super-admin/platform-overview-and-health/**
app/super-admin/usage-and-metering/**
tests/unit/routes.test.ts              tests/unit/stu-content-libraries.test.ts
tests/coverage/citation-graph.test.ts
docs/census/2026-08-17-surf-sa-build-map.md
docs/process/audits/briefs/fix-G-round2-reachability.md
```

**Do not run `scripts/build-registries.mjs` and do not write under `registries/`.** Your changes to
`app/super-admin/**` may make the generated registries stale; **report that** and the controller will
regenerate once, after every stream has landed. A regeneration racing another stream's edits is how
this build has collided four times.

## Non-negotiable

- **Never run `git`.** The controller commits.
- **Open every line before you build from it.** Two of this round's findings are figures that
  survived an auditor, a controller and a register before an implementer re-derived them.
- **Prove every gate change is permeable by planting a REAL defect**, watching it red, and restoring
  against a checksum. Say which method and paste the red output.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears**, including in a
  comment about a bad citation. Write suspect locators as separate `id` and `line` fields.
- Bare `§N.N` means the **blueprint**. Write "master prompt §X" for the prompt.
- **Fix once, where all callers route.** Give the call-site count before and after.

## Verification before you report

```
npx tsc --noEmit
pnpm test:unit
pnpm test:component
pnpm test:release
pnpm build
npx playwright test --project=chromium
```

Then, against the rebuilt `out/`:

```
for f in $(find out -name index.html | sort); do grep -o '<title>[^<]*</title>' "$f"; done | grep -c Attempted
grep -o '<title>[^<]*</title>' out/super-admin/core-agents-and-composed-agent-review/index.html
```

The first must be 0; the second must carry the real module name. Report the static cause check's
site count — it must be 0 — and confirm all three quarantine lists are empty of anything you fixed.
If a registry-freshness gate reds because your `app/` change made the generated registries stale, say
so and stop there rather than regenerating.

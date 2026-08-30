# Fix stream H — ten undisclosed source tensions

Authority APP-016 item 1, slice-11 audit round 3, findings `R3-01`…`R3-04`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Frozen
source `../AVIIXA_Production_Product_Blueprint.md`, sha256
`47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27`, read-only.

## What round 3 established first, because it changes what this work is

**There is no code defect here.** Both reach maps reproduce byte-identically from their generators —
controller-verified by regenerating to a scratch directory and diffing. The `MOD-DOH-11` defect that
round 2 found was a genuine data error and it was the only one; this stream is **not** changing any
derived value.

What is missing is *disclosure*. Sixteen places where **the source disagrees with itself** about who
reaches a module: its module-level row in `MTX-TEN-02a/b/c` says one thing, and the module's own
finer-grained card says another. The build derives reach from the finer matrix — the right
convention, and settled — but only **six of the sixteen** say so where a reader meets them.

`src/surfaces/doh/modules/doh-11/matrix.ts` is the worked example, written this session. Read it
first. `src/studio/modules/stu-10/matrix.ts`'s "FINDING 2 — ROW 4 IS NOT HERE" and
`src/surfaces/cc/modules/cc-12/readings.ts` are the other two shapes to follow.

**Do not change a single cell, matrix row, or reach value.** If your reading says a derived value is
wrong, stop and report it rather than editing it — that is a different finding with a different
authority.

## Files you own

```
src/surfaces/doh/modules/doh-08/matrix.ts · doh-09/** · doh-13/** · doh-15/matrix.ts
src/studio/modules/stu-04/** · stu-05/** · stu-11/** · stu-12/** · stu-16/**
src/surfaces/cc/modules/cc-04/** · cc-06/** · cc-09/** · cc-10/**   (readings/records only)
tests/unit/doh-cloning.test.ts · doh-permissions.test.ts · doh-summary.test.ts
tests/unit/stu-*.test.ts · tests/unit/cc-04.test.ts · cc-06.test.ts · cc-09.test.ts · cc-10.test.ts
```

Do not write under `app/`, `scripts/`, `registries/`, `tests/coverage/`, `docs/`, or any `cc-13`,
`doh-11`, `stu-10`, `cc-12` file. Never run `git`.

## The ten, each measured by an auditor and to be re-measured by you

**R3-01 · `MOD-DOH-15` · both directions in one module.** Row L22021 gives Tenant Admin
`Unavailable` and Read-only Auditor `Read-only`. The card at L29477-L29482 gives the Tenant Admin
`Allowed with conditions`/`Allowed` and the Read-only Auditor `Explicitly prohibited` on all six
rows. Derived reach is `TENANT_ADMIN, SUPERVISOR`. **Controller-verified at L22021 and L29477.** The
file already discloses a *different* tension (catalogue B's narrowing), which is exactly why this one
reads as covered and is not.

**R3-02 · three Hub modules.**
- `MOD-DOH-08` (row L22014): row grants Tenant Admin and Supervisor `Read-only`; derived reach is
  `QUALITY_MANAGER, READONLY_AUDITOR`. Two granted roles reach nothing.
- `MOD-DOH-09` (row L22015): row marks Supervisor **and** Quality Manager `Unavailable`; both derive
  as reaching, on L28531 and L28532. **This is the permissions module** — two withheld roles are
  offered its route with nothing in the tree recording the disagreement. Its only record today is a
  census JSON outside the source tree.
- `MOD-DOH-13` (row L22019): row grants Supervisor and Quality Manager `Read-only`; their only
  holdings are three `chrome` rows the derivation excludes, so derived reach is
  `TENANT_ADMIN, READONLY_AUDITOR`.

**R3-03 · five Studio modules.** `MOD-STU-04` (L22036) and `-05` (L22037): row Tenant Admin
`Unavailable`, shipped offered. `MOD-STU-11` (L22043): row `Explicitly prohibited`, shipped offered.
`MOD-STU-12` (L22044): row `Explicitly prohibited` for Tenant Admin **and** Supervisor, both shipped
offered — the versioning-and-publication module. `MOD-STU-16` (L22048): row Tenant Admin
`Read-only`, shipped withheld because its only two holdings are `another-surface` rows — the same
shape as `MOD-DOH-11`'s Supervisor.

**R3-04 · four Command Center modules.** Condition `[K1]` at L22072 states the interim position in
the source's own words, and eleven of thirteen Tenant Admin cells carry it. The build serves the
Tenant Admin on three CC screens and withholds eight. The transcription is correct — the `SCR-CC`
register at L48386-L48398 was checked verbatim — so this is source-versus-source, resolved silently
in favour of the register. `DEC-TACC-001` is cited on `cc-03`, `-05`, `-07`, `-12` only. Extend that
record's shape to **`cc-04`, `cc-06`, `cc-09`, `cc-10`**.

## What a disclosure must contain

Follow `doh-11/matrix.ts`. Each one states: both readings with their own locators; which one the
build derives from and why; that nothing here resolves the source's disagreement; and what a client
ruling the other way would change. Name the open decision identifier where one exists — and check
whether one exists rather than assuming; `DEC-TACC-001` governs the CC set.

**Prefer a derived assertion over a sentence.** A comment is not a gate: three abstentions in this
build rotted and a gate found the second, not a reader. Where you can express the tension as data —
a record with both readings and their locators, asserted against the source — do that instead of
prose, and gate it.

## Non-negotiable

- **Every count and locator above is a hypothesis.** Open each line. The controller's own brief in
  this round put a matrix body one line early (the separator, not the first row) — the third locator
  error of that shape this session.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears**, including in
  prose about a citation. Write suspect locators as `id` + `line` fields.
- **Plant, watch it red, check the red is the assertion you meant, restore byte-identically**, and
  give both `shasum -a 256` values.
- Report exact counts from the unit, component and release projects, `npx tsc --noEmit`, `pnpm build`.

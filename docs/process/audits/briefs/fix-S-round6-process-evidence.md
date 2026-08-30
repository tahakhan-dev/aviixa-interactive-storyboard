# Fix stream S — the evidence layer nothing points at

Authority APP-016 item 1, slice-11 audit round 6, findings `R6-B04` and `R6-B06`, and the
meta-finding under both. Register:
`docs/process/audits/2026-08-25-slice-11-audit-round-6-findings.md`. Repo root
`/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Interactive_Storyboard`. Governing
document: `docs/process/master-prompt/AVIIXA_Interactive_Storyboard_Master_Prompt_v1.0.md`, sha256
`96b67c835a880745c748cfd1c270c53fb86fd924c5881478c430582e3506e280` — read §23.2, §29.4 and §29.5
there. Bare `§N.N` in this repository means the **blueprint**.

Baseline `c3bd484`, clean tree, fully green: typecheck 0 · lint 0 · gate-ordering 31/31 · unit
6280/182 · component 3046/108 · build 102/102 · release 962/31 · playwright 548.

---

## The finding under both findings

```
grep -rn "process/ledgers\|process/audits" tests/ scripts/ src/ app/ package.json
  → 0
```

**Nothing in this repository reads the process-evidence layer.** Every gate this build has written —
and there are 31 — points at the product. None points at the evidence that the product was reviewed.
Master prompt §29.3 and §29.4 rest entirely on that layer, and four of its artefacts are frozen at
slices 2b and 4 while the build is at slice 11.

You are not being asked to make the evidence layer perfect. **You are being asked to make it
checkable**, so that the next false claim about it reds instead of shipping.

## R6-B04 · Critical · both candidate manifests name a candidate that no longer exists

**Controller-verified.** `docs/process/ledgers/product-candidate-manifest.json` declares candidate
`SLICE04-b82f66e93567c0a5` at a git commit seven slices back. Re-hashing its own entries against the
tree:

```
entries=365  match=180  drifted=185  missing=0
```

Its verification block reads "unit 892 · component 1661 · release 189 · e2e 95" against a measured
6,280 · 3,046 · 962 · 548.

`docs/process/ledgers/evidence-envelope-manifest.json` names slice **2b**, three of its seven payload
entries have drifted, and one — a registry retired by a schema change — no longer exists.

Master prompt §29.5 requires the final response to state exact Candidate IDs and hashes. §29.4
forbids a completion claim when the candidate changed after verification. **These are the only two
artefacts that could supply a Candidate ID, and quoting either would ship a false hash to the
client.**

### What to do

1. **Reseal both manifests at the current reviewed commit**, following master prompt §23.2's two
   non-self-referential hash scopes: the Product Candidate covers application source, tests,
   fixtures, configuration, lockfile, assets and required delivery documentation; the Evidence
   Envelope covers process ledgers, approvals, command output, review and verification reports, and
   is bound to one Candidate ID. **The Product Candidate Manifest does not hash itself. The Evidence
   Envelope Manifest hashes its payload but excludes itself.** Read §23.2 before designing either.
2. **Record the real verification figures**, measured by you, not copied from this brief.
3. **Add a release gate that re-hashes the payload and reds on drift.** This is the important half.
   Include the file-set as an equality, not a count, so a file silently dropped from the manifest
   also reds.
4. **The gate must not be satisfiable by resealing.** State in the gate what it does and does not
   prove: it proves the manifest describes the tree it sits in; it does not prove a review happened.

## R6-B06 · Critical · the disposition record the honesty gate depends on

**Controller-verified.** The only disposition table in the tree covers round 1:

```
grep -rlE '^\| *[A-Za-z0-9-]+ *\| *(CLOSED|OPEN|PARTIAL)' docs/process/audits/
  → 2026-08-24-slice-11-audit-dispositions.md      (one file)
```

It records **7 OPEN and 6 PARTIAL** — `C-00` and `C-13` Critical, `C-15`, `C-24`, `C-36`, `C-37`
Important — measured at a head seven commits back. Ten of the thirteen are named in no later
register. Rounds 2 and 3 are prose and cannot be enumerated: ten recoverable ids for twenty declared
findings, three for fifteen. Rounds 4, 5 and 6 have no disposition record at all.

An auditor spot-checked one of the thirteen and found it **genuinely closed** — so the record is
stale rather than the findings open. **Nothing on disk lets a reader tell those two apart, and that
is the finding.**

Master prompt §29.4 conditions 5 and 6 — no Critical or Important finding open, every Moderate and
Minor explicitly dispositioned — are the two the closing obligation turns on. Neither can currently
be evaluated.

### What to do

1. **Re-verify the thirteen round-1 rows still recorded OPEN or PARTIAL**, against the tree as it is
   now. Each gets a verdict with the evidence that settles it. Expect most to be closed; **say so
   with the measurement, not with a shrug.** Any that is genuinely still open is a live finding and
   must be reported as one.
2. **Write one disposition table per round** — rounds 1 through 6 — with a verdict per finding id.
   Rounds 2 and 3 are prose: recover what ids you can, and **where an id cannot be recovered, record
   that explicitly rather than leaving a gap.** "Twenty declared, ten recoverable, ten unrecoverable
   and here is why" is an honest row; a table of ten presented as complete is not.
3. **Add a release gate over the disposition tables.** At minimum: every round with a register has a
   disposition table; every finding id in a register appears in its round's table; no id is recorded
   OPEN or PARTIAL without a reason and an owner. The declared-versus-enumerated count for each
   round must match — **that mismatch is exactly what round 5's register and round 6's own first
   draft both shipped.**

## The count discipline this round exposed, which your gate should enforce

Round 6's stream A headed itself "Six findings" and listed seven. Round 5's register declared "Three
Critical" and carried four headings. Round 6's register copied the header instead of counting the
list. **All three are the same defect the product-side findings `R6-A01` and `R6-A02` describe: a
stated split that does not match the enumeration beside it.** If your gate can catch that class in
the registers, it earns its place several times over.

---

## Files you own

```
docs/process/ledgers/**
docs/process/audits/**            (disposition tables; do NOT rewrite a finding register's findings)
tests/coverage/process-evidence.test.ts      (new)
scripts/check-gate-ordering.mjs              (yours alone this wave — other streams extend existing gates)
scripts/**                                    (any new script your gate needs)
```

**Two other fix streams are running.** Stream T owns `app/super-admin/{platform-audit,trace-viewer}/**`,
`registries/authored/**`, `scripts/build-registries.mjs` and the matching `sa-*` tests. Stream U owns
`app/coverage/**`, `registries/generated/**`, `src/registry/**` and several `tests/coverage/` files.
**Write to none of those** — and note both will be changing bytes while you work, so **reseal the
manifests as your LAST action** and say in your report that the controller must reseal once more
after all three land. A manifest sealed mid-wave is the very defect you are fixing.

**Do not rewrite the findings in any register.** Correcting a register's own arithmetic is in scope;
re-litigating a finding is not.

## Non-negotiable

- **Never run `git`** for anything that writes. Reading history is fine and you will need it —
  `git log`, `git show`, `git diff` are the only way to settle several of the thirteen. **No `add`,
  no `commit`, no `checkout`.**
- **Prove every new gate permeable by a REAL plant** — drift one hash, drop one file from a manifest,
  remove one disposition row — watch it red naming the offender, restore byte-exact against a
  checksum. A plant that changes nothing gives a green run indistinguishable from a sound gate.
- **Assert populations by equality over a named list**, not by count and not by floor, wherever the
  claim is every member.
- **An `L`-prefixed number is a citation to `locator-fidelity` wherever it appears** — and that gate
  now scans `registries/` too.
- **Report what you could not settle.** A round-1 row you cannot resolve from the tree and the
  history is a finding, not a failure.

## Verification before you report

```
npx tsc --noEmit
pnpm lint
pnpm check:gate-ordering
pnpm test:unit
pnpm test:component
pnpm test:release
pnpm build
npx playwright test --project=chromium
```

Report: the resealed Candidate ID and both manifest hashes; the thirteen round-1 rows with a verdict
and evidence apiece; the per-round disposition tables with declared-versus-enumerated counts; the new
gate and its plants; and anything you could not settle, named.

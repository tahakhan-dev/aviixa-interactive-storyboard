# Slice-11 audit — common brief

**Authority:** APP-016 item 1, carried forward from APP-015 item 2-4. Wave 5 closed with a
green chain; a green chain is not an audit. This is the audit.

## The one rule that outranks this brief

**This brief is not the source.** Every count, line number and quotation below is a
*hypothesis supplied by the controller*, and this build has recorded 43 + 31 + 19 controller
brief errors, every one found by an agent opening the line. Open the line. If the brief and
the frozen source disagree, the source wins and **say so in your report** — a brief error
found is a finding, not an inconvenience.

## The frozen source

```
/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md
sha256 47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
       18,565,031 bytes · 122,241 lines   (re-verified this session, unchanged)
```

Too large to read whole. Use `grep -n` and `sed -n 'A,Bp'`. Read-only input; never an
application asset. `registries/blueprint-locators.json` maps 19,897 identifiers to all
39,138 lines they occur on — use it to confirm a locator before trusting it.

`graphify query|path|explain` from `AVIIXA_Interactive_Storyboard/` is an index over the
source. **It is a lead, never evidence.** Open the line it names. Cite the blueprint line,
never a graph node. `graphify query` has returned one wrong line for three different modules
in this build.

## Constraints on you

- **READ ONLY.** Write nothing under `src/`, `app/`, `tests/`, `registries/`. Make no commit.
  Your output is a findings report; the controller fixes and commits.
- **Run no test suite and no build.** A full `pnpm verify` is running concurrently and two
  agents have already had `out/` wiped from under them by a parallel build. `grep`, `sed`,
  `node -e` over source files are fine.
- **Every count you report is one you measured.** Name the command. "Assume every count in a
  brief is a hypothesis" applies to your own report too.
- Findings get a severity: **Critical** (ships a falsehood to a reader, or a gate that cannot
  fail), **Important** (a real gap or a stale claim), **Moderate**, **Minor**.
- **A finding whose evidence is "the brief said so" is not a finding.**

## What slice 11 built, as recorded (verify, do not assume)

Artificial intelligence and its absence, across five surfaces. Waves 0-5, candidate `0b937aa`:

- the sixteen-mode machine (`AIMODE-01`…`-16`), thirteen distinct labels — **`AIMODE-13`/`-14`
  is the ONLY pair byte-identical across all five contract columns.** `-03`/`-15` and
  `-01`/`-16` share a worker-visible LABEL and nothing more: at L89356-L89371, `-03` reads
  `Unavailable` under Agent invocation where `-15` reads `Allowed with conditions`, and both
  pairs differ on Classification (`-03` `User-Mandated Product Extension` against `-15`
  `Derived Clarification` on `SoW Fact — §8.5.1`; `-01` `User-Mandated Product Extension` on
  `SoW Fact — §7.9.1` against `-16` `Derived Clarification`). **R7-C05 — this line claimed all
  three pairs were byte-identical and the frozen table refutes two of them.** The build already
  carried the correction: `tests/unit/coverage-uninventoried.test.ts` derives the identical set
  from `AI_MODE_ROWS` and asserts it equals `['AIMODE-13/AIMODE-14']`, and separately that the
  three label-sharing pairs are three. Do not re-seed the old wording from this brief.
- six provenance classes (`PROV-1`…`-6`)
- thirteen agent abilities with twelve prohibitions; four prohibitions lack a refusal edge
- a sixty-item `FAIL-AI-*` catalogue in **one** register and **one** zero-padding convention:
  every one of the 60 distinct identifiers is two-digit (214 tokens in the frozen source, all
  two-digit), and they live in chapter 43's §43.2 — "The Failure Catalog — Sixty Modes in Six
  Families" (L90051) — across six subsections, §43.2.1 (L90100) to §43.2.6 (L90706). **R7-C05 /
  R7-C01 — this line said "five registers in two zero-padding conventions (39 + 10 + 1 = 50
  distinct literals over 69 owner rows)", and every one of those facts belongs to the SIBLING
  `FB-AI-*` family**, which really does carry two conventions: 32 two-digit plus 18 three-digit
  = 50 distinct literals in the frozen source, across the collision-aware registry (39 literals
  over 57 owner rows) and §38.4's three-digit library, whose artificial-intelligence family
  opens at §38.4.4, L83755. Six FAMILIES of one register is not five registers. The same
  conflation reached `/coverage/` and is fixed there; both halves are now derived from the
  frozen source by `tests/unit/coverage-uninventoried.test.ts`.
- a twelve-state AI request machine
- thirty chapter-44A storyboards, reachable from an index
- five-surface AI-degradation overlays; two of the five surfaces have **no source table at all**
- registry closure: 91 identifiers in no inventory, ruled option (a) — `REGISTRY_DESCRIPTORS`
  stays at fourteen, counts derived at module load

## The absolute rule slice 11 exists to protect

**L89439**, a sentence, not a column inference: cached approved guidance and deterministic
rules are "never, on any surface, in any locale, under any failure condition, labelled or
described as live artificial intelligence." Two briefs cited a column instead. If you find a
surface that violates this, it is Critical.

Adjacent invariants: AI may not trigger or classify a deviation; may not weaken a
specification, evaluation, qualification or authorization gate; may not release a Severity-1
hold; may not self-approve or change its own permissions; may not delete or rewrite evidence
or audit; may not make an offline device appear remotely controlled.

## The ten defect shapes this build ships behind green suites

1. a control that did nothing — state written, never read
2. a test satisfied by an `aria-disabled` button, asserting only presence
3. a contract wired to the one handler that mutated nothing
4. a screen asserting an absence the build contradicts
5. a screen pointing at content that is not there, guarded by a loop that cannot fail
6. a state fold applied to one render branch of four
7. scope enforced in what a screen **draws** rather than what it **reads**
8. a fix that made an unreachable collision reachable
9. a vacuous subset assertion — passes on an empty set or equal sets
10. a test helper scoped to exclude the defect it names

And: **an import edge is not a mount** — a reachability gate walking the import closure stayed
green at 54/54 after a panel's JSX was deleted. **A gate that cannot fail is worse than no
gate.** **Never renumber a stale count — remove it.** **Fix once, where all callers route.**

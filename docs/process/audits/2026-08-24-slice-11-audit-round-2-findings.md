# Slice-11 audit — round 2, findings and dispositions

Authority APP-016 item 1. Three read-only streams swept the candidate `c6ae6df` (chain exit 0).
**Twenty findings**, four Critical. Numbered by stream: `R2-G*` gates, `R2-P*` prose and published
figures, `R2-C*` citations and reachability.

A green chain is not the audit. Round 1's forty-two all shipped behind a green suite, and so did
these.

## Corroboration worth recording

**Two streams found the same two findings independently** — the `MOD-CC-13` audit-pointer Critical
and the mount-findings staleness. Independent convergence is the strongest evidence this round
produced, and it is why those two were fixed first.

## The four Criticals

| id | finding | verified by |
|---|---|---|
| R2-G01 | `offline-phrasing`'s only population guard checks five surfaces by route PREFIX and an AGGREGATE run count, while the claim it protects is per page. 92 of 102 pages can render nothing and every absence assertion stays green. **Its own docblock claimed that case was covered.** | controller read the guard |
| R2-P01 / R2-C01 | Eight Command Center routes render "No route under `app/hub/` is an audit view … a link is offered the day a Hub audit route exists". That route shipped in slice-11 wave 2. **And `cc-13.test.ts` asserted `destinationBuilt).toBe(false)`, so the correction was the failing change** — the third abstention-rot instance in this build and the first a test locked in. | controller opened the route |
| R2-P02 | `ai-storyboards.json` published "split across **four** separate registers"; its own rows group into **five** (30+490+45+18+30 = 613). Audit C-28's repair split `SB-AI-*` in two and the typed count did not follow, so the summary line and the table under it disagreed on one page. | controller grouped the artefact |
| R2-C03 | `cc/actions/ActionRail.tsx` states it "mounts inside the twelve module screens". It mounts nowhere, and **eleven unit gates positively forbid its import.** | stream measurement |

## R2-P10 · Critical · found while finishing a dead stream's work — a permission error in a delivered artefact

**This one was found by the R2-P04 fix, not by an auditor**, which is the argument for widening a
gate population rather than reasoning about it.

R2-P04 widened slice-6 gate 5 — the only general gate on reach derivation — from seven ids to every
Delivery Operations Hub module, because `MOD-DOH-10` and `MOD-DOH-11` had been outside every gate
population. The widened gate immediately convicted `MOD-DOH-11`:

```
generated reach map / spine : TENANT_ADMIN, SUPERVISOR, QUALITY_MANAGER
its own live control matrix : TENANT_ADMIN, QUALITY_MANAGER, READONLY_AUDITOR
```

Measured against the matrix's own pinned source strings, cell by cell: the live derivation is
right. `MOD-DOH-11` is Audit and Retention, and the committed artefact **grants Supervisor, who is
`Unavailable` or `Explicitly prohibited` in every row of that matrix, and omits the Read-only
Auditor, who holds `Read-only` on the full tenant audit log** — the audit role, dropped from the
audit module. The built row maps its columns correctly (`TENANT_ADMIN read-only · SUPERVISOR
unavailable · QUALITY_MANAGER explicitly-prohibited · READONLY_AUDITOR read-only · WORKER
unavailable`), so this is not the column mis-mapping trap the resume brief records for `doh-10`.

`registry-freshness` independently reports the same file stale, which is consistent: the artefact
predates a matrix correction and nothing was watching that module.

**A source tension to disclose rather than resolve silently.** `MTX-TEN-02a` at **L22017** gives
`MOD-DOH-11` at module level `Read-only | Read-only | Read-only | Allowed with conditions |
Unavailable` — so the module row admits the Supervisor, while every control row in the module's own
matrix refuses them. Header order confirmed at L22004. The build's convention is that the
finer-grained matrix governs reach, so regenerating is correct; the disagreement itself must be
disclosed where a reader meets the module, not dropped.

## Everything else, by stream

**Gates (`R2-G02`…`G05`).** The citation-corroboration gate scanned no `docs` and no `.md`, leaving
**290 citations in 48 prose files — 16% of the build's evidence — measured by nothing**; that is the
blind spot round 1 found 28 bad references in by hand. The review-separation gate filtered a
module-load snapshot by a literal path, so the same violation one directory over passed green, and
it was the one gate in its file with no floor and no plant. A generator-call scan that could not
tell three call sites from zero, with two ways to zero it. And a bare `return` reported as a pass
under a comment claiming it skips.

**Prose and figures (`R2-P03`…`P09`).** "Ninety-nine source files" measured **25**. The named
enforcement mechanism for the reach map was "the eight module suites in `tests/unit`" — ten touch
the field, **two** compare it against a live matrix, and the real gate is elsewhere. A stated
chapter sweep 67 lines short at one end and 199 long at the other. An exclusivity claim the
surface's own gate contradicts, at four sites, with a test **titled** for uniqueness that never
tests it. A registered finding stating the opposite of what the registry derives from the same tree.
A true claim about one register generalised into a false one about the chapter (74 `AC-44A-*` and 57
`TEST-44A-*` tokens exist). And the warrant for the Critical's abstention cited a page whose own
header says it deliberately does not mount the rail.

**Citations and reachability (`R2-C05`…`C12`).** Two citations convict outside the storyboards under
round 1's substantive-clause rule, both in the Studio, both 22 lines short, both inside their own
section. A disclosure reachable from nothing whose stated precedent is mounted. A register saying a
sibling still owes a fix that landed. The word "Measured" carrying evidence that has rotted. A third
instance of the "NO ROUTE" paragraph already corrected twice. One of two orphaned primitives
declared and the other not. A paraphrase inside quotation marks.

## What came back clean, because it bounds the round

Six detectors across all 27 gate files and four helpers: stateful `/g` regexes, self-comparisons,
unreachable assertions, prefix-as-boundary misuse, `out/`-sweep guards, absence assertions without a
floor — the last resolved 92 candidates down to four real ones. Every figure in the locator index
reproduces exactly. All fourteen generated inventories' counts reconcile. **1,714** identifier-anchored
citations checked, 45 mismatches, **43** cleared as the legitimate section/row idiom — the form this
build has nearly "corrected" into wrongness five times. Two were real.

## The shape of round 2, stated plainly

Round 1's shape was *the fix landed and its gate did not*. Round 2's is narrower and more useful:

**A population control that verifies a prefix, or an aggregate, where the claim is per member.**

Every one of the four gate misses is that, and so is R2-P04 — a gate whose population was seven ids
where the claim was every module, which is how a wrong permission set sat in a delivered artefact
undetected. The remedy in each case was an equality over a named literal list, not a bigger number.

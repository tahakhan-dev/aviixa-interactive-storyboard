# Slice-11 audit — round-1 dispositions

Authority APP-016 item 1. Every verdict below was measured on the tree by a stream that
opened the file or ran the command, **not** taken from a commit message. That distinction is
the reason this file exists: eight commits had closed findings the register still listed as
open, and one had shipped a gate without the fix it was written for.

Head at verification: `7a443dc`. Chain measured green on it — typecheck 0 · lint 0 ·
unit 6174/179 files · component 3025/107 · build 102/102 · release 849/26 · e2e/axe 545.

**Where a verdict is CLOSED but the close is held by nothing, the row says so.** A comment
is not a gate. Three closes in this round are prose-only and are recorded as such rather
than counted as safe.

## Verdicts

| # | Verdict | Held by | Note |
|---|---|---|---|
| C-00 | PARTIAL | the chain itself | e2e is green at 545 and was never *recorded*: the wave-5 close has no e2e figure and no slice-11 verification record exists |
| C-01 | CLOSED | `axe-states` both-directions equality | viewer control is the screen's, not an `unreachedRoutes` row |
| C-02 | CLOSED | axe `heading-order`, driven | verified on the served export, not only in source |
| C-03 | CLOSED | axe `landmark-unique` | 30 cards, 30 distinct labels, 0 named inner regions |
| C-04 | CLOSED | set equality over derived hrefs | the literal 19 is gone; 19 modules + 1 non-module route = 20, and the export carries 20 |
| C-05 | CLOSED | new reachability gate | the abstention is replaced by a named mount and a gate that reds when it rots |
| C-06 | CLOSED | a fresh parse of L27909-L27920 | 60 cells / 45 prohibited / 37 bare / 8 qualified, derived twice, no stored copy |
| C-07 | CLOSED | measurement in the paragraph | 7 Frontline routes, 0 mount the overlay; the false sentence survives only inside quoted history |
| C-08 | CLOSED | the claim, not the banner | walks `app/frontline`, floors on `page.tsx` count, asserts `[]` |
| C-09 | CLOSED | removal | all three sites derive from `.length`; with no literal left there is no copy to go stale |
| C-10 | CLOSED | both-directions equality | population defined by identifier, not by diff; 52 bearing, 54 in population, 10 named outside |
| C-11 | CLOSED | word-bounded negation + synthesised controls | plant confirmed: the old predicate acquitted "is now monitoring" |
| C-12 | CLOSED | presence AND inertness together | plant renamed the control id and the case red |
| C-13 | PARTIAL | two of three consumers | the third restates two names inline; a plant of three symbols stayed 95/95 green |
| C-14 | CLOSED | four annotation spellings + live limit | plant annotated the real vocabulary and it red |
| C-15 | PARTIAL | quote class closed | the `.tsx`-only closure is prose, not a live expectation |
| C-16 | CLOSED | three narrowings as live expectations | narrowing 1's cost is measured, so it reds when it becomes free |
| C-17 | CLOSED | two equalities that retire themselves | plant removed an annotation and the exemption equality red |
| C-18 | PARTIAL | six of eight closed | .4 has a `> 0` floor where a literal equality belongs; **.7 cannot fire at all** |
| C-19 | OPEN | nothing | a twelfth file in the directory is silently unscanned; plant stayed 95/95 green |
| C-20 | CLOSED | the ledger | 17 entries, APP-000…APP-016, and the APP-015 bullet is marked history |
| C-21 | CLOSED | the ledger | `pending_gates[0]` reads SATISFIED with its closure recorded; no gate reads this file and none was claimed |
| C-22 | CLOSED | three paragraphs corrected in place | **a fourth live instance of the same claim was found** at `RESUME.md:878-882` |
| C-23 | CLOSED | new release gate | 85→102 rows and PNGs; the old check lived in the writer and ran outside `verify` |
| C-24 | PARTIAL | four of six corrected | two still stand at their point of use with the correction appended elsewhere |
| C-25 | OPEN | nothing | 5 of 5 items double-listed, and the two copies of one now disagree |
| C-26 | CLOSED | re-measurement | 612/579/33 today, an exact match; the census pair is a quotation of a past position |
| C-27 | CLOSED | derived patterns + a prefix-blind second sweep | 85 identifiers now counted; **residual: `FB-` swallows `FB-AGT-` by `startsWith`** |
| C-28 | CLOSED | band assertion at generation time | 0 of 48 rows in the wrong chapter, was 19 |
| C-29 | CLOSED | banded first-occurrence | **residual: the published `sourceLineMeaning` now contradicts one of its own rows** |
| C-30 | CLOSED | the source's own words + a refusal gate | **an unrelated wrong claim ships three lines below it** |
| C-31 | CLOSED | an emptiness assertion over a real sweep | 42 + 39 = 81; **residual: the sentence claims `tests/`, the sweep does not walk it** |
| C-32 | PARTIAL | parts 1 and 2 closed | part 3's published figure is 210 and measures 166 |
| C-33 | CLOSED | nothing | byte-exact against L95067/L95069 — and a plant of the fabricated quotation left the chain green |
| C-34 | CLOSED | nothing | byte-exact against L95060, and the second sentence now carries its own locator |
| C-35 | CLOSED | nothing | all four cards carry reasoning; **the register said six further bare cards and it is five** |
| C-36 | OPEN | — | the seam record has no consumer: no screen renders it, no test asserts it |
| C-37 | OPEN | — | the four-way collision is stated only in a comment, and the intro names the wrong chapters |
| C-38 | CLOSED | five cases reading the frozen source | all four meaning-changers faithful; the gate reds on the planted shortening |
| C-39 | OPEN | — | one of seven alters a claim: `reached` for the source's `reaches` (L94677) |
| C-40 | OPEN | — | three citations confirmed off; the register's count of thirteen could not be reproduced |
| C-41 | OPEN | — | four `**` strings reach the reader as asterisks; backticks render three ways across the thirty |

Counted: **26 CLOSED · 8 PARTIAL · 8 OPEN**, of 42.

## Corrections to the register itself, each measured

The register is a derived layer and was wrong in nine places. Recorded here rather than
edited into it, so the audit's own record stays readable as what it said at the time.

- **C-06** "`grep -c BARE_PROHIBITION` = 38" is 42 today — drift from the two new derived
  constants. The source's figure is 37 cell values, and that is what the gate asserts.
- **C-10** "four changed `src/` files fall outside it" — ten do, and only one of the four is
  among them. The gate's own comment says the same.
- **C-16** "lowercase 26 times" — 23 across `src/`+`app/`. No plausible scope yields 26.
- **C-24** cites `src/coverage/uninventoried.ts:33` as saying "ninety-one"; that file contains
  no spelled numeral at all. **The correction inherited the defect it was correcting.**
- **C-32** part 3's "210 identifiers with no key" — 166 under the token shape that reproduces
  the note's own other figure exactly.
- **C-35** "six further `authored` cards carry no reasoning" — five. The sixth is
  `statedAbsence` and is commented.
- **C-38** "eight distinct absence phrasings" — nine by exact text; eight only if
  `No involvement;` and `No involvement in tenant personnel;` are one family. The distinction
  is the whole subject of the finding, so it is nine.
- **C-39** "three drop a `[SoW Fact — §3.3]` attribution" — two drop §3.3, one drops §3.8.
- **C-40** "thirteen audit-event citations" — **not reproduced and not disproved.** 143 audit
  entries across the thirty; a word-presence scan flags 44 candidates, most of them inflection
  artefacts. Reported as unconfirmed rather than as wrong.

And two code comments carrying a figure that has since drifted: `slice-11-gates.test.ts:993`
says 2,877 single-quoted import specifiers where 2,880 is measured, and
`build-locator-index.mjs`'s note is the 210 above.

## The shape that recurs, and it is not a locator error

Five of the eight PARTIAL verdicts are the same defect: **the fix landed and its gate did
not, or the gate landed and the fix did not.** C-38's gate shipped without its card fix.
C-13's hoist reached two of three consumers. C-15 closed the quote class and left the
traversal limit as prose. C-18 closed six of eight and left one case that cannot fire.
C-32 corrected the generator and not the note.

A finding is closed when the change and the thing that reds without it both exist. Six
closes in this round are held by nothing but a comment — C-33, C-34, C-35 explicitly, and
that is recorded above rather than counted as safe.

# Reviewing the AVIIXA Interactive Storyboard

This guide is written for the people deciding whether the platform described in the blueprint is
the platform they want. It says what to click, what to look for, **and what is not built yet**,
because a review conducted against an unstated gap produces feedback about the wrong thing.

## Before you start

```
pnpm install
pnpm build && pnpm serve:out        # http://localhost:4173
```

Or open the deployed URL. Either way you are looking at the same 5841 static pages — there is no
backend, no login, and nothing you click can change anything for anyone else.

**Every number in this guide is derived from the build and gated.** Each one below is written as a
numeral and re-measured on every release run by `tests/coverage/client-document-figures.test.ts`,
which compares it against `exportedRoutes()`, `registries/generated/` or the screenshot manifest by
equality. A figure that goes stale reds the chain instead of reaching you. That gate exists because
nine figures in this document reached a reader wrong: it said 85 pages against a 5841-page export and
4,970 registry rows against the 5,015 that exist, and it told reviewers not to look at eleven
shipped screens.

## What this is, in one paragraph

Five surfaces, nine human roles, and a click-through of how work moves between them. Every
status token, permission cell and message on these screens is transcribed from a single frozen
122,241-line blueprint, and **where that blueprint contradicts itself the screens show both
readings rather than picking one**. Those disclosures are not unfinished work. They are the
questions this review exists to answer.

## Where to start, by what you want to decide

| if you want to decide… | start at | why |
|---|---|---|
| whether the platform tells the truth when things go wrong | `/frontline/` | the offline, sync and device-security screens are the deepest built |
| whether operations can actually run a shift on this | `/hub/` | 19 screens; 17 of 19 modules own one |
| whether governance and authoring hold together | `/studio/` | 17 screens; 16 of 18 modules own one, the other 2 mount inside them |
| whether the platform is administrable | `/super-admin/` | complete: 19 of 19 modules own a screen |
| what remains unspecified in the blueprint | the screen it affects, then `/coverage/` | contradictions are disclosed in situ; `/coverage/` collects the ones no screen shows |
| how much of the blueprint is represented | `/coverage/` | 14 inventories, computed from the build |
| where to write your findings down | `/review/` | the note form and the exportable review package |

## The five things worth your attention

**1 — Every open decision is disclosed, never resolved — on the screen it affects.** There is no
single decisions page, and this guide used to say `/review/` was one. It is not: `/review/` is the
form where you record a finding and export the review package. A contradiction in the blueprint is
disclosed where it bites, on the screen that would otherwise have to pick a side, with both
readings and the blueprint line each comes from — 146 `DEC-*` identifiers are named across the
export that way. `/coverage/` collects the two kinds no single screen can show: **Source
contradictions disclosed nowhere else**, and **Known limitations**. **These are the decisions the
build could not make for you**, and reading them is the highest-value hour in this review.

**2 — The screens say what they do not know.** On `/command-center/live-shift-board/` a cell whose
tablet has not reported in reads `pending captures unknown`, never `0`, and the panel behind it
says `unknown as at the last successful sync` rather than naming a number it cannot have. A command
that has reached some devices and not others shows `propagating`, and never promotes itself to
`in force` on a guess. **If you see a screen that sounds more certain than it should be, that is a
finding — report it.**

Those are the shipped wordings, quoted from the pages that render them and checked against those
pages by the figures gate. This paragraph used to quote `Unknown while offline` — the blueprint's
own token at L35967, and a string zero of the 5841 exported pages render. It was this guide's worked
example of the honesty rule it asks you to police, and it was not honest.

**3 — Permission cells are transcribed, not designed.** Where two blueprint tables disagree about
the same cell — and they do, in several places — the screen shows both with their sources.
Deciding which is right is a client decision.

**4 — Absent is not the same as disabled.** A control that is **explicitly prohibited** renders as
nothing at all; a control that is **unavailable** renders as a disabled control that explains
itself. The blueprint uses both tokens for the same cell in places, and those render oppositely.
Where you see that flagged, the question is which behaviour you want.

**5 — The coverage dashboards are computed, not claimed.** `/coverage/` counts what the built
route tree actually demonstrates. It is deliberately unflattering.

## What is NOT built, stated plainly

The blueprint's 14 inventories hold **5,015 rows**. **299 of them are demonstrated by a shipped
screen today**, 10 more are mounted inside another module's screen, 22 carry an authored
not-applicable record, and 4,684 are not represented. That number is low by design at this stage
and it is not the whole picture — a screen demonstrates a module without separately demonstrating
each of its sub-features — but it is the honest measure, and it is computed rather than asserted.
`/coverage/` renders exactly these five figures from the same fourteen files, and the gate holds
this paragraph to them.

By surface, over the 81 modules in `registries/generated/modules.json`:

| surface | key | owns a screen | mounted in another screen | of | state |
|---|---|---|---|---|---|
| Super Admin platform console | `SURF-SA` | 19 | 0 | 19 | complete |
| Delivery Operations Hub | `SURF-DOH` | 17 | 0 | 19 | 2 modules not represented |
| Standards and Operations Studio | `SURF-STU` | 16 | 2 | 18 | complete |
| Frontline Worker Application | `SURF-FL` | 6 | 6 | 12 | complete |
| Client Command Center | `SURF-CC` | 11 | 2 | 13 | complete |

**The only unbuilt modules in this build are two**, both on the Hub: `MOD-DOH-17` Regulated-Industry
Mode and `MOD-DOH-18` Standard Report Data Sets. Every other module on every other surface either
owns a screen or mounts inside one. An earlier version of this table summed to seventeen unbuilt
modules and told you not to review a surface that was finished.

**"Mounted in another screen" is not a lesser status.** Six Frontline modules — data capture,
on-device detection, the offline engine, coaching, gates and sign-off, worker lifecycle — have no
screen of their own because the blueprint gives them none. They mount inside the Run Player, which
is where a worker meets them.

**The Client Command Center is built and it is worth your review.** `/command-center/` renders a
rail of 12 screens and every one of them exists: the live shift board, the cell view, the run
drill-down, the deviation workspace, the governance gate queue, learned-change approvals, the agent
activity panel, the alert and escalation feed, the sync-conflict review panel, reports and the
report builder, the shift handoff panel and the learning read view. The register carries 13 screens;
the thirteenth is the sign-in, which reuses the Hub's identity module and is authored on that
surface, so a rail of 12 over a register of 13 is the mapping and not a gap.

Also absent today: the notification, scheduled-work, event and command inventories have no screens
of their own yet.

## The walkthroughs are documents, not a runner — and that is a gap, not a choice

`docs/walkthroughs.md` gives you 6 click-paths and every route in them is asserted to exist.
That is less than master prompt §27.2 asks for, and the difference is stated here rather than left
for you to discover mid-review.

**What exists:** 6 walkthroughs, each step naming a route, what to look for, and the committed
screenshot of that route.

**What §27.2 requires and this build does not have.** Per step: reset/checkpoint, persona, scope,
action, expected validation, result, cross-surface effect, decision prompt, failure branch and
recovery. As whole walkthroughs: an executive walkthrough, a complete functional walkthrough, nine
per-role login and landing walkthroughs, per-surface module walkthroughs, one end-to-end continuous
story, and seven of the eight branch walkthroughs. As machinery: a `WalkthroughDefinition` type, a
runner with start / resume / previous / next / restart, a one-click "Prepare client demo" reset, and
presenter recovery instructions. **None of these exists.** Building them is slice 13 (RESUME §5),
and `LIM-VISUAL-01` on `/coverage/` records the related visual-baseline limitation.

**And nothing tests a walkthrough end to end.** §27.2 requires every walkthrough run from cleared
browser persistence against the served export, including refresh recovery and keyboard-only
completion. No test in this build reloads a page or walks a walkthrough's ordered steps. What does
hold today: `tests/accessibility/axe.spec.ts` proves per route that the first Tab press reaches the
skip link and that `/review/`'s controls are keyboard-operable. `/review/` is the one route that
writes to IndexedDB and it is walkthrough 5 step 1 — so **if a walkthrough is going to diverge in
front of you, that is where.** If step 1 of walkthrough 5 behaves differently in a fresh browser
profile than it does on a second visit, that is a real defect and this build has no test that would
have caught it. Report it.

## How to report what you find

The most useful feedback names a screen, a thing on it, and what you expected instead. The second
most useful names a decision in `/review/` and answers it. The least useful is a general
impression — not because it is unwelcome, but because this build can act on the first two
immediately and cannot act on the third.

**A wrong blueprint citation is worth reporting as loudly as a wrong screen.** Eleven wrong
citations have been found in this build, one naming a line 44,561 lines away from its subject.
If a screen cites a line and the line says something else, that is a real defect.

# Reviewing the AVIIXA Interactive Storyboard

This guide is written for the people deciding whether the platform described in the blueprint is
the platform they want. It says what to click, what to look for, **and what is not built yet**,
because a review conducted against an unstated gap produces feedback about the wrong thing.

## Before you start

```
pnpm install
pnpm build && pnpm serve:out        # http://localhost:4173
```

Or open the deployed URL. Either way you are looking at the same 85 static pages — there is no
backend, no login, and nothing you click can change anything for anyone else.

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
| whether operations can actually run a shift on this | `/hub/` | eighteen screens, fifteen of nineteen modules |
| whether governance and authoring hold together | `/studio/` | sixteen of eighteen modules |
| whether the platform is administrable | `/super-admin/` | complete: nineteen of nineteen modules |
| what remains unspecified in the blueprint | `/review/` | every open decision, with both readings |
| how much of the blueprint is represented | `/coverage/` | fourteen inventories, computed from the build |

## The five things worth your attention

**1 — Every open decision is disclosed, never resolved.** `/review/` lists them. Each carries both
readings, the blueprint line each comes from, what is at stake, and options. **These are the
decisions the build could not make for you.** Reading them is the highest-value hour in this
review.

**2 — The screens say what they do not know.** A tablet that has not reported in shows
`Unknown while offline`, never `0`. A command that has reached some devices and not others shows
`propagating`, and never promotes itself to `in force` on a guess. **If you see a screen that
sounds more certain than it should be, that is a finding — report it.**

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

The blueprint's fourteen inventories hold **4,970 rows**. **237 of them are demonstrated by a
shipped screen today.** That number is low by design at this stage and it is not the whole
picture — a screen demonstrates a module without separately demonstrating each of its
sub-features — but it is the honest measure, and it is computed rather than asserted.

By surface:

| surface | modules demonstrated | state |
|---|---|---|
| Super Admin platform console | 19 / 19 | complete |
| Delivery Operations Hub | 15 / 19 | four modules unbuilt |
| Standards and Operations Studio | 16 / 18 | two modules unbuilt |
| Frontline Worker Application | 6 / 12 | six modules unbuilt |
| **Client Command Center** | **1 / 13** | **twelve modules unbuilt** |

**The Client Command Center is the surface to expect least from.** `/command-center/` is a
placeholder and one screen — the sync-conflict review panel — is built. Its remaining twelve
modules are the next body of work. **Do not review the Command Center as a design; review the one
built screen and the disclosures around it.**

Also absent today: guided walkthrough recordings, and the notification, scheduled-work, event and
command inventories have no screens of their own yet.

## How to report what you find

The most useful feedback names a screen, a thing on it, and what you expected instead. The second
most useful names a decision in `/review/` and answers it. The least useful is a general
impression — not because it is unwelcome, but because this build can act on the first two
immediately and cannot act on the third.

**A wrong blueprint citation is worth reporting as loudly as a wrong screen.** Eleven wrong
citations have been found in this build, one naming a line 44,561 lines away from its subject.
If a screen cites a line and the line says something else, that is a real defect.

# Guided walkthroughs

6 click-paths through the storyboard, each ending somewhere that answers a question. **Every
route named here is asserted to exist by `tests/coverage/walkthrough-routes.test.ts`** — a
walkthrough that names a page the export does not have fails the release gate rather than wasting
a reviewer's afternoon. **Every figure in this document is asserted against the build by
`tests/coverage/client-document-figures.test.ts`**, which is a separate and newer gate: the route
check was green while this document told a reader the Command Center was a placeholder and counted
three prohibitions on a page that renders six.

Start the export first: `pnpm build && pnpm serve:out`, then <http://localhost:4173>.

**The `capture` column** names the committed full-page screenshot of that route in
`docs/screenshots/`, so a step can be read without a browser and a presenter can check what the
page looked like when the manifest was written. The PNGs are gitignored and rebuilt by
`pnpm screenshots`; `docs/screenshots/manifest.json` is committed, and the gate holds each filename
below equal to that route's row in it. **A screenshot link is one of the thirteen per-step fields
master prompt §27.2 requires. It is the only one this document carries beyond route and what the
client sees** — see "What §27.2 asks for and this is not" at the end.

---

## 1 — A worker loses signal mid-run, and the platform says so

**Roughly fifteen minutes. The deepest-built path in the storyboard, and the one that shows what
this platform is for.**

| step | go to | look for | capture |
|---|---|---|---|
| 1 | `/frontline/sign-in/` | what a sign-in has to establish before work can start | `frontline-sign-in.png` |
| 2 | `/frontline/my-runs/` | which runs are startable, and which are not, and why each says so | `frontline-my-runs.png` |
| 3 | `/frontline/run-player/` | the step sequence, and what a capture actually records | `frontline-run-player.png` |
| 4 | `/frontline/notifications-and-sync-inbox/` | **the honest words.** `sent`, `synced` and `done` are not synonyms here, and the inbox distinguishes them | `frontline-notifications-and-sync-inbox.png` |
| 5 | `/frontline/profile-lite/` | device security, PIN lockout, and what a suspension does to work already running | `frontline-profile-lite.png` |

**The question this answers:** when a tablet cannot reach the server, does the worker find out from
the screen or from a supervisor? Look at step 4 closely — the wording rules there are load-bearing,
and a message that says "done" when it means "queued" is the defect the whole offline model exists
to prevent.

**What to notice:** nothing on the Frontline queues a decision it cannot make. Work is held on the
device and named as held; it is never quietly promoted.

---

## 2 — A deviation reaches governance

**Roughly twenty minutes. Crosses two surfaces, which is where most platforms leak.**

| step | go to | look for | capture |
|---|---|---|---|
| 1 | `/hub/run-scheduling-and-execution-oversight/` | how a shift is watched without being interrupted | `hub-run-scheduling-and-execution-oversight.png` |
| 2 | `/hub/execution-summary-review/` | the anomaly register, and what a summary is allowed to assert | `hub-execution-summary-review.png` |
| 3 | `/hub/job-approval-queue/` | what a queue must show before a decision can be made on it | `hub-job-approval-queue.png` |
| 4 | `/studio/approvals/` | the same decision, from the side that owns the standard | `studio-approvals.png` |
| 5 | `/studio/versions/` | what changed, when, and against which version the run was executed | `studio-versions.png` |

**The question this answers:** can you trace a deviation back to the exact specification version
the work was performed against? Step 5 is where that either holds or does not.

---

## 3 — Administering the platform

**Roughly fifteen minutes. All 19 of this surface's modules own a screen — measured from
`registries/generated/modules.json`, not asserted.**

| step | go to | look for | capture |
|---|---|---|---|
| 1 | `/super-admin/platform-overview-and-health/` | what the platform claims to know about itself | `super-admin-platform-overview-and-health.png` |
| 2 | `/super-admin/tenants-lifecycle-and-pilots/` | a tenant's life from pilot to production | `super-admin-tenants-lifecycle-and-pilots.png` |
| 3 | `/super-admin/tiers-entitlements-and-caps/` | what a tier actually buys, expressed as caps | `super-admin-tiers-entitlements-and-caps.png` |
| 4 | `/super-admin/support-access/` | **6 controls that do not exist here** — read every one | `super-admin-support-access.png` |
| 5 | `/super-admin/platform-audit/` | whether the audit record would survive a question about it | `super-admin-platform-audit.png` |

**The question this answers:** who can see a tenant's data, under what circumstances, and is it
recorded? Step 4 is the one to read slowly — support access is where most platforms have an
unwritten exception. The 6 are: granting the engineer write access, extending the time box of an
open session, exporting anything from inside a session, hiding the tenant banner, suppressing the
tenant post-session report, and ending a compliance-emergency session from the tenant banner. **The
last two are the strongest and this document used to send you past them**, saying there were three.
Each is drawn as a note where a control would sit, never as a disabled button.

---

## 4 — A sync conflict reaches review

**Roughly ten minutes. Two surfaces, one record, and two different jobs done to it.**

| step | go to | look for | capture |
|---|---|---|---|
| 1 | `/frontline/notifications-and-sync-inbox/` | the conflict as the device sees it | `frontline-notifications-and-sync-inbox.png` |
| 2 | `/command-center/sync-conflict-review-panel/` | the same conflict as a reviewer sees it — **and the worker never resolves one** | `command-center-sync-conflict-review-panel.png` |

**The question this answers:** when two devices disagree about the same record, who decides, and
does the worker ever see the disagreement? The answer is deliberate and it is on screen.

**Also on step 2:** this screen carries a **disclosed second treatment**. The blueprint specifies
this panel's permissions twice, in two chapters, and the two disagree — the Tenant Admin's row is
one of them, and it disagrees in two places, not one. Both readings are shown with the line each
comes from. **Deciding which is right is a client decision and the build has not made it.**

---

## 5 — What the blueprint has not decided

**Roughly forty minutes, and the most valuable time in a review.**

| step | go to | look for | capture |
|---|---|---|---|
| 1 | `/coverage/` | **Source contradictions disclosed nowhere else**, and **Known limitations** — the two sections no single screen can carry | `coverage.png` |
| 2 | `/coverage/business-use-cases/` | how much of the intended behaviour has a screen today | `coverage-business-use-cases.png` |
| 3 | `/workflows/` | the workflow index, and which workflows are demonstrated | `workflows.png` |
| 4 | `/review/` | the note form, and the exportable review package that carries your notes with the frozen-source hash | `review.png` |

**The question this answers:** what are you actually being asked to decide? **There is no single
open-decisions page, and this document used to say step 1 was one.** A contradiction is disclosed
where it bites, on the screen that would otherwise have to pick a side, with both readings and the
blueprint line each comes from; 146 `DEC-*` identifiers are named across the export that way. Step
1 collects only what no screen shows. Every one of them names the contradiction, quotes both sides,
and stops. It stops on purpose — resolving one silently would be making your decision inside a
comment.

**On step 1:** the numbers are unflattering and computed rather than claimed — 14 inventories
counted from the built route tree, one status per registry and one per item. A row reads
demonstrated because a shipped route demonstrates it, and falls back the moment that route is
deleted.

**Open step 4 in a fresh browser profile.** `/review/` is the only route in the export that writes
to IndexedDB, and no test in this build clears persistence and reloads it. If a second visit
behaves differently from a first, that is a real defect nothing here would have caught — see
"What §27.2 asks for and this is not".

---

## 6 — A supervisor's shift on the Command Center

**Roughly twenty minutes. This walkthrough did not exist while both client documents said the
surface was a placeholder; `/command-center/` renders a rail of 12 screens and all 12 are built.**

| step | go to | look for | capture |
|---|---|---|---|
| 1 | `/command-center/` | the rail of 12, and why a register of 13 screens maps to it without a gap | `command-center.png` |
| 2 | `/command-center/live-shift-board/` | `pending captures unknown` — the board refusing to print a `0` it cannot justify | `command-center-live-shift-board.png` |
| 3 | `/command-center/alert-and-escalation-feed/` | what escalates on its own and what waits for a person | `command-center-alert-and-escalation-feed.png` |
| 4 | `/command-center/governance-gate-queue/` | a gate the Command Center can watch and cannot decide | `command-center-governance-gate-queue.png` |
| 5 | `/command-center/agent-activity-panel/` | what the deterministic layer still does when the assistive layer is paused | `command-center-agent-activity-panel.png` |
| 6 | `/command-center/shift-handoff-panel/` | what one supervisor is obliged to hand the next | `command-center-shift-handoff-panel.png` |

**The question this answers:** this surface owns no record of its own — every action is a command
against a Hub record, executed through the owning service. Does that boundary hold on screen, or
does the cockpit quietly start behaving like the system of record? Step 4 is where to press.

---

## What §27.2 asks for and this is not

Master prompt §27.2 requires each walkthrough step to carry reset/checkpoint, persona, scope,
route, what the client sees, action, expected validation, result, cross-surface effect, decision
prompt, failure branch, recovery and a screenshot link — 13 fields. **The tables above carry 3:
route, what the client sees, and the screenshot link.** The other 10 are absent, and they are
absent because they are properties of a walkthrough a runner executes, not of a document a person
reads.

§27.2 also names walkthrough kinds this build does not have: an executive walkthrough, a complete
functional walkthrough, nine per-role login and landing walkthroughs, per-surface module
walkthroughs, one end-to-end continuous story, and seven of the eight branch walkthroughs (the
offline branch is walkthrough 1). It requires a `WalkthroughDefinition` with audience, purpose,
prerequisites, ordered steps, narration, failure injection, presenter recovery and acceptance test;
a runner supporting start, resume, previous, next, restart, prepare-demo and recover-current-step;
and a one-click "Prepare client demo" reset. **None of that exists. Building it is slice 13**
(RESUME §5), and it is stated here rather than described as a choice.

**Nothing tests these walkthroughs.** §27.2 requires every walkthrough run from cleared browser
persistence against the served static export, including refresh recovery and keyboard-only
completion. No test in this build reloads a page, and no test walks a walkthrough's ordered steps.
Two things do hold and neither is a substitute: `tests/coverage/walkthrough-routes.test.ts` proves
every route above exists in the export and that no built surface is left without a step, and
`tests/accessibility/axe.spec.ts` proves per route that the first Tab press reaches the skip link
and that `/review/`'s controls are keyboard-operable. The cleared-persistence run is slice 13.

## What no walkthrough covers yet

**Notifications, scheduled work, events and commands** have inventories and no screens of their
own; they appear inside other surfaces' screens and are counted at `/coverage/`.

**`MOD-DOH-17` Regulated-Industry Mode and `MOD-DOH-18` Standard Report Data Sets** are the only
two modules in the build with no screen and no mount. They are on the Hub, and they are why the
Hub reads 17 of 19 rather than complete.

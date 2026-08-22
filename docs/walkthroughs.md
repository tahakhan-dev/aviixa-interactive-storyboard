# Guided walkthroughs

Five click-paths through the storyboard, each ending somewhere that answers a question. **Every
route named here is asserted to exist by `tests/coverage/walkthrough-routes.test.ts`** — a
walkthrough that names a page the export does not have fails the release gate rather than wasting
a reviewer's afternoon.

Start the export first: `pnpm build && pnpm serve:out`, then <http://localhost:4173>.

---

## 1 — A worker loses signal mid-run, and the platform says so

**Roughly fifteen minutes. The deepest-built path in the storyboard, and the one that shows what
this platform is for.**

| step | go to | look for |
|---|---|---|
| 1 | `/frontline/sign-in/` | what a sign-in has to establish before work can start |
| 2 | `/frontline/my-runs/` | which runs are startable, and which are not, and why each says so |
| 3 | `/frontline/run-player/` | the step sequence, and what a capture actually records |
| 4 | `/frontline/notifications-and-sync-inbox/` | **the honest words.** `sent`, `synced` and `done` are not synonyms here, and the inbox distinguishes them |
| 5 | `/frontline/profile-lite/` | device security, PIN lockout, and what a suspension does to work already running |

**The question this answers:** when a tablet cannot reach the server, does the worker find out from
the screen or from a supervisor? Look at step 4 closely — the wording rules there are load-bearing,
and a message that says "done" when it means "queued" is the defect the whole offline model exists
to prevent.

**What to notice:** nothing on the Frontline queues a decision it cannot make. Work is held on the
device and named as held; it is never quietly promoted.

---

## 2 — A deviation reaches governance

**Roughly twenty minutes. Crosses two surfaces, which is where most platforms leak.**

| step | go to | look for |
|---|---|---|
| 1 | `/hub/run-scheduling-and-execution-oversight/` | how a shift is watched without being interrupted |
| 2 | `/hub/execution-summary-review/` | the anomaly register, and what a summary is allowed to assert |
| 3 | `/hub/job-approval-queue/` | what a queue must show before a decision can be made on it |
| 4 | `/studio/approvals/` | the same decision, from the side that owns the standard |
| 5 | `/studio/versions/` | what changed, when, and against which version the run was executed |

**The question this answers:** can you trace a deviation back to the exact specification version
the work was performed against? Step 5 is where that either holds or does not.

---

## 3 — Administering the platform

**Roughly fifteen minutes. The only surface that is complete — nineteen of nineteen modules.**

| step | go to | look for |
|---|---|---|
| 1 | `/super-admin/platform-overview-and-health/` | what the platform claims to know about itself |
| 2 | `/super-admin/tenants-lifecycle-and-pilots/` | a tenant's life from pilot to production |
| 3 | `/super-admin/tiers-entitlements-and-caps/` | what a tier actually buys, expressed as caps |
| 4 | `/super-admin/support-access/` | **three prohibitions on what support may never do** |
| 5 | `/super-admin/platform-audit/` | whether the audit record would survive a question about it |

**The question this answers:** who can see a tenant's data, under what circumstances, and is it
recorded? Step 4 is the one to read slowly — support access is where most platforms have an
unwritten exception.

---

## 4 — A sync conflict reaches review

**Roughly ten minutes. Short because the Client Command Center is one screen so far.**

| step | go to | look for |
|---|---|---|
| 1 | `/frontline/notifications-and-sync-inbox/` | the conflict as the device sees it |
| 2 | `/command-center/sync-conflict-review-panel/` | the same conflict as a reviewer sees it — **and the worker never resolves one** |

**The question this answers:** when two devices disagree about the same record, who decides, and
does the worker ever see the disagreement? The answer is deliberate and it is on screen.

**Also on step 2:** this screen carries a **disclosed second treatment**. The blueprint specifies
this panel's permissions twice, in two chapters, and the two disagree — the Tenant Admin's row is
one of them, and it disagrees in two places, not one. Both readings are shown with the line each
comes from. **Deciding which is right is a client decision and the build has not made it.**

---

## 5 — What the blueprint has not decided

**Roughly forty minutes, and the most valuable time in a review.**

| step | go to | look for |
|---|---|---|
| 1 | `/review/` | every open decision, both readings, what is at stake, options |
| 2 | `/coverage/` | fourteen inventories counted from the built route tree |
| 3 | `/coverage/business-use-cases/` | how much of the intended behaviour has a screen today |
| 4 | `/workflows/` | the workflow index, and which workflows are demonstrated |

**The question this answers:** what are you actually being asked to decide? Step 1 is the list.
Each entry names the contradiction, quotes both sides with their blueprint lines, and stops. It
stops on purpose — resolving one silently would be making your decision inside a comment.

**On step 2:** the numbers are unflattering and computed rather than claimed. A row reads
demonstrated because a shipped route demonstrates it, and falls back the moment that route is
deleted.

---

## What no walkthrough covers yet

**The Client Command Center's other twelve modules.** `/command-center/` is a placeholder. Twelve
of its thirteen modules have no screen, so there is no walkthrough of a supervisor's shift on the
surface built for supervisors. That is the next body of work and it is stated here rather than
worked around.

**Notifications, scheduled work, events and commands** have inventories and no screens of their
own; they appear inside other surfaces' screens and are counted at `/coverage/`.

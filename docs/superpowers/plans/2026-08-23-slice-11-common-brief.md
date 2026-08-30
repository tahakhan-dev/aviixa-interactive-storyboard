# Slice 11 — the common half of every dispatch

**Artificial intelligence and its absence.** This slice builds **no module and mints no `MOD-*`
identifier.** Measured: zero occurrences of `MOD-AI-` in the frozen source; the only `MOD-*` tokens
in L85974-L95409 are incidental cross-references to modules owned by chapters 19-23. The module
inventory stays at 81.

**It is an overlay slice, and the re-plan does not say so.** The re-plan's wave 2 reads "modules (5)"
and its scope note says "`app/command-center` and `app/frontline` currently hold a single `page.tsx`
each and no module routes". **Both are stale.** Measured on this tree: slice 9 shipped all thirteen
Command Center module routes — `cc-05`, `cc-06`, `cc-07` and `cc-08` among them — and slice 7 shipped
`MOD-FL-B8` with `CoachingPanel.tsx`. What is missing is not the modules. What is missing is the
**five AI mechanisms**, and every one is verified absent: `grep -rl AIMODE src app` → nothing,
`FAIL-AI` → nothing, `PROV-1` → nothing.

So the work is: build the five mechanisms, then overlay AI degradation depth onto modules that
already render, then the platform-console pause/kill/rollback surface, then the thirty storyboards.

## The three lines every dispatch carries verbatim

1. **This brief is a hypothesis. Prove its quotations AND its locators against the frozen source
   before you build from them.** Slice 8's briefs carried eleven wrong assertions, slice 9's
   forty-three, slice 10's thirty-one in one wave — **every one the controller's, and every one
   found by an agent opening the line.** Three independent agents pre-verified this brief before it
   was written and returned **nineteen corrections**; assume there are more. Finding one is a
   success, not an obstruction.
2. **Count the rows. Never infer them from a span.** A span states where a table is, not how many
   rows it has — the difference is the header, the separator, and wherever the body actually stops.
   Where the source states a count beside an enumeration that contradicts it, **count the
   enumeration** and report both numbers. This slice has two live cases: §43.3.4's prose says "the
   thirteen required behaviours" over a matrix of twelve, and §40.16's caption says "eight ways"
   over a table of twelve.
3. This brief contains **no test code, no assertions, no matchers and no expected strings.** You
   write the tests after the code exists, against the frozen source.

## Read the whole line, and treat every single-row locator here as suspect

The chapter-44 pre-verification found a systematic shape worth naming: **nine of eleven single-row
locators in the re-plan were short by one or two lines and named the row above the intended one.**
Every module-card end line in the re-plan lands on a blank line or a `---` rule. A locator that is
off by one still *looks* right, because the row above a permission row is usually another permission
row — which is how a paraphrase of the wrong cell survives review.

Corrected card content-ends, measured: **MOD-CC-08 L37822 · MOD-CC-06 L37467 · MOD-CC-05 L37247 ·
MOD-CC-07 L37630 · MOD-FL-B8 L41596 · MOD-SA-07 L44696.**

**Never spell a line number in a comment unless that line carries what you say it carries.**
`tests/coverage/locator-fidelity.test.ts` lexes any `L`-number in a comment as a citation.

## The frozen source

```
/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md
sha256  47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27
        18,565,031 bytes · 122,241 lines
```

Read-only. `sed -n 'A,Bp'` and `grep -n`. **Cite the blueprint line, never a graph node.**

**The graph is worth less than usual on this slice.** `graphify query` returned `loc=L48386` for
`MOD-CC-05`, `MOD-CC-06` *and* `MOD-CC-08` — three different modules sharing one wrong line. Use it
to orient; never cite it.

## The five mechanisms — all verified absent, all shared across surfaces

> **STALE AS OF 2026-08-24, AND READ THIS BEFORE THE SECTION BELOW.** "All verified absent" was true
> when this brief was written and is now false: waves 0, 1 and 2 built all five. Re-measured on this
> tree, `grep -rl` returns **AIMODE in 12 files, FAIL-AI in 3, PROV-1 in 4**. `MOD-AI-` is still zero,
> so the module-inventory claim below still holds. The absence evidence is kept verbatim rather than
> rewritten, because it is the measurement that justified building them — but **a reader taking it as
> current would conclude the slice is unbuilt.** Two of the three lifts this brief calls real were
> also already done before it was written; the third, the agent roster, shipped in wave 0 task 6.

**1. The AI operating-mode machine.** Sixteen modes, **rows L89356-L89371** (L89354 is the header,
L89355 the separator — the re-plan's span includes both). Sixteen transitions follow at L89375-L89392.
`AIMODE-07` is at **L89362**, not the L89365 the re-plan gives — L89365 is `AIMODE-10`. `AIMODE-13`
and `AIMODE-14` are the matrix rows at **L89368** and **L89369**; their definition paragraphs are
separately at L89289 and L89291, and both citations are correct about different objects.

Its acceptance criteria are `AC-42-301` … `AC-42-305` with `TEST-42-301` … `TEST-42-304` at
L89400-L89412 — the re-plan names only the `AC-43-*` set. Two bind hard: **`AC-42-303`** —
`AIMODE-13`/`14` must be distinguishable from `AIMODE-03`/`05` on every surface that shows a state,
because a paused platform and an unreachable one call for different human responses; and
**`AC-42-305`** — `AIMODE-04` cannot be entered by any device while `DEC-ONDEVICE-001` is undecided,
"enforced by configuration rather than by convention".

The bounded-liveness rule advances to unavailable **when no invocation has succeeded in a window,
never when a network interface reports itself up** (`TEST-42-303`). `src/studio/state/connectivity.ts`
names four states and **none of them is one of the sixteen**; it is Studio-scoped and must not be
widened into this vocabulary.

**2. The provenance contract.** Six classes `PROV-1` … `PROV-6`, six visually disjoint treatments,
a build lint asserting every rendering path emits exactly one class. **The fail-closed rule — a
`PROV-1` element that cannot produce an agent run identifier renders `PROV-6` — is `AC-42-403` at
L89480, NOT `AC-43-403`.** `AC-43-403` (L91373) is about model quarantine and provider failover being
beyond §8.7.1. This is a 42/43 identifier collision and it is the highest-risk locator in the slice.

The absolute rule lives here or nowhere: **cached approved guidance and deterministic rules are never
labelled live AI**, in any locale, under any failure condition.

**3. The ability register and its twelve prohibitions.** Thirteen abilities `AI-01` … `AI-13` at
L87922-L87946 (odd lines, one paragraph each, ~14 attributes apiece). `AI-13` Vision carries only
five fixed attributes and "Not specified in the Statement of Work" for the rest.

Twelve prohibitions, **rows L87952-L87963**, each with its own `TEST-AI-016-N`. **Build from the
table, not the diagram.** The diagram is L87965-**L87988** (the re-plan's L87990 is the caption,
outside the fence) and draws **eight** refusal edges at L87977-L87984 under a caption reading "they
are one rule expressed eight ways". **Four prohibitions have no refusal edge, not the three the
re-plan names** — #3 impersonating a role, #10 offline-device-appears-controlled, #11 inventing
content, and **#12 broaden permissions through failover**, which is modelled at L87985-L87987 as
three dotted `does not alter` non-effects rather than a refusal.

**4. The failure catalogue.** Sixty `FAIL-AI-01` … `-60` in six families, measured across eighteen
tables at L90122-L90756, family sizes **12/12/12/10/8/6**, each family carrying three attribute
tables of equal row count. They inherit a **21-item** default response spine at **L89926-L89946** —
the re-plan's L89935-L89960 starts at item 10 and overruns into a mermaid block. **The four
operational severity bands (Critical/Major/Minor/Informational) are spine item 2 at L89927, not
L89937** — L89937 is item 12, Roles.

`AC-43-103` (L89975) and `TEST-43-103` (L89981) require operational severity to be held strictly
apart from the manufacturing severity catalogue: separate fields, separate vocabularies, **no shared
rendering component**, and no code path mapping one onto the other. Slices 6 and 9 shipped
manufacturing severity components. **Do not reuse one here.**

The ten-value open register is 10 rows at **L89997-L90006** — `DEC-AIRETRY-001`, `DEC-AITIMEOUT-001`,
`DEC-AICB-001`, `DEC-AIFAILOVER-001`, `DEC-AIQUEUE-001`, `DEC-AISTALE-001`, `DEC-AICONF-001`,
`DEC-AIQUAR-001`, `DEC-AIREPLAY-001`, `DEC-AITOKEN-001`, in that order. `AC-43-111` (L90038) — no AI
capability can be enabled while any governing value is unset. `AC-43-112` (L90039) — no value has a
code-level default that would apply silently. `TEST-43-112` (L90045) is a default-scan. **Ship the
"Not yet set — client decision DEC-*" state and a refusal. Never seed a number.**

**5. The queued-request state machine.** Twelve states with exact worker-visible strings and terminal
flags at L89624-L89637, and a 12×5 state-to-surface matrix with rows at **L89698-L89709**. Six binding
rules, including **"no state may be inferred from the absence of another"** and "every terminal state
must transition into reconciled". The Studio column reads `Not applicable — authoring surface` on all
twelve rows; that is a stated absence and renders as one, with the reason.

## One lift, not three — the re-plan is stale about the other two

**Two of the re-plan's three lifts already happened and it does not know.** Measured on this tree:
`DecisionDisclosure.tsx` and `decisions.ts` live at **`src/disclosure/`**, typed to a
surface-neutral `DecisionId` with `OPEN_DECISION_IDS` as an external literal list — slice 10 moved
them and consolidated the count class into one membership gate. `FiveSurfaceEffects.tsx` lives at
**`src/ui/shared/`**, not `src/ui/stu/`. Neither needs lifting. **Both are consumed as they stand,
and widening `DecisionId` for this slice's records is an addition to an existing union rather than a
namespace migration.**

The rule the two lifts existed to serve still binds: every one of the thirty 44A storyboards carries
a five-row surface-reaction table, so a surface with no effect renders "No direct effect" **with the
reason**.

**The third lift is real.** **`src/studio/modules/stu-02/agents.ts`** holds `STANDARD_AGENTS` with a three-valued
  `GovernanceBinding` — genuine reuse. Two things settle first. It lives inside a Studio module
  directory while this slice spans five surfaces. And it holds **three** agents from chapter 20's
  table while chapter 44's roster at L91461-L91464 holds **four**, adding the Vision Reasoning Agent
  with "Not specified beyond the roster entry" governance and no role matrix anywhere.

### The governance-binding literal is an alias pair, and the repo shipped the minority spelling

Measured whole-file: **`none — reasoning agent` occurs 21 times**, `no governance gate` **4 times**.
The repo's `GovernanceBinding` union member is `'no governance gate'` — the 4-occurrence spelling.
Both are real source literals for one value, so this is an alias pair on the slice-10 pattern, not a
correction: register one canonical, the other as alias, render both, pin both locator sets.

The re-plan cites the adoption at L89448. **That line is a Mermaid edge.** The adoption text is at
L9678, L21514, L21616, L22650, L22721, L25280, and the `DEC-GATE-001` card itself is at **L37041**.
The `no governance gate` spelling is at L31709.

## Traps, by grade — every locator a hypothesis to open

**C1 — the worker-surface pause state is a build blocker.** §40.15 at L87854 rules "the Frontline
Worker Application surface shows nothing at all about the pause", marked `Derived Clarification`.
§42.3 requires the worker's mode chip to read "Live coaching paused by the platform", explicitly
**not "offline", because the distinction matters to a worker deciding whether to walk to a better
signal** — corroborated three ways at L89289, L89348 and matrix rows L89368/L89369. **Both sides are
`Derived Clarification`; neither outranks the other on provenance.** The source authorises both and
building one silently is a false claim on the surface where the person acts. Disclose both, obey
neither, pin four locators.

**C1 — the MOD-CC-08 roll-up leak.** The Tenant Admin is `Explicitly prohibited` on "See agent health
flags" at **L37669** (the re-plan says L37668, which is "Follow an evidence link from a log entry")
and `Allowed with conditions` on "See the cross-Area agent health roll-up" at L37670 — **the roll-up
of the very flags the same role may not see**, one row apart in one matrix.

**C1 — the agent on/off contradiction, and every locator in it is off by one.** §44.1 gives the
Quality Manager `Allowed with conditions — a Studio action under authoring grants` at **L91769** (not
L91768, which is "See the honest degradation state"); MOD-CC-08's own matrix gives the QM
`Explicitly prohibited` for the same act at L37671, worded "Switch **an** agent on or off"; and the
card's prose that switching "is a Standards and Operations Studio action, linked from here, never
performed here" is at **L37646** (not L37650, which is "**The activity log.**").

**C1 — the evaluation gate has no permissive cell and must render no control.** The ten-row table at
L87399 (rows L87401-L87410) reads `Explicitly prohibited` in **all ten** status cells — zero
`Allowed`, zero `Allowed with conditions`, zero `Read-only`. SB-AI-011 at L87376 rules that "the
ENFORCED badge must be rendered as an absence of control rather than a disabled control, because a
greyed-out toggle invites the belief that a sufficiently privileged account could enable it".
**Applying the routing branch here paints a disabled toggle where the source demands no control.**

**C1 — inverted-polarity capability rows, every locator off by one.** The named capability is itself
a negative, so a prohibition means the behaviour must not occur; rendering the row as a disabled
control invents the affordance. Corrected: MOD-FL-B8 "Let a dismissal block or delay a step"
**L41471**; MOD-CC-12 "Block a shift from starting on an unacknowledged brief" **L38490**; MOD-CC-07
"Have feedback required before proceeding" **L37511**, whose cell reads "no such **gating** exists for
any role"; MOD-CC-06 "Turn learning off" **L37299**, with a second differently-worded row at L34197;
§44.3 "Be blocked from starting a shift by a missing acknowledgement" **L92308**.

**C1 — the atom-registry row that contradicts itself in place.** At **L86937** (not L86936, which is
"Set per-tenant enablement" and is internally consistent), "Enable a capability inside the tenant's
entitlement set" reads `Not applicable — this is a Studio operation inside the tenant workspace` for
all four platform roles **and** `Allowed with conditions` for Tenant Admin and Quality Manager in the
same row. Building it on the Super Admin Atom Registry contradicts `MOD-STU-01`'s read-only view
shipped in slice 5 and `AC-STU-005` (L30780).

**C1 — MOD-CC-06 has no reverse control and the source requires one.** All eight matrix rows were
listed; none names reversal, Lane A, or an undo. `SB-AI-014` at L87729 requires "the Lane A log must
render each refinement with a reverse control, because reversibility is a stated property and a
property with no control is a claim rather than a feature". **The source fixes no authority for
exercising it** (`DEC-LANEA-001`), so the control renders DISABLED with the identifier — never
omitted, and never granted to the Quality Manager by analogy with the Lane B rows.

**C1 — SB-AI-003 versus storyboard 44A.12.** SB-AI-003 (L86398) rules the worker-facing coaching card
carries "a replay control; a dismiss control; and nothing else — no rating request, no confidence
figure, no agent name" and that "the worker-facing surface carries no feedback control at all".
44A.12 (L93707-**L93792**) storyboards precisely that control. `DEC-SAFETY-001` at L92704, and again in 44A.12's own card.

**C1 — the FB-AI namespace collision is four-deep, not two.** Chapter 40/41's register holds 25
contracts at rows **L88915-L88939** using `FB-AI-00`, `FB-AI-01`…`-16`, `FB-AI-101`…`-108`; 44A.31's
holds 13 rows at **L95359-L95371** whose last row is `FB-AI-01 to FB-AI-30`. The overlap is exactly
sixteen literals. `FB-AI-01` means "Boundary violation attempt" (L88916); storyboard 1's contract
(L92793); at L46951, **"Artificial-intelligence degraded or unavailable, including the platform
emergency pause"**; and trace-store unavailability (L74495). And 44A.12's own card names `FB-AI-12`
(L93730), which the chapter-40/41 register calls "Trace and decision-record failure" (L88927) — **the
collision is not confined to the FB-AI-01…16 range.** Key on a compound of chapter and identifier and
render every owner of a colliding literal. **A gate keyed on thirteen asserts the wrong cardinality**,
because that thirteenth row stands for thirty contracts.

**C2 — §44.1 routes four of its nine rows elsewhere, not three.** L91763 (Studio or the Delivery
Operations Hub record, not the run player), L91765 (Studio corpus), L91769 (Studio action under
authoring grants), **L91770** (Studio approval chain — the re-plan gives L91769 for "Retire a coaching
asset" and that is the on/off row).

**C2 — §44.2's "six acts on other surfaces". L92029 is the separator, not a row.** Recount before
building; the claim's own evidence list contains a non-row.

**C2 — §43.3.4 is headed for AI failure and three of its cells describe connectivity.** Rows
L91181-L91192. The three cells are at **L91188** (MOD-FL-B8 "Cached read-only while offline"),
**L91190** (MOD-FL-B10 "Queued while offline") and **L91192** (MOD-FL-B12 "Unavailable — online only
by design") — every one **+2** from the re-plan's figure.

**C2 — §42.6 puts Command Center and Hub acts in the state matrix.** "pending human review" is
`Allowed — the gate is exercised here` on the Command Center; "cancelled" is `Allowed — a Supervisor
or Quality Manager may cancel with a reason`; "reconciled" is `Allowed — the record of truth holds it`
on the Hub. **Building a gate-decision or reconciliation control on `/frontline/ai-requests` puts a
Command Center and a Hub act on the device.**

**C2 — `Unavailable` and `Not applicable` are overloaded across the agent matrices.** The slice-4
adjudication applies and is **not re-litigated**; record the per-cell sense with its locator so a
reviewer can check it rather than infer it.

**C3 — `MOD-SA-07` appears nowhere in chapter 43.** Its 711-line card was swept: exactly three tables
(L44534 floors/ceilings 8 rows, L44614 Setting group/Class/Approver 8 rows, and one Field/Value card),
**no role axis anywhere**, and exactly one line in the whole span carrying a permission token
(L44650, prose). The 15-row matrix at rows **L91284-L91298** is captioned "Authority matrix for the
console's failure-response controls" and its axis is `Control`. **Attributing it to MOD-SA-07 is a
build inference and renders as one, labelled a client-delegated choice under APP-012.**

**C3 — the ai-storyboards registry counts two disjoint registers as one.** The 48 unique identifiers
are `SB-AI-01`…`-30` (the thirty 44A storyboards, tabled at rows L92693-L92722) and `SB-AI-000`,
`SB-AI-001`…`-016`, `SB-AI-100` (eighteen per-section storyboards in chapters 40 and 41). **Covering
all thirty 44A storyboards would still read 30/48.**

**C4 — two stated counts beside contradicting enumerations.** §43.3.4's prose says "the thirteen
required behaviours" (L91124, L91212) over an enumeration of 13 at L91126-L91138 and a matrix of 12 —
two different objects, and anything conflating them is off by one. §40.15's caption "Six things stop
and nine continue" (L87852) is defensible: sixteen nodes hang off `PAUSE`, six STOP (L87833-L87838),
nine KEEP (L87839-L87847), and the tenth continue-side node `HONEST` at L87848 is a rendered state
rather than a continuing behaviour.

## Decisions to disclose — 75 unique `DEC-*` in L85974-L95409

Most-referenced: `DEC-AIRTO-001` (51), `DEC-NOSHIFT-001` (27), `DEC-GATE-001` (27), `DEC-SYNC-001`
(26), `DEC-AGENTLC-001` (25).

**Three dual-identity pairs, one question each, and in the first pair MEASURED: zero lines carry
both identifiers.**

- **`DEC-AIHELP-001` versus `DEC-ASK-001`.** Not restatements. AIHELP's option (b) is "include it
  with picked reason codes and no free text", owner "the client, with tenant Quality Managers
  consulted"; ASK's option (b) is "a bounded 'show me help for this step' request that re-invokes the
  same coaching retrieval with the same metadata filter, adding no free text", owner "the client's
  product owner". Both recommend (b) and the two (b)s differ. A third reading at SB-42-501 (L89566)
  offers four picked reasons **and** a free-text field — neither (b).
- **`DEC-ONDEVICE-001` versus `DEC-LOCALAI-001`.** ONDEVICE carries a 24-row requirement register at
  L89745-L89770. Both render on any surface showing `AIMODE-04` ("defined but never entered", L89261)
  or `PROV-2` (`Client Decision Required` in the offline column).
- **`DEC-REPLAY-001` versus `DEC-COACHREPLAY-001` versus `DEC-AIREPLAY-001`** — three identifiers over
  overlapping replay questions with no cross-reference between any pair. All three render; none is
  merged.

Register one canonical and the others as aliases, say so on screen, pin every locator set.

**`DEC-AIDISCLOSE-001`** — the source contradicts itself downstream and both sides are marked
`Derived Clarification`. This is the worker-surface pause blocker above.

**`DEC-AIPAUSE-001`, `DEC-KILL-001`, `DEC-PAUSE-001`** — the site-scoped pause row reads
`Client Decision Required` in three of five cells and `Explicitly prohibited` in the fourth, so it
renders DISABLED with the identifier and both readings — **never as an absent scope and never as a
working third scope.** The kill-switch row is worse: the Platform Engineer cell is simultaneously
permissive and undecided.

**`DEC-LANEB-001`** — `MOD-CC-06` is the third consumer after `MOD-STU-11` and `MOD-STU-16`. It
renders the **same** component with the **same** locator set and must not re-adopt the hybrid position
independently.

**`DEC-VISION-001` … `-006`** (registered L95386-L95391 — L95384 and L95385 are `DEC-HANDOFF-003` and `-004`). **MEASURED ABSENCE: §44.4 is the only one of
the four agent sections with no role matrix** — 44.1 has nine rows, 44.2 nine, 44.3 eight, 44.4 none;
the whole span was swept for permission tokens. SB-AI-006 (L86781) rules the tenant sees nothing at
all and that "the platform must not display a greyed-out 'coming soon' agent". **That ruling and the
six open decisions both render, and no vision control may be built.**

**`DEC-HANDOFF-001`** appears as literal cell text in §44.3's matrix at L92306, in **both** the
Supervisor and the Quality Manager cells, so two of that matrix's eight rows are undecided in their
permissive cells and render DISABLED with both readings — not enabled.

**`DEC-DEFECT-001`** (L86149), **`DEC-LANEA-001`** (L87729), **`DEC-ROLE-001`** (registered L88888) —
the escalation target renders with the decision identifier **rather than being bound to any of the
nine security roles.**

**The Tenant Admin AI-degradation question has four readings, one role, no reconciliation.**
`MOD-CC-08` L37669 `Explicitly prohibited`; §44.1 L91767 `Allowed`; SB-42-301 L89348 puts the same
banner "in the tenant administration area with the incident reference" — **a fourth surface neither
matrix mentions**; §44.3 L92309 `Allowed` against `MOD-CC-12` L38483 `Explicitly prohibited` on
reading the brief at all. `src/routes/definitions.ts` already gives `SURF-CC` allowedRoles
`['TENANT_ADMIN','SUPERVISOR','QUALITY_MANAGER']`, **so the role reaches the surface and the question
is per-capability.**

## What every task owes

Everything slices 7-10 required, unchanged, plus three this slice adds.

- Its own reachability from `app/`. A component reachable from nothing is not shipped, and **a stated
  abstention and an oversight look identical from outside.**
- The call-site count before and after any shared-contract change, both in the report. **Fix once,
  where all callers route.**
- Every gate plants its own defect, watches it go red, and restores it. **A membership gate is a
  literal list, not a length, and is proved by ADDING, not removing.**
- **Never renumber a stale count — remove it.** Changing a number reships the identical defect with a
  fresh number; the count was never the claim a reader could act on.
- **New, and it is this slice's shape:** no rendering path may emit more than one provenance class,
  and no path may label cached guidance or a deterministic rule as live AI. Every task touching a
  rendered AI element states which `PROV-*` class it emits.
- **New:** operational severity and manufacturing severity share no rendering component. If you find
  yourself importing a severity component from slice 6 or 9, stop.
- **New:** no governing value from the ten-row open register gets a code-level default. The refusal is
  the feature.

## Wave order

*Wave 0 — the five mechanisms plus the three lifts. Nothing later can be retrofitted onto them.*
1. The operating-mode machine — sixteen modes, sixteen transitions, hysteresis, bounded liveness,
   `AC-42-301`…`-305`.
2. The provenance contract — six classes, disjoint treatments, exactly-one lint, the `AC-42-403`
   fail-closed rule.
3. The ability register and the twelve prohibitions, built from the table.
4. The failure catalogue — sixty in six families, the 21-item spine, the four operational severity
   bands held separate, the ten-value open register and its refusal.
5. The queued-request state machine and its 12×5 matrix.
6. The agent-roster lift and the governance-binding alias pair + the AI decision canon + the
   collision-aware fallback registry keyed on chapter and identifier. **First and alone**, because
   every other wave-0 task discloses an open decision through the canon.

*Wave 1 — the agents (2).* 7. The four degradation contracts and their three role matrices (9, 9, 8)
plus the §40.1 boundary matrix — one object graph, not to be split. 8. The deterministic-boundary
rendering.

*Wave 2 — the module overlays (5). These modules already render; this wave adds their AI depth.*
9. The console failure-response authority matrix (15 rows) and its unsourced module attribution.
10. `MOD-CC-08`. 11. `MOD-CC-06`. 12. `MOD-CC-05`. 13. `MOD-FL-B8` + `MOD-CC-07`.

*Wave 3 — platform console (2).* 14. Pause / kill / rollback and the new `/super-admin/ai-incidents`
route. 15. The five-surface overlays onto already-shipped SA, STU, DOH and CC modules — **touches
eight route directories other slices own; diff the path list against every running agent.**

*Wave 4 — storyboards (3), ten each.* 16. 44A.1-10. 17. 44A.11-20. 18. 44A.21-30. Thirty cards of
nineteen fields and thirty surface tables of five rows is **720 measured rows**; one task at that
size is the shape earlier plans rejected.

*Wave 5 — closure (4).* 19. The end-to-end journey over the shared fixture. 20. Registry closure.
21. Gates, **strictly after every build task**, so directory enumeration cannot pass on an empty scan.
22. Verification, last and alone.

## What could not be established, and ships marked so

1. **Which surface renders the tenant-scope scheduled-run ledger.** L100424 says the Hub "Holds" it
   and L100427 says the Hub "Displays occurrence state", yet no row of L48095-L48117 names a scheduler
   screen. **The source names a display obligation with no screen to carry it.**
2. **Which module owns `SCR-SA-SCHED-01` and `-02`.** No `MOD-*` identifier claims either screen.
3. **`DEC-FINISH-002`'s two readings** — named as a contradiction (L98703), indexed (L115082), never
   written down.
4. **The slice-to-module allocation is nowhere recorded**, in the source or the repo. The six-module
   scope is a build decision, not a source fact, and is labelled a client-delegated choice under
   APP-012 wherever it renders.

**Two `PermissionOutcome` members are first exercised here** and neither has a rendering precedent:
`cachedReadOnlyOffline` and `queuedOffline`. L31515 records why the distinction matters — where they
appear they describe **"the Frontline consequence of a Studio configuration, not a Studio user's own
experience."**

## Controller pre-verification

Three independent agents opened every locator cluster in this brief before it was written. Their
measured reports are the evidence behind every correction above, and the corrections are recorded in
`docs/process/RESUME.md` §8. Nineteen locator errors, one wrong-chapter identifier, one under-count,
and one stale scope claim were found. **Assume the count is not nineteen.**

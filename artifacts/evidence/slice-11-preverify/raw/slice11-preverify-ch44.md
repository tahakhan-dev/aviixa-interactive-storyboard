# Slice 11 pre-verification — Chapter 44 / 44A

Source (frozen, read-only): `AVIIXA_Production_Product_Blueprint.md`, 122,241 lines.
Every line below was opened and counted. Row counts are counted rows, never span arithmetic.

## FINDINGS

| # | Claim | Measured | Verdict | Evidence line |
|---|---|---|---|---|
| 1a | §44.1 matrix L91757-L91771, 9 rows | header L91761, separator L91762, **9 data rows L91763-L91771**. L91757 is the `### Matrix` heading, not the table | **CORRECTED** (rows 9 ✓; span wrong) | L91761 / L91763-71 |
| 1b | §44.2 matrix L92024-L92038, 9 rows | header L92028, separator L92029, **9 data rows L92030-L92038**. L92024 is the heading | **CORRECTED** (rows 9 ✓; span wrong) | L92028 / L92030-38 |
| 1c | §44.3 matrix L92296-L92309, 8 rows | header L92300, separator L92301, **8 data rows L92302-L92309**. L92296 is the heading | **CORRECTED** (rows 8 ✓; span wrong) | L92300 / L92302-09 |
| 1d | §44.4 (L92368-L92595) has NO role matrix | Confirmed. Whole span swept for `^\|` and for `Explicitly prohibited`: tables present are the fallback-contract element table (hdr L92512), AC table (hdr L92550), TEST table (hdr L92561), traceability table (hdr L92576). **Zero occurrences of `Explicitly prohibited` / `Allowed with conditions` in 92368-92595. No `\| Capability \| Worker \| …` header.** | **CONFIRMED (absence)** | L92368-L92595 |
| 2a | §44.1 QM "Switch the agent on or off" = `Allowed with conditions — a Studio action under authoring grants` at L91768 | Text is at **L91769**. L91768 is "See the honest degradation state" | **CORRECTED** | L91769 |
| 2b | MOD-CC-08 matrix gives QM `Explicitly prohibited` for the same act at L37671 | Confirmed at L37671. Capability wording is "Switch **an** agent on or off". Column order in that table is Tenant Admin \| Supervisor \| Quality Manager \| Read-only Auditor \| Worker (header L37664) — the QM cell is a bare `Explicitly prohibited`; the annotation "— a Standards and Operations Studio action, linked from here" sits in the **Tenant Admin** cell | **CONFIRMED with correction to the column reading** | L37671 (hdr L37664) |
| 2c | MOD-CC-08 prose at L37650 says switching "…linked from here, never performed here" | Prose is at **L37646**. L37650 is "**The activity log.**" | **CORRECTED** | L37646 |
| 3a | §44.1 "See authored Work Instructions on the step" L91763 | L91763 | **CONFIRMED** | L91763 |
| 3b | §44.1 "See the curated default asset" L91765 | L91765 | **CONFIRMED** | L91765 |
| 3c | §44.1 "Retire a coaching asset" L91769 | **L91770** | **CORRECTED** | L91770 |
| 3d | count of nine rows with permissive cells routing elsewhere | **4, not 3**: L91763 (Studio / Delivery Operations Hub), L91765 (Studio corpus), L91769 (Studio action under authoring grants), L91770 (Studio approval chain) | **CORRECTED** | L91763,65,69,70 |
| 4 | §44.2 "six acts placed on other surfaces behind `Allowed`" at L92031, L92030, L92032, **L92029**, L92034, L92036 | **L92029 is the `\|---\|` separator, not a row.** L92030 and L92031 are *on-surface automatic* acts ("by capturing a value", "automatic and immediate") and route nowhere. Measured rows whose permissive cell sits on another surface: **7** — L92032, L92033, L92034, L92035, L92036, L92037, L92038. Of these, **4 name the other route explicitly in cell text** (L92032 device+run, L92036 review-time bridge, L92037 Lane B / Delivery Operations Hub, L92038 Studio approval chain or Lane B) | **CORRECTED** (count 7, or 4 under the strict "names a route" reading; never 6, and one cited line is a separator) | L92029-L92038 |
| 5a | L41470 MOD-FL-B8 "Let a dismissal block or delay a step" | **L41471**. L41470 is "Dismiss a coaching card" | **CORRECTED** | L41471 |
| 5b | L38489 MOD-CC-12 "Block a shift from starting on an unacknowledged brief — no such capability exists for any role" | **L38490**. L38489 is "Configure the agent's run time or the grace period" | **CORRECTED** | L38490 |
| 5c | L37509 MOD-CC-07 "Have feedback required before proceeding" | **L37511**. L37509 is "Produce a learned-change decision signal". Cell reads "no such **gating** exists for any role" | **CORRECTED** | L37511 |
| 5d | L37298 MOD-CC-06 "Turn learning off — no such switch exists" | **L37299**. L37298 is "See the read-only learning view". A second, differently-worded "Turn learning off" row exists at **L34197** ("there is no separate on/off switch", 6-role table) | **CORRECTED (+ second instance found)** | L37299, L34197 |
| 5e | L92307 §44.3 "Be blocked from starting a shift by a missing acknowledgement" | **L92308**. L92307 is "Write the manual handoff note" | **CORRECTED** | L92308 |
| 6 | §44.3: `DEC-HANDOFF-001` and `-002` appear as literal cell text; 2 of 8 rows undecided in permissive cells | Confirmed. L92306 carries `DEC-HANDOFF-001` in **both** the Supervisor and the Quality Manager cells; L92307 carries `DEC-HANDOFF-002` in both. **2 of 8 rows, 4 undecided permissive cells** | **CONFIRMED** | L92306, L92307 |
| 7a | thirty storyboards 44A.1-44A.30 | Confirmed. `### 44A.N` headings: **31 total**, of which 44A.1-44A.30 are storyboards and 44A.31 is the register | **CONFIRMED** | see heading list below |
| 7b | span L92596-L95309 | L92596 is `## 44A.` chapter heading; the **storyboards** run L92772-L95309. L92596-L92771 is the 44A preamble | **CORRECTED (span includes the preamble)** | L92596 / L92772 |
| 7c | each card is 19 fields | **All 30 cards counted: 19 rows each.** 44A.1 hdr L92791, rows L92793-L92811 = 19. 44A.17 hdr L94155, rows L94157-L94175 = 19 | **CONFIRMED** | L92791, L94155 |
| 7d | 30 surface-reaction tables of 5 rows, first at L92815, last at L95273 | **All 30 counted: 5 rows each.** First header **L92815** (rows L92817-L92821); last header **L95273** (rows L95275-L95279). 30 `**Five-surface reaction.**` markers | **CONFIRMED** | L92815, L95273 |
| 7e | storyboard table at L92691-L92722 | header L92691, separator L92692, **30 data rows L92693-L92722** | **CONFIRMED (rows 30; data starts L92693)** | L92691-L92722 |
| 8 | §44A.31 decision register, 20 rows at L95375-L95396; canon list at L95398 | header L95375, separator L95376, **20 data rows L95377-L95396**. Canon list verbatim at **L95398** | **CONFIRMED (rows 20; data span L95377-L95396)** | L95377-L95396, L95398 |
| 9 | 44A.12 (L93707-L93793) storyboards a worker-facing feedback control, contradicting SB-AI-003 at L86398 | Both confirmed at the claimed lines. 44A.12 spans **L93707-L93792** (L93793 is blank; `### 44A.13` is L93794). The control put on the worker's screen is a **"Report a problem" safety-flag control on the coaching card, beside "Dismiss"** (`SCR-FL-COACH-07` Panel 1, L93780), reached by "Maya taps a flag control on the coaching card and selects a categorised reason" (L93719) | **CONFIRMED (contradiction real; span end off by one)** | L86398 vs L93719/L93780 |
| 10a | ch40/41 register L88913-L88939, 25 contracts | header L88913, separator L88914, **25 data rows L88915-L88939** | **CONFIRMED (rows 25; data span L88915-L88939)** | L88915-L88939 |
| 10b | 44A.31 register 13 rows, last collapsing FB-AI-01..FB-AI-30 | header L95357, separator L95358, **13 data rows L95359-L95371**; L95371 is `\| FB-AI-01 \| to \| FB-AI-30 \|` | **CONFIRMED** | L95359-L95371 |
| 10c | shared literals FB-AI-01..FB-AI-16 | ch40/41 uses FB-AI-00, FB-AI-01..FB-AI-16, FB-AI-101..FB-AI-108. 44A uses FB-AI-01..FB-AI-30. **Overlap = 16 literals, FB-AI-01..FB-AI-16** | **CONFIRMED** | L88915-L88931 vs L95371 |
| 10d | FB-AI-01 = "Boundary violation attempt" (40.1) AND storyboard 1's contract | L88916 = Boundary violation attempt, 40.1; L92793 = `SB-AI-01`; fallback contract `FB-AI-01`. Also used in prose for boundary violation at L86147 | **CONFIRMED** | L88916, L92793 |
| 10e | FB-AI-05 = "Shift handoff brief failure" AND "Severity 1 deviation while AI is unavailable" | L88920 = Shift handoff brief failure, 40.5; L93129 = `SB-AI-05`; fallback contract `FB-AI-05` inside §44A.5 "Severity 1 deviation while artificial intelligence is unavailable" (heading L93105). Also prose at L86700 for shift handoff | **CONFIRMED** | L88920, L93129 |
| 10f | further meaning at L46951 | Confirmed at L46951: FB-AI-01 = "Artificial-intelligence degraded or unavailable, including the platform emergency pause" — a **third** meaning | **CONFIRMED** | L46951 |
| 10g | further meaning at L74495 | Confirmed at L74495: FB-AI-01 assigned to **trace-store unavailability** — a **fourth** meaning, and one that collides with FB-AI-12 "Trace and decision-record failure" (L88927) | **CONFIRMED** | L74495 |
| 10h | *(found, not claimed)* | 44A.12's card names fallback contract **`FB-AI-12`** (L93730), which in the ch40/41 register is "Trace and decision-record failure" (L88927). The collision is not confined to FB-AI-01 and FB-AI-05 | **NEW FINDING** | L93730 vs L88927 |
| 11 | SB-AI-006 at L86781 | Confirmed at L86781, verbatim | **CONFIRMED** | L86781 |

### Systematic pattern
Every locator in items 2, 3c, 5 and 9 is **short by one or two lines** and lands on the row *above* the intended row. Nine of eleven single-row locators are off. Treat all controller row locators in this slice as +1/+2 until re-resolved.

---

## VERBATIM QUOTATIONS

### §44.1 matrix — true header L91761

L91761
```
| Capability | Worker | Supervisor | Quality Manager | Tenant Admin | Read-only Auditor |
```

L91763
```
| See authored Work Instructions on the step | Allowed | Allowed with conditions — through the Studio or the Delivery Operations Hub record, not the run player | Allowed with conditions — through the Studio or the Delivery Operations Hub record | Read-only | Read-only |
```

L91765
```
| See the curated default asset | Allowed | Read-only through the Studio corpus | Read-only through the Studio corpus | Read-only | Read-only |
```

L91769
```
| Switch the agent on or off | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — a Studio action under authoring grants [SoW Fact — §6.9.1, §5.18] | Explicitly prohibited | Explicitly prohibited |
```

L91770
```
| Retire a coaching asset | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — through the Studio approval chain [SoW Fact — §5.11.1] | Explicitly prohibited | Explicitly prohibited |
```

### The §44.1 conflict — the other two sides

L37664 (MOD-CC-08 matrix header; note the column order)
```
| Capability on this module | Tenant Admin | Supervisor | Quality Manager | Read-only Auditor | Worker |
```

L37671
```
| Switch an agent on or off | Explicitly prohibited — a Standards and Operations Studio action, linked from here | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
```

L37646 (the prose, **not** L37650)
```
**Per-agent live status.** The panel answers, at a glance: **what have the agents been doing on my floor?** For each of the three standard agents and every deployed composed reasoning agent: **on or off state — switching an agent is a Standards and Operations Studio action, linked from here, never performed here — activations this shift, last activation, outputs produced, and items waiting at the gate** `[SoW Fact — §6.9.1]`.
```

The conflict is real and direct: at L91769 the Quality Manager may switch the agent; at L37671 every role including the Quality Manager is `Explicitly prohibited`, and L37646 states the act is "never performed here".

### §44.2 rows (true header L92028; separator L92029)

L92030
```
| Trigger a deviation deterministically | Allowed — by capturing a value; not a discretionary act | Not applicable — deviations are triggered by capture, not by decision | Not applicable — deviations are triggered by capture, not by decision | Not applicable — deviations are triggered by capture, not by decision | Not applicable — the auditor role performs no capture |
```

L92031
```
| Have the Severity 1 hold placed locally | Allowed — automatic and immediate | Not applicable — the hold is placed by the device | Not applicable — the hold is placed by the device | Not applicable — the hold is placed by the device | Not applicable — the hold is placed by the device |
```

L92032
```
| Complete the containment checklist offline | Allowed | Allowed with conditions — where the Supervisor holds a device and the run | Allowed with conditions — where the Quality Manager holds a device and the run | Explicitly prohibited | Explicitly prohibited |
```

L92033
```
| Acknowledge the escalation | Explicitly prohibited | Allowed | Allowed | Explicitly prohibited | Explicitly prohibited — no Command Center access |
```

L92034
```
| Request release with a note | Explicitly prohibited | Allowed | Not applicable — the Quality Manager releases directly | Explicitly prohibited | Explicitly prohibited |
```

L92035
```
| Release a Severity 1 hold | Explicitly prohibited | Explicitly prohibited | Allowed | Explicitly prohibited | Explicitly prohibited |
```

L92036
```
| Reclassify at review time with a recorded reason | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — at the review-time bridge only, with a reason [SoW Fact — §3.3] | Explicitly prohibited | Explicitly prohibited |
```

L92037
```
| See the classification-divergence flag | Explicitly prohibited — the worker surface carries the deterministic verdict only | Read-only | Allowed with conditions — may raise a Lane B proposal from it | Read-only | Read-only via the Delivery Operations Hub record |
```

L92038
```
| Change an authored limit or mapping in response | Explicitly prohibited | Explicitly prohibited | Allowed with conditions — through the Studio approval chain or a decided Lane B proposal [SoW Fact — §5.11.1, §6.7] | Explicitly prohibited | Explicitly prohibited |
```

### Inverted-polarity capability rows

L41471 (MOD-FL-B8)
```
| Let a dismissal block or delay a step | `Explicitly prohibited` — coaching is advisory and never gates | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` | `Explicitly prohibited` |
```

L38490 (MOD-CC-12)
```
| Block a shift from starting on an unacknowledged brief | Explicitly prohibited — no such capability exists for any role | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
```

L37511 (MOD-CC-07)
```
| Have feedback required before proceeding | Explicitly prohibited — no such gating exists for any role | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
```

L37299 (MOD-CC-06)
```
| Turn learning off | Explicitly prohibited — no such switch exists | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
```

L34197 (second instance, six-column table, not in the claim)
```
| Turn learning off | Explicitly prohibited — there is no separate on/off switch | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited |
```

L92308 (§44.3)
```
| Be blocked from starting a shift by a missing acknowledgement | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Explicitly prohibited | Not applicable — the auditor starts no shift |
```

All five are prohibitions of a *negative* capability. Rendering any of them as a disabled control would invent the affordance the row exists to deny. L38490 and L37511 say so in the cell text: "no such capability exists for any role", "no such gating exists for any role".

### §44.3 undecided permissive cells

L92306
```
| Read the deterministic handoff pack | Explicitly prohibited | Allowed with conditions — subject to `DEC-HANDOFF-001` | Allowed with conditions — subject to `DEC-HANDOFF-001` | Unavailable | Read-only via the Delivery Operations Hub record |
```

L92307
```
| Write the manual handoff note | Explicitly prohibited | Allowed with conditions — subject to `DEC-HANDOFF-002` | Allowed with conditions — subject to `DEC-HANDOFF-002` | Explicitly prohibited | Explicitly prohibited |
```

Register entries, L95382-L95383:
```
| `DEC-HANDOFF-001` | Is a deterministic handoff pack produced when the Shift Handoff Agent fails? | 44.3, 44A.28 | Client Decision Required |
| `DEC-HANDOFF-002` | May the outgoing Supervisor compose a manual handoff note, and in what form? | 44.3, 44A.28 | Client Decision Required |
```

### §44A.N heading lines — all 31

| Section | Line | Section | Line | Section | Line |
|---|---|---|---|---|---|
| 44A.1 | 92772 | 44A.12 | 93707 | 44A.23 | 94630 |
| 44A.2 | 92855 | 44A.13 | 93794 | 44A.24 | 94722 |
| 44A.3 | 92940 | 44A.14 | 93879 | 44A.25 | 94802 |
| 44A.4 | 93020 | 44A.15 | 93969 | 44A.26 | 94886 |
| 44A.5 | 93105 | 44A.16 | 94050 | 44A.27 | 94968 |
| 44A.6 | 93197 | 44A.17 | 94134 | 44A.28 | 95052 |
| 44A.7 | 93283 | 44A.18 | 94217 | 44A.29 | 95138 |
| 44A.8 | 93370 | 44A.19 | 94302 | 44A.30 | 95221 |
| 44A.9 | 93453 | 44A.20 | 94384 | 44A.31 | 95310 |
| 44A.10 | 93543 | 44A.21 | 94463 | | |
| 44A.11 | 93625 | 44A.22 | 94547 | | |

Card header / 19-row span, then surface header / 5-row span, per storyboard:

| SB | card hdr | card rows | surf hdr | surf rows |
|---|---|---|---|---|
| 1 | 92791 | 92793-92811 | 92815 | 92817-92821 |
| 2 | 92874 | 92876-92894 | 92898 | 92900-92904 |
| 3 | 92958 | 92960-92978 | 92982 | 92984-92988 |
| 4 | 93039 | 93041-93059 | 93063 | 93065-93069 |
| 5 | 93127 | 93129-93147 | 93151 | 93153-93157 |
| 6 | 93219 | 93221-93239 | 93243 | 93245-93249 |
| 7 | 93303 | 93305-93323 | 93327 | 93329-93333 |
| 8 | 93391 | 93393-93411 | 93415 | 93417-93421 |
| 9 | 93472 | 93474-93492 | 93496 | 93498-93502 |
| 10 | 93564 | 93566-93584 | 93588 | 93590-93594 |
| 11 | 93643 | 93645-93663 | 93667 | 93669-93673 |
| 12 | 93728 | 93730-93748 | 93752 | 93754-93758 |
| 13 | 93814 | 93816-93834 | 93838 | 93840-93844 |
| 14 | 93899 | 93901-93919 | 93923 | 93925-93929 |
| 15 | 93990 | 93992-94010 | 94014 | 94016-94020 |
| 16 | 94071 | 94073-94091 | 94095 | 94097-94101 |
| 17 | 94155 | 94157-94175 | 94179 | 94181-94185 |
| 18 | 94238 | 94240-94258 | 94262 | 94264-94268 |
| 19 | 94323 | 94325-94343 | 94347 | 94349-94353 |
| 20 | 94403 | 94405-94423 | 94427 | 94429-94433 |
| 21 | 94484 | 94486-94504 | 94508 | 94510-94514 |
| 22 | 94566 | 94568-94586 | 94590 | 94592-94596 |
| 23 | 94661 | 94663-94681 | 94685 | 94687-94691 |
| 24 | 94741 | 94743-94761 | 94765 | 94767-94771 |
| 25 | 94823 | 94825-94843 | 94847 | 94849-94853 |
| 26 | 94905 | 94907-94925 | 94929 | 94931-94935 |
| 27 | 94989 | 94991-95009 | 95013 | 95015-95019 |
| 28 | 95074 | 95076-95094 | 95098 | 95100-95104 |
| 29 | 95159 | 95161-95179 | 95183 | 95185-95189 |
| 30 | 95249 | 95251-95269 | 95273 | 95275-95279 |

19 fields, in card order (from 44A.1, L92793-L92811): Identifier; Preconditions; Trigger; Actors and roles; Worker-visible experience; Automatic fallback; Manual fallback; Fallback-of-fallback; Safe stop; Local data; Central data; Notifications; Reconnection; Conflict resolution; Final official state; Audit; Recovery Time Objective and Recovery Point Objective; Residual risk; Source status.

### §44A.31 decision register — 20 rows, L95377-L95396

Identifiers in order: `DEC-AIRETRY-001`, `DEC-AIRTO-001`, `DEC-COACHREPLAY-001`, `DEC-AIDUP-001`, `DEC-DIVERGE-001`, `DEC-HANDOFF-001`, `DEC-HANDOFF-002`, `DEC-HANDOFF-003`, `DEC-HANDOFF-004`, `DEC-VISION-001`, `DEC-VISION-002`, `DEC-VISION-003`, `DEC-VISION-004`, `DEC-VISION-005`, `DEC-VISION-006`, `DEC-ASK-001`, `DEC-LOCALAI-001`, `DEC-SAFETY-001`, `DEC-AIEXPIRE-001`, `DEC-AIQUEUE-001`. All 20 carry Status `Client Decision Required`.

Canon-list line, L95398, verbatim:
```
**Canon decisions this chapter references.** Four of them carry adopted working positions, and this chapter writes the adopted behaviour: `DEC-GATE-001`, gating declared per agent in the agent record's governance-binding field; `DEC-CAP-001`, the seven launch capture types with checklist and boolean merged into checkbox confirmation carrying a multiplicity setting; `DEC-SYNC-001`, reconnection in three phases of stop-class commands, then the full capture upload, then the enabling classes; and `DEC-SUSP-001`, soft suspension released by an explicit operator signal in the Super Admin platform console. All four are `Derived Clarification — adopted working position`, adopted 2026-08-14, with both source readings retained in their decision cards and each adoption open for client ratification. The following are referenced without resolving: `DEC-STORE-001` · `DEC-WIPE-001` · `DEC-ROLE-001` · `DEC-PLUS-001` · `DEC-LANEB-001` · `DEC-LIB-001` · `DEC-WIDIFF-001` · `DEC-PKGFIELD-001` · `DEC-NOSHIFT-001` · `DEC-DEVICE-001` · `DEC-ROLLOUT-001` · `DEC-FEAT-003` · `DEC-FEAT-004` · `DEC-FEAT-005`. Each is preserved with both readings intact wherever this chapter touches it, and none is silently resolved.
```

### 44A.12 versus SB-AI-003

L86398, verbatim:
```
**Storyboard `SB-AI-003` — the coaching card on the Frontline Worker Application surface.** Screen `SCR-FL-COACH` overlays the current run-player step. It carries: the asset itself, sized to the screen; one line stating why it appeared, in the worker's locale; a replay control; a dismiss control; and nothing else — no rating request, no confidence figure, no agent name. Feedback on agent outputs is always optional and one tap, never required, never gating `[SoW Fact — §6.8.2]`, and `Derived Clarification` the worker-facing surface carries no feedback control at all, because the effectiveness signal the platform actually uses is whether the worker then completed the screen successfully `[SoW Fact — §5.16.2]`. Dismissing returns the worker to the step with no state change. On the Client Command Center surface, screen `SCR-CC-AGENTPANEL` shows the intervention as a silent marker against the run; on the third repeat for one worker on one screen it becomes an actionable alert in the alert and escalation feed.
```

44A.12, L93719:
```
1. Maya taps a flag control on the coaching card and selects a categorised reason, with optional free text.
```

44A.12, L93780:
```
**Screen storyboard — Frontline (`SCR-FL-COACH-07`).** Panel 1: the card with two distinct controls — "Dismiss" and "Report a problem" — worded and placed so they cannot be confused. Panel 2: the reason picker with a small number of categorised reasons and an optional note. Panel 3: the confirmation quoted above, then the fallback guidance.
```

44A.12, L93734:
```
| Worker-visible experience | The card disappears immediately with a plain confirmation: "Thank you. This help card has been reported and will not be shown on this tablet again until it is checked." Then the fallback guidance renders |
```

**Precisely which control 44A.12 puts on the worker's screen:** a second control labelled **"Report a problem"**, sitting on the same coaching card as "Dismiss" (screen `SCR-FL-COACH-07`), opening a categorised-reason picker with an optional note. SB-AI-003 fixes the same card at `SCR-FL-COACH` as carrying "a replay control; a dismiss control; and nothing else" and states the surface "carries no feedback control at all". 44A.12 flags the addition itself: it is `User-Mandated Product Extension` under `DEC-SAFETY-001` (L93748, L93790), and its narrative concedes at L93713 that the Statement of Work "does not provide a worker-side safety flag". The contradiction is with SB-AI-003's absolute "nothing else", not with the SoW.

### FB-AI namespace collision

Chapter 40/41 register, header L88913, 25 rows L88915-L88939. Colliding literals:
```
L88916 | `FB-AI-01` | Boundary violation attempt | 40.1 |
L88920 | `FB-AI-05` | Shift handoff brief failure | 40.5 |
L88927 | `FB-AI-12` | Trace and decision-record failure | 40.12 |
```

Chapter 44A side:
```
L92793 | Identifier | `SB-AI-01`; fallback contract `FB-AI-01`; extends `FB-AGT-PREV-01` |
L93129 | Identifier | `SB-AI-05`; fallback contract `FB-AI-05`; extends `FB-AGT-DEV-01` |
L93730 | Identifier | `SB-AI-12`; fallback contract `FB-AI-12` |
L95371 | `FB-AI-01` to `FB-AI-30` | One per storyboard, as named in section 44A | 44A.1 to 44A.30 | As stated in each storyboard's safe stop |
```
L93129 sits inside §44A.5, heading L93105: `### 44A.5 Severity 1 deviation while artificial intelligence is unavailable`.

Third meaning, L46951:
```
| `FB-AI-01` | Artificial-intelligence degraded or unavailable, including the platform emergency pause. Fallback is authored content and deterministic behaviour, never silence. |
```

Fourth meaning, L74495:
```
**Failure, first fallback, fallback failure, terminal safe state, recovery, reconciliation.** `FB-AI-01`. Failure: the trace store is unavailable while an agent is running. First fallback: the decision record, which is small and operationally essential,
```
(L74495 assigns FB-AI-01 to the trace-store failure that L88927 assigns to FB-AI-12.)

Overlap: **16 literals**, FB-AI-01 through FB-AI-16. FB-AI-00 and FB-AI-101..FB-AI-108 are unique to ch40/41; FB-AI-17..FB-AI-30 are unique to 44A. FB-AI-01 carries **four** distinct meanings across the document.

### SB-AI-006

L86781, verbatim:
```
**Storyboard `SB-AI-006` — what a tenant sees before the release.** Nothing. There is no Vision Reasoning Agent entry in the Client Command Center agent activity panel, no vision configuration surface in the Standards and Operations Studio surface, and no vision capability in the Atomic Capability area, because configuration follows capability and a disabled capability shows no surface `[SoW Fact — §5.15.2]`. `Derived Clarification`: the platform must not display a greyed-out "coming soon" agent, because the agent activity panel's contract is per-agent live status for deployed agents and a placeholder would pollute a surface whose value is that everything on it is real.
```

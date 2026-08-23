# Slice 11 pre-verification — Chapter 43 locators

Source: `/Users/tahakhan/Desktop/JBS-AMPLIFY-NIGHT/Ron-project1/AVIIXA_Production_Product_Blueprint.md`
sha256 `47bd18db467817f3edbe3329c8ae5e332013871aaa2df08c2be6fc5afa8d0b27` — verified, 122241 lines.
Chapter 43 heading: L89813 `# 43. Five-Surface Artificial-Intelligence Failure Architecture`.
No writes made to the repository.

## FINDINGS

| # | Claim | Measured | Verdict | Evidence line |
|---|---|---|---|---|
| 1a | §43.3.5 matrix at L91282–L91298, 15 rows | Header L91282, separator L91283, first data row L91284, last data row L91298. **15 data rows** | CONFIRMED (count); span start is the header, not a data row | L91282 / L91284 / L91298 |
| 1b | matrix is "for MOD-SA-07" | `MOD-SA-07` occurs nowhere in §43.3.5 (L91214–L91321) nor anywhere in ch. 43. Table is captioned "Authority matrix for the console's failure-response controls." (L91280) | CORRECTED — MOD-SA-07 attribution is not in the source here | L91280 |
| 1c | column headers | `Control / Root Super Admin / Admin / Platform Engineer / Support / Classification` — 6 columns, a control axis, not a module axis | MEASURED | L91282 |
| 2 | §43.3.2 L90989–L91002, 12 rows, first column "Capability" | Header L90989, separator L90990, data L90991–L91002 = **12 rows**. First column header is `Capability` | CONFIRMED | L90989 |
| 3a | §43.3.3 L91080–L91094, 13 rows | Header L91080, separator L91081, data L91082–L91094 = **13 rows** | CONFIRMED | L91080 |
| 3b | first column holds MOD-CC-* identifiers | First column holds **plain module names**, no `MOD-CC-` token anywhere in the table. Column is headed `Command Center module` | CORRECTED | L91082 (`\| Live shift board \| …`) |
| 4a | §43.3.4 L91179–L91192, 12 rows, 2nd col "Behaviour during an artificial-intelligence failure" | Header L91179, separator L91180, data L91181–L91192 = **12 rows**; 2nd column header exactly as claimed | CONFIRMED | L91179 |
| 4b | MOD-FL-B8 "Cached read-only while offline" at L91186 | Actually **L91188** | CORRECTED (+2) | L91188 |
| 4c | MOD-FL-B10 "Queued while offline" at L91188 | Actually **L91190** | CORRECTED (+2) | L91190 |
| 4d | MOD-FL-B12 "Unavailable — online only by design" at L91190 | Actually **L91192** | CORRECTED (+2) | L91192 |
| 4e | three of twelve cells describe connectivity, not AI failure | CONFIRMED substantively — all three cells are worded in connectivity terms ("while offline", "online only by design") under a column headed "Behaviour during an artificial-intelligence failure" | CONFIRMED | L91188, L91190, L91192 |
| 4f | (not claimed) count contradiction | §43.3.4 states **"The thirteen required behaviours."** (L91124) with 13 enumerated items L91126–L91138, and L91212 says "All thirteen behaviours…", but the behaviour matrix carries **12 rows**. Prose count 13 vs enumeration in table 12 | NEW DISCREPANCY | L91124 vs L91181–L91192 |
| 5a | 60 FAIL-AI rows | `grep -o 'FAIL-AI-[0-9]*' \| sort -u \| wc -l` = **60** distinct (FAIL-AI-01 … FAIL-AI-60), 214 total occurrences, first occurrence L89295 (ch. 42), last L90808 | CONFIRMED | L90051 heading "Sixty Modes in Six Families" |
| 5b | 18 tables across L90122–L90756 | **18 contiguous table blocks**; first begins L90122, last ends L90756 | CONFIRMED | L90122 / L90756 |
| 5c | family sizes 12/12/12/10/8/6 | **12/12/12/10/8/6** = 60. Verified by distinct-id count inside every one of the 18 tables | CONFIRMED | see table-by-table map below |
| 5d | each family carries three attribute tables of equal row count | CONFIRMED for all six families; the three headers repeat identically per family | CONFIRMED | L90122 / L90139 / L90156 (family 1) |
| 6 | 21-default response spine at L89935–L89960 | Lead-in L89924, items **1–21 at L89926–L89946**, count = **21**. Claimed span L89935–L89960 starts at item 10 and runs into the mermaid block (L89948–L89961) | CORRECTED | L89924 / L89926 / L89946 |
| 7a | open-values register, ten rows at L89995–L90006 | Header L89995, separator L89996, data **L89997–L90006 = 10 rows** | CONFIRMED (count); claimed start is the header | L89995 |
| 7b | the ten identifiers | All ten present, in the claimed order: DEC-AIRETRY-001 (L89997), DEC-AITIMEOUT-001 (L89998), DEC-AICB-001 (L89999), DEC-AIFAILOVER-001 (L90000), DEC-AIQUEUE-001 (L90001), DEC-AISTALE-001 (L90002), DEC-AICONF-001 (L90003), DEC-AIQUAR-001 (L90004), DEC-AIREPLAY-001 (L90005), DEC-AITOKEN-001 (L90006) | CONFIRMED | L89997–L90006 |
| 7c | register column headers | `ID / Value owed / Why it matters / Options / Recommendation / Trade-off / Decision owner` | MEASURED | L89995 |
| 8a | AC-43-111 "no AI capability can be enabled while any governing value is unset" | At **L90038**; source wording adds "in the open register" | CONFIRMED (paraphrase in claim; see quote) | L90038 |
| 8b | AC-43-112 "no value has a code-level default that would apply silently" | At **L90039**; source wording adds "in the open register" | CONFIRMED (paraphrase in claim) | L90039 |
| 8c | TEST-43-112 | At **L90045** | CONFIRMED | L90045 |
| 9a | AC-43-301 five-surface non-contradiction | At **L90840** (§43.3 intro, not a subsection) | CONFIRMED | L90840 |
| 9b | TEST-43-301 | At **L90845** | CONFIRMED | L90845 |
| 9c | AC-43-103 operational vs manufacturing severity | At **L89975** | CONFIRMED | L89975 |
| 9d | TEST-43-103 | At **L89981** | CONFIRMED | L89981 |
| 9e | four bands Critical/Major/Minor/Informational at "spine item 2, L89937" | Spine item 2 **Severity** is at **L89927**. L89937 is spine item 12 **Roles**. Four bands confirmed | CORRECTED (−10) | L89927 |
| 9f | AC-43-403 = "a PROV-1 element that cannot produce an agent run identifier renders PROV-6" | **NOT AC-43-403.** That text is **AC-42-403 at L89480**. `AC-43-403` at **L91373** reads about quarantine/failover/replay being marked beyond §8.7.1 | CORRECTED — wrong chapter; identifier collision 42 vs 43 | L89480 vs L91373 |
| 10a | §43.1 at L89880–L90050 | Heading L89880 `## 43.1 The Artificial-Intelligence Failure Contract`; runs to L90050, itself blank [cited-in-error: L90050] (L90049 `---`, next heading `## 43.2` at L90051) | CONFIRMED | L89880 |
| 10b | §43.4 at L91323–L91385 | Heading L91323 `## 43.4 Capabilities Beyond §8.7.1 — Correct Classification`; runs to L91385, itself blank [cited-in-error: L91385] (next heading `# 44.` at L91386) | CONFIRMED | L91323 |

### §43.2 table map (18 blocks, measured)

| Family | Section heading line | Table 1 (detection/message) | Table 2 (gate/retry/alternate/partial) | Table 3 (fallback ladder) | Data rows each | IDs |
|---|---|---|---|---|---|---|
| 43.2.1 Provider and model | L90100 | L90122–L90135 | L90139–L90152 | L90156–L90169 | 12 | 01–12 |
| 43.2.2 Orchestration and agent | L90227 | L90249–L90262 | L90266–L90279 | L90283–L90296 | 12 | 13–24 |
| 43.2.3 Retrieval, memory, content | L90351 | L90372–L90385 | L90389–L90402 | L90406–L90419 | 12 | 25–36 |
| 43.2.4 Governance, evaluation, gate | L90487 | L90507–L90518 | L90522–L90533 | L90537–L90548 | 10 | 37–46 |
| 43.2.5 Connectivity, device, sync | L90600 | L90621–L90630 | L90634–L90643 | L90647–L90656 | 8 | 47–54 |
| 43.2.6 Recovery, reconciliation, stale-state | L90706 | L90727–L90734 | L90738–L90745 | L90749–L90756 | 6 | 55–60 |

Block spans above are header→last-data-row inclusive; subtract 2 lines (header + separator) for data-row count.

## VERBATIM QUOTATIONS

### 1 — §43.3.5 authority matrix

L91280:
> **Authority matrix for the console's failure-response controls.**

L91282 (header row):
> | Control | Root Super Admin | Admin | Platform Engineer | Support | Classification |

Every data row's first cell, L91284–L91298 in order:

1. L91284 — `View incident, health, and queue telemetry`
2. L91285 — `Propose an engineering-class settings change`
3. L91286 — `Approve an engineering-class change`
4. L91287 — `Per-tenant emergency pause`
5. L91288 — `Platform-wide emergency pause`
6. L91289 — `Site-scoped pause`
7. L91290 — `Runaway-loop kill switch`
8. L91291 — `Provider or model failover`
9. L91292 — `Model quarantine`
10. L91293 — `Rollback of a model, atom, agent, or package version`
11. L91294 — `Safe replay`
12. L91295 — `All-tenant broadcast`
13. L91296 — `Read tenant operational content`
14. L91297 — `Resume a paused scope`
15. L91298 — `Close an incident`

Decisive last row, L91298 verbatim:
> | Close an incident | Allowed | Allowed | Allowed with conditions — only when reconciliation is complete | Explicitly prohibited | `Derived Clarification` |

### 2 — §43.3.2 header row

L90989:
> | Capability | Artificial intelligence healthy | Artificial intelligence failed | Classification |

First data row L90991:
> | Manual authoring of screens and limits | Allowed | Allowed | `SoW Fact — §5.4, §5.5` |

Last data row L91002:
> | Fallback-readiness validation | Allowed | Allowed | `Client Decision Required` under `DEC-AIFALLBACK-001` |

### 3 — §43.3.3 header row and first cells

L91080:
> | Command Center module | Behaviour during an artificial-intelligence failure | Classification |

First cells L91082–L91094: Live shift board; Sync state and connectivity; Run and exception drill-down; Deviation workspace and evidence review; Governance gate queue; Learned-change approvals; Feedback signal capture; Agent activity panel; Alert and escalation feed; Sync-conflict review panel; Standard reports and Custom Report Builder; Shift handoff panel; Operational actions, the closed set of ten. — 13 rows, no `MOD-CC-*` identifier present.

Decisive first data row, L91082 verbatim:
> | Live shift board | Allowed — deterministic, with freshness markers | `SoW Fact — §6.2, §6.3` |

### 4 — §43.3.4 header and the three connectivity-worded cells

L91179:
> | Frontline module | Behaviour during an artificial-intelligence failure | Classification |

L91188:
> | `MOD-FL-B8` Coaching Rendering | Cached read-only while offline — authored Work Instructions and packaged assets only | `SoW Fact — §7.12` |

L91190:
> | `MOD-FL-B10` Notifications | Queued while offline — creation local, delivery deferred | `SoW Fact — §7.14` |

L91192:
> | `MOD-FL-B12` Training Library Viewer | Unavailable — online only by design | `SoW Fact — §1.4 seam 12` |

Prose-vs-enumeration contradiction, L91124:
> **The thirteen required behaviours.**

and L91212:
> **Source classification and traceability.** All thirteen behaviours except number five and number eleven rest directly on `SoW Fact` as cited. Behaviour five is `Recommendation — R&D` under `DEC-AIDISCLOSE-001`. Behaviour eleven's health sheet is `Recommendation — R&D`. Behaviour ten is conditional on `DEC-AIHELP-001`. Storage-full behaviour remains `DEC-STORE-001`.

(The thirteen refers to the enumerated behaviour list at L91126–L91138; the behaviour matrix that follows carries twelve rows. Both numbers are correct for their own object, but any slice that treats the list and the matrix as the same enumeration will be off by one.)

### 5 — §43.2

L90051:
> ## 43.2 The Failure Catalog — Sixty Modes in Six Families

L90057:
> **Business purpose and reading instructions.** Each family below carries three compact tables: detection and message; gate, retry, alternate, and partial-output treatment; and the fallback ladder with recovery and reconciliation. Every row inherits the spine of section 43.1.1 for anything its tables do not override, and every row's five-surface behaviour is given once per surface in section 43.3.

L90122 (family-1 table-1 header, the widest header in the chapter, truncated by column count only — full row):
> | ID | Failure mode | Detection | Operational severity | Exact user-visible message, Frontline Worker Application | Exact user-visible message, tenant web surfaces |

L90139:
> | ID | Validation or confidence gate | Retry limit | Circuit breaker | Alternate provider or model | Partial-output treatment |

L90156:
> | ID | First fallback | Fallback of fallback | Terminal safe state | Recovery | Reconciliation |

### 6 — The twenty-one-default spine

L89924:
> **The spine, stated as twenty-one defaults inherited by every catalogued failure.**

Twenty-one items, L89926–L89946, first cell (bold lead) of each:

1. L89926 — **Detection.**
2. L89927 — **Severity.**
3. L89928 — **Exact user-visible message.**
4. L89929 — **Confidence or validation gate.**
5. L89930 — **Retry limit.**
6. L89931 — **Circuit breaker.**
7. L89932 — **Alternate provider or model.**
8. L89933 — **Deterministic fallback.**
9. L89934 — **Human fallback.**
10. L89935 — **Fallback of fallback.**
11. L89936 — **Terminal safe state.**
12. L89937 — **Roles.**
13. L89938 — **Five-surface behaviour.**
14. L89939 — **Partial-output treatment.**
15. L89940 — **Data preservation.**
16. L89941 — **Recovery.**
17. L89942 — **Reconciliation.**
18. L89943 — **Rollback.**
19. L89944 — **Audit.**
20. L89945 — **Monitoring.**
21. L89946 — **Acceptance tests.**

Decisive line — item 10, the first line of the claimed span, showing the claim began ten items late, L89935 verbatim:
> 10. **Fallback of fallback.** Deterministic no-artificial-intelligence mode, `AIMODE-07`.

### 7 — The open-values register

L89993:
> **The open register.**

L89995 (column headers, verbatim):
> | ID | Value owed | Why it matters | Options | Recommendation | Trade-off | Decision owner |

First data row L89997 verbatim:
> | `DEC-AIRETRY-001` | Retry limit and backoff for a failing model call | Too few retries wastes a recoverable call; too many delays the fallback past the moment coaching is useful | Fixed count; count with exponential backoff; deadline-based rather than count-based | Deadline-based, bounded by the coaching usefulness window, with jittered backoff inside it | A deadline is harder to reason about than a count in an incident | Client, advised by the platform team |

Last data row L90006 verbatim:
> | `DEC-AITOKEN-001` | Per-tenant token ceiling values and the behaviour at breach | The control is named in Model and Inference settings; no value or breach behaviour is stated, and the source notes token telemetry is the client's cost telemetry | Hard stop; soft throttle; throttle then stop with tenant notification | Throttle then stop with tenant notification, because a silent hard stop looks identical to an outage | Throttling degrades coaching quality before anyone is told | Client |

Corroborating prose, L90008 (the register's own count of itself):
> **Why no value is proposed as contractual.** Every one of the ten values above would, if written as a number in this blueprint, be quoted in a functional specification, then in a test plan, then in a service-level conversation. The canon forbids inventing a contractual value for a retry limit, timeout, queue limit, confidence threshold, or model expiry, and this section observes that prohibition strictly. Recommendations are given because the client needs a starting position; they are recommendations and are labelled as such.

### 8 — AC-43-111, AC-43-112, TEST-43-112

L90038:
> - `AC-43-111` — No artificial-intelligence capability can be enabled while any governing value in the open register is unset.

L90039:
> - `AC-43-112` — No value in the open register has a code-level default that would apply silently.

L90045:
> - `TEST-43-112` — Default-scan test asserting no hard-coded fallback value exists for any register entry.

(Related, same block, L90040 and L90044:)
> - `AC-43-113` — Every value in the register is rendered in the Super Admin platform console with its decision identifier.

> - `TEST-43-111` — Enablement-refusal test per capability with each governing value unset in turn.

### 9 — AC-43-301 / TEST-43-301, AC-43-103 / TEST-43-103, AC-43-403

L90840:
> - `AC-43-301` — During any catalogued failure, all five surfaces render a state drawn from the sixteen-mode vocabulary and no two surfaces contradict.

L90845:
> - `TEST-43-301` — Five-surface capture harness recording all five surfaces during each induced failure and asserting non-contradiction.

L89975:
> - `AC-43-103` — Operational severity and manufacturing severity are separate fields with separate vocabularies and never share a rendering component.

L89981:
> - `TEST-43-103` — Vocabulary-separation test asserting no code path maps an operational severity onto a manufacturing severity band.

The four bands — spine item 2, L89927 (NOT L89937), verbatim:
> 2. **Severity.** Operational severity is platform-side and distinct from the tenant-facing manufacturing severity catalog. Four bands are used in the catalog: **Critical** (tenant-visible loss of an artificial-intelligence capability across a surface), **Major** (degradation with a working fallback), **Minor** (self-healing within the retry budget), **Informational** (recorded, no user-visible effect). `Derived Clarification` — the source defines no operational severity scale, and reusing the manufacturing catalog for platform incidents would corrupt a quality-critical vocabulary.

Line the claim mistook for it, L89937 verbatim:
> 12. **Roles.** Detection and platform response belong to the client's platform team — Platform Engineer as maker, Admin as approver, root for critical class. [SoW Fact — §8.8.3] Tenant-side response belongs to the Supervisor for acknowledgement and reassignment, and to the Quality Manager for gate decisions, evidence review, and hold release. No platform role ever takes a tenant operational decision. [SoW Fact — §8, "Not in this console"]

The PROV-1 → PROV-6 fail-closed criterion is **AC-42-403**, L89480 verbatim:
> - `AC-42-403` — An element classified `PROV-1` that cannot produce an agent run identifier and a decision record fails closed to `PROV-6`.

Its test, L89487 verbatim:
> - `TEST-42-403` — Fail-closed test: null the agent run identifier on a delivered card and assert the surface renders `PROV-6`, not a silent `PROV-1` card.

The actual **AC-43-403**, L91373 verbatim:
> - `AC-43-403` — Model quarantine, provider failover policy, and safe replay are each explicitly marked as beyond §8.7.1.

### 10 — Section headings

L89880:
> ## 43.1 The Artificial-Intelligence Failure Contract

L89918:
> ### 43.1.1 The shared response spine

L89985:
> ### 43.1.2 Retry, timeout, and circuit-breaker values — the open register

L91323:
> ## 43.4 Capabilities Beyond §8.7.1 — Correct Classification

Chapter-43 heading inventory (measured):

| Line | Heading |
|---|---|
| 89813 | `# 43. Five-Surface Artificial-Intelligence Failure Architecture` |
| 89880 | `## 43.1 The Artificial-Intelligence Failure Contract` |
| 89918 | `### 43.1.1 The shared response spine` |
| 89985 | `### 43.1.2 Retry, timeout, and circuit-breaker values — the open register` |
| 90051 | `## 43.2 The Failure Catalog — Sixty Modes in Six Families` |
| 90100 | `### 43.2.1 Provider and model layer — FAIL-AI-01 to FAIL-AI-12` |
| 90227 | `### 43.2.2 Orchestration and agent layer — FAIL-AI-13 to FAIL-AI-24` |
| 90351 | `### 43.2.3 Retrieval, memory, and content layer — FAIL-AI-25 to FAIL-AI-36` |
| 90487 | `### 43.2.4 Governance, evaluation, and gate layer — FAIL-AI-37 to FAIL-AI-46` |
| 90600 | `### 43.2.5 Connectivity, device, and sync layer — FAIL-AI-47 to FAIL-AI-54` |
| 90706 | `### 43.2.6 Recovery, reconciliation, and stale-state layer — FAIL-AI-55 to FAIL-AI-60` |
| 90812 | `## 43.3 Five-Surface Artificial-Intelligence Failure Behaviour` |
| 90849 | `### 43.3.1 Delivery Operations Hub` |
| 90933 | `### 43.3.2 Standards and Operations Studio` |
| 91023 | `### 43.3.3 Client Command Center` |
| 91116 | `### 43.3.4 Frontline Worker Application` |
| 91214 | `### 43.3.5 Super Admin platform console` |
| 91323 | `## 43.4 Capabilities Beyond §8.7.1 — Correct Classification` |
| 91386 | `# 44. Agent-Specific Failure and Fallback Behavior` (chapter 43's last line, L91385, is blank [cited-in-error: L91385]) |

## SUMMARY OF DEFECTS TO CARRY INTO THE SLICE

1. **AC-43-403 is a wrong-chapter citation.** The PROV-1/PROV-6 fail-closed rule is AC-42-403 @ L89480. Citing AC-43-403 for it points at a scope-classification criterion @ L91373 instead.
2. **Spine item 2 is at L89927, not L89937.** Off by ten; L89937 is item 12 (Roles).
3. **The spine span L89935–L89960 is wrong by nine items and overruns into a mermaid block.** True span L89926–L89946.
4. **§43.3.4 cell lines are all +2 from the claim** (B8 L91188, B10 L91190, B12 L91192).
5. **§43.3.3 first column is module names, not MOD-CC-\* identifiers.**
6. **MOD-SA-07 is not attributed to the §43.3.5 matrix anywhere in chapter 43.**
7. **§43.3.4 says "thirteen behaviours" (13 enumerated, L91126–L91138) but its matrix has 12 rows** — two different objects, easy to conflate.
8. Everything measurable in §43.2 (60 modes, 18 tables, 12/12/12/10/8/6, L90122–L90756) is exactly as claimed.

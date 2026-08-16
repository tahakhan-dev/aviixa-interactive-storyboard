#!/usr/bin/env node
/**
 * Deterministic build-time generator for the fourteen
 * `registries/generated/<slug>.json` files (slice 2c, Tasks 6-7).
 *
 * Reads `registries/raw/identifier-index.json` (a flat, NAMELESS map of
 * every identifier to its source line locators -- see the doc comment on
 * `identifierOnlyRows` below) and every `registries/raw/extract/CHK-*.json`
 * chunk (slice 1's NAMED semantic extraction) in chunk order, which is also
 * frozen-source line order.
 *
 * COUNT-SCOPE DISCIPLINE (controller addendum, 2026-08-17, "the registry and
 * index work"): every file this script writes carries `rawCount` (what the
 * extraction actually found) separately from `reconciledCount` (the closed
 * number the frozen source fixes, or `null` when it fixes none) --
 * `sourceFixesNoTotal` is `true` exactly when `reconciledCount` is `null`.
 * No file here ever presents an extracted identifier count as a canonical
 * inventory total; where the two differ, `dedupRule` names the rule that
 * gets from one to the other. See `docs/`-adjacent
 * `.superpowers/sdd/2026-08-17-slice-02c-spec-closure/controller-addendum-registries.md`
 * for the measured derivation of every number below.
 *
 * CONSOLIDATION (fix round 1, defect 3): `registries/generated/workflow-
 * registry.json` and `scripts/build-workflow-registry.mjs` (the legacy
 * 432-row, id-only-deduped workflow registry) are RETIRED and deleted. Two
 * registries existed for one inventory -- `app/workflows/page.tsx` and
 * `app/coverage/page.tsx` read the legacy file, so Task 7's composite-key
 * fix (`registries/generated/workflows.json`, 724 rows) reached no screen.
 * `workflows.json`, produced here by `buildWorkflowsRegistry` below, is now
 * the ONE registry for this inventory; both app pages and every test read it
 * through `GeneratedRegistrySchema` (`@/coverage/registry-loader`), the same
 * as the other thirteen registries.
 *
 * Run with: node scripts/build-registries.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXTRACT_DIR = join(ROOT, 'registries', 'raw', 'extract')
const INDEX_FILE = join(ROOT, 'registries', 'raw', 'identifier-index.json')
const OUT_DIR = join(ROOT, 'registries', 'generated')

const chunkFiles = readdirSync(EXTRACT_DIR)
  .filter((f) => /^CHK-\d+\.json$/.test(f))
  .sort()
if (chunkFiles.length === 0) {
  throw new Error(`No CHK-*.json extraction chunks found under ${EXTRACT_DIR}`)
}
const chunks = chunkFiles.map((f) => JSON.parse(readFileSync(join(EXTRACT_DIR, f), 'utf8')))

/** registries/raw/identifier-index.json: flat `id -> line[]` map, no names. */
const identifierIndex = JSON.parse(readFileSync(INDEX_FILE, 'utf8'))

function sortById(rows) {
  return [...rows].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

function writeRegistry(registry) {
  const out = { ...registry, rows: sortById(registry.rows) }
  writeFileSync(join(OUT_DIR, `${out.slug}.json`), JSON.stringify(out, null, 2) + '\n')
  console.log(`Wrote ${out.rows.length} rows to ${out.slug}.json`)
  return out
}

function firstLine(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('identifier-index entry has no line locators')
  }
  return Math.min(...lines)
}

/**
 * `registries/raw/identifier-index.json` carries no names -- every row this
 * produces is `{ id, sourceLine, status }` and nothing else. Filters to ids
 * whose id STARTS WITH `prefix`; the identifier index has no other shape to
 * filter on.
 */
function idsWithPrefix(prefix) {
  return Object.entries(identifierIndex)
    .filter(([id]) => id.startsWith(prefix))
    .map(([id, lines]) => ({ id, sourceLine: firstLine(lines) }))
}

function buildIdentifierOnlyRegistry({
  slug,
  prefix,
  countedThing,
  dedupRule = null,
  reconciledCount = null,
  sourceFixesNoTotal = true,
}) {
  const rows = idsWithPrefix(prefix).map((r) => ({ ...r, status: 'not-represented' }))
  return {
    slug,
    countedThing,
    reconciledCount,
    rawCount: rows.length,
    dedupRule,
    sourceFixesNoTotal,
    rows,
  }
}

// ---------------------------------------------------------------------
// FUNC- / FEAT- / SUB-: identifier-index rows joined to a module band code
// or a surface code (controller addendum §3). Verified join coverage:
//   FUNC- 990 -> 181 module + 789 surface + 20 unjoinable
//   FEAT- 534 ->  56 module + 478 surface +  0 unjoinable
//   SUB-  526 ->  94 module + 432 surface +  0 unjoinable
// All twelve module band codes (A1-A7, B8-B12) are owned unambiguously by
// SURF-FL; the five bare surface codes (CC, DOH, FL, SA, STU) each own their
// own surface. An id whose second segment is neither is left unjoined and
// listed by id -- never dropped, never bucketed into a silent "other".
// ---------------------------------------------------------------------
const MODULE_BAND_CODES = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B8', 'B9', 'B10', 'B11', 'B12']
const SURFACE_CODES = ['CC', 'DOH', 'FL', 'SA', 'STU']

function joinToModuleOrSurface(id) {
  const seg2 = id.split('-')[1]
  if (MODULE_BAND_CODES.includes(seg2)) return { moduleId: `MOD-FL-${seg2}`, surface: 'SURF-FL' }
  if (SURFACE_CODES.includes(seg2)) return { surface: `SURF-${seg2}` }
  return {}
}

function buildJoinedFamily({ slug, prefix, familyLabel }) {
  const raw = idsWithPrefix(prefix)
  const rows = raw.map(({ id, sourceLine }) => ({
    id,
    sourceLine,
    status: 'not-represented',
    ...joinToModuleOrSurface(id),
  }))
  const unjoined = rows.filter((r) => !r.moduleId && !r.surface)
  return {
    slug,
    countedThing:
      `${familyLabel} identifiers (${prefix}*) from the identifier index (${rows.length} raw), ` +
      'each joined to its owning module band code or surface code where the id shape allows it. ' +
      'No names were extracted for this family in the frozen source.',
    reconciledCount: null,
    rawCount: rows.length,
    dedupRule:
      unjoined.length > 0
        ? `${unjoined.length} of ${rows.length} ${prefix}* ids have no reliable band or surface ` +
          `join (second segment not one of the twelve module bands or five surface codes) and are ` +
          `listed unjoined by id, never dropped: ${unjoined.map((r) => r.id).join(', ')}.`
        : `All ${rows.length} ${prefix}* ids joined to a module band or surface code; none unjoined.`,
    sourceFixesNoTotal: true,
    rows,
  }
}

// ---------------------------------------------------------------------
// Modules: semantic extraction, filtered to the 81 canonical MOD-* ids.
// Controller addendum §2 derivation, verified against this build's own raw
// data: 92 raw MOD-* keys -> 82 well-formed (excluding 6 placeholder/
// "unstated" keys and 4 range-expression artefacts) -> 81 canonical
// (excluding MOD-SA-20, an alias-by-denial for a diligence narrative the
// source explicitly says is not a module).
// ---------------------------------------------------------------------
const CANONICAL_MODULE_ID_RE = /^MOD-(DOH|CC|FL|SA|STU)-(\d{2}|[AB]\d+)$/

function buildModulesRegistry() {
  const rawKeys = new Set()
  const byId = new Map()
  for (const chunk of chunks) {
    for (const m of chunk.modules ?? []) {
      rawKeys.add(m.id)
      if (m.id === 'MOD-SA-20') continue // alias-by-denial; never a module
      if (!CANONICAL_MODULE_ID_RE.test(m.id)) continue // placeholder or range-expression artefact
      if (byId.has(m.id)) continue // first occurrence (chunk order) wins
      byId.set(m.id, {
        id: m.id,
        sourceLine: m.line,
        status: 'not-represented',
        label: m.name,
        surface: m.surface,
        purpose: m.purpose,
      })
    }
  }
  const rows = [...byId.values()]
  if (rows.length !== 81) {
    throw new Error(`Expected 81 canonical modules, computed ${rows.length}`)
  }
  return {
    slug: 'modules',
    countedThing:
      'canonical modules -- the 81-row inventory the frozen source fixes per surface ' +
      '(19 Super Admin + 19 Delivery Operations Hub + 18 Studio + 13 Command Center + ' +
      '12 Frontline), never the raw extraction key count.',
    reconciledCount: 81,
    rawCount: rawKeys.size,
    dedupRule:
      `${rawKeys.size} raw MOD-* keys across the 36 extraction chunks -> 82 well-formed ` +
      'identifiers (matching /^MOD-(DOH|CC|FL|SA|STU)-(\\d{2}|[AB]\\d+)$/), excluding 6 ' +
      'placeholder "unnumbered"/"unstated" keys and 4 range-expression artefacts ' +
      '("MOD-SA-01..MOD-SA-19" etc.) -> 81 canonical modules, excluding MOD-SA-20 -- an ' +
      'alias-by-denial for a diligence narrative the source explicitly says is not a module ' +
      '(source-reconciliation.json).',
    sourceFixesNoTotal: false,
    rows,
  }
}

// ---------------------------------------------------------------------
// Business objects: semantic extraction, filtered to numeric OBJ-NNN cards.
// The "objects" extraction category also captures mnemonic OBJ-* pointers
// (OBJ-SURFACE, OBJ-SSO, ...) and unrelated non-OBJ- entities (GRANT-*,
// IDENT-*, "unnumbered" placeholders); none of those are additional objects.
// ---------------------------------------------------------------------
const OBJECT_NUMERIC_ID_RE = /^OBJ-\d{3}$/

function buildBusinessObjectsRegistry() {
  const rawObjIds = new Set()
  const byId = new Map()
  for (const chunk of chunks) {
    for (const o of chunk.objects ?? []) {
      if (!o.id.startsWith('OBJ-')) continue
      rawObjIds.add(o.id)
      if (!OBJECT_NUMERIC_ID_RE.test(o.id)) continue
      if (byId.has(o.id)) continue
      byId.set(o.id, {
        id: o.id,
        sourceLine: o.line,
        status: 'not-represented',
        label: o.name,
        surface: o.authoritative_owner_surface,
      })
    }
  }
  const rows = [...byId.values()]
  if (rows.length !== 99) {
    throw new Error(`Expected 99 canonical business objects, computed ${rows.length}`)
  }
  return {
    slug: 'business-objects',
    countedThing:
      'canonical business object cards OBJ-001..OBJ-099 (Chapter 7), never the larger ' +
      'mnemonic OBJ-* identifier set.',
    reconciledCount: 99,
    rawCount: rawObjIds.size,
    dedupRule:
      `${rawObjIds.size} distinct OBJ-* identifiers extracted; only the ${rows.length} numeric ` +
      'OBJ-NNN cards are canonical objects -- the rest are mnemonic pointers into the same 99 ' +
      'concepts (e.g. OBJ-SURFACE, OBJ-SSO) and are not additional objects.',
    sourceFixesNoTotal: false,
    rows,
  }
}

// ---------------------------------------------------------------------
// Actionable controls (fix round 1): the SEMANTIC `controls[]` extraction
// category -- 759 raw entries, each carrying `label`/`surface`/`module_id`/
// `allowed_roles`/`effect`/`line` and NO `id` field at all -- is the real
// actionable-control catalogue, deduped by exact label text (first
// occurrence, chunk order, wins) to 608 distinct controls, matching spec
// §2.10. `DNC-*` (the do-not-use-cron register, 22, identifier-index only)
// is a real, separate, reconciled inventory -- scheduling policy, never an
// actionable control -- and is disclosed on the same index under its own
// `register` tag rather than occupying this slug's main count or being
// dropped for lack of a fifteenth slug to hold it.
// ---------------------------------------------------------------------
const ACTIONABLE_CONTROLS_REGISTER = 'actionable controls (surface action catalogue)'
const DO_NOT_USE_CRON_REGISTER = 'do-not-use-cron controls (DNC-01..DNC-22, scheduling policy)'

function buildActionableControlsRegistry() {
  const rawControls = []
  for (const chunk of chunks) {
    for (const c of chunk.controls ?? []) rawControls.push(c)
  }
  const byLabel = new Map()
  for (const c of rawControls) {
    if (byLabel.has(c.label)) continue // first occurrence (chunk order) wins
    byLabel.set(c.label, {
      id: c.label,
      sourceLine: c.line,
      status: 'not-represented',
      surface: c.surface,
      register: ACTIONABLE_CONTROLS_REGISTER,
    })
  }
  const controlRows = [...byLabel.values()]
  if (controlRows.length !== 608) {
    throw new Error(`Expected 608 distinct actionable controls, computed ${controlRows.length}`)
  }

  const dncRows = idsWithPrefix('DNC-').map((r) => ({
    ...r,
    status: 'not-represented',
    register: DO_NOT_USE_CRON_REGISTER,
  }))
  if (dncRows.length !== 22) {
    throw new Error(`Expected 22 DNC-* identifiers, found ${dncRows.length}`)
  }

  return {
    slug: 'actionable-controls',
    countedThing:
      '608 distinct actionable UI controls (labelled actions like "End-session", "Resolve ' +
      'All", "Request release with a note"), deduped by exact label text from 759 raw ' +
      'extraction entries -- matches spec §2.10. Also discloses, under its own register tag, ' +
      'the separate DNC-01..DNC-22 do-not-use-cron register (22): scheduling policy, never an ' +
      'actionable control, and never merged into this count.',
    reconciledCount: 608,
    rawCount: rawControls.length,
    dedupRule:
      `${rawControls.length} raw controls[] entries across the 36 extraction chunks deduped ` +
      'by exact label text (first occurrence, chunk order, wins) -> 608 distinct actionable ' +
      'controls, matching spec §2.10. Worst collapse: 14 raw entries sharing one label ' +
      '("Request release with a note"). DNC-01..DNC-22 (verified unique, zero delta) is a ' +
      'SEPARATE inventory -- scheduling policy, not an actionable control -- and is listed ' +
      `under the "${DO_NOT_USE_CRON_REGISTER}" register tag rather than mixed into this count.`,
    sourceFixesNoTotal: false,
    rows: [...controlRows, ...dncRows],
  }
}

// ---------------------------------------------------------------------
// AI storyboards (fix round 1): the SB-* namespace has 613 identifiers, not
// 48. Scoping this registry to SB-AI-* alone (the AI/fallback storyboard
// register, Chapter 44) silently dropped the other 565 -- the same defect
// named for the 20 unjoinable FUNC- ids: disclose what does not fit, never
// drop it. Every SB-* identifier renders, tagged with which of the four
// registers it belongs to (verified exhaustive and non-overlapping: 30 + 48
// + 490 + 45 = 613).
// ---------------------------------------------------------------------
function classifyStoryboardRegister(id) {
  if (/^SB-\d{3}$/.test(id)) return 'platform storyboard catalogue (SB-NNN, Chapter 30, 30 total)'
  if (id.startsWith('SB-AI-')) return 'AI / fallback storyboards (SB-AI-*, Chapter 44, 48 total)'
  if (id.split('-').length === 3) {
    return 'storyboard sub-panels and mnemonic identifiers (SB-*-NN, 3-segment, non-AI, 490 total)'
  }
  return 'further-nested storyboard identifiers (4-segment SB-*, 45 total)'
}

function buildAiStoryboardsRegistry() {
  const raw = idsWithPrefix('SB-')
  const rows = raw.map(({ id, sourceLine }) => ({
    id,
    sourceLine,
    status: 'not-represented',
    register: classifyStoryboardRegister(id),
  }))
  if (rows.length !== 613) {
    throw new Error(`Expected 613 SB-* identifiers, found ${rows.length}`)
  }
  const byRegister = new Map()
  for (const r of rows) byRegister.set(r.register, (byRegister.get(r.register) ?? 0) + 1)
  return {
    slug: 'ai-storyboards',
    countedThing:
      'every SB-* identifier in the identifier index (613), split across four separate, ' +
      'clearly labelled registers -- never scoped down to just one of them. No names were ' +
      'extracted for this family.',
    reconciledCount: null,
    rawCount: rows.length,
    dedupRule:
      'SB-* splits into four non-overlapping registers by id shape: ' +
      [...byRegister.entries()].map(([register, count]) => `${count} ${register}`).join('; ') +
      '. Two distinct thirty-item registers exist (SB-001..030 platform walkthroughs and ' +
      'SB-AI-01..30 AI storyboards) plus SB-031..033 and sub-panel/mnemonic overflow; the ' +
      'source does not fix one combined total across all four.',
    sourceFixesNoTotal: true,
    rows,
  }
}

// ---------------------------------------------------------------------
// Workflows: semantic extraction `workflows[]`, composite `id@line` keying
// (Task 7). See buildWorkflowsRegistry below.
// ---------------------------------------------------------------------
const PLACEHOLDER_WORKFLOW_IDS = new Set(['unnumbered', 'unstated'])

function collectRawWorkflows() {
  const raw = []
  for (const chunk of chunks) {
    for (const wf of chunk.workflows ?? []) raw.push(wf)
  }
  return raw
}

/**
 * Composite-key dedup (controller addendum §4; Task 7). Plain dedup-by-id
 * collapses 725 raw extraction entries to 432 rows, with 199 of them sharing
 * the literal id "unnumbered" and 66 sharing "unstated" -- silently folding
 * up to 199 genuinely distinct passages into one row.
 *
 * Key each row on `${id}@L${sourceLine}` when the id is a PLACEHOLDER
 * ("unnumbered" / "unstated") OR when the same id recurs at more than one
 * distinct source line; a real, unique id keeps its bare form. Measured
 * against this build's own raw data: 725 raw entries -> 724 composite keys,
 * worst residual collapse 2 (exactly one pair: two raw entries, one from
 * CHK-022 and one from CHK-023, both literally id "unnumbered" at the same
 * source line 74182 -- the same passage extracted twice, a real duplicate,
 * not a windowing artefact, since the 31 extraction windows never overlap).
 * `idIsPlaceholder` reports whether the ORIGINAL extractor id was a
 * placeholder, independent of the composite key now used as this row's id.
 */
function buildWorkflowsRegistry() {
  const raw = collectRawWorkflows()

  const linesById = new Map()
  for (const wf of raw) {
    if (!linesById.has(wf.id)) linesById.set(wf.id, new Set())
    linesById.get(wf.id).add(wf.line)
  }

  function keyFor(wf) {
    const needsComposite = PLACEHOLDER_WORKFLOW_IDS.has(wf.id) || linesById.get(wf.id).size > 1
    return needsComposite ? `${wf.id}@L${wf.line}` : wf.id
  }

  const keyCounts = new Map()
  for (const wf of raw) {
    const key = keyFor(wf)
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
  }

  const byKey = new Map()
  for (const wf of raw) {
    const key = keyFor(wf)
    if (byKey.has(key)) continue // first occurrence (chunk/line order) wins
    byKey.set(key, {
      id: key,
      sourceLine: wf.line,
      status: 'not-represented',
      label: wf.name,
      collapsedFrom: keyCounts.get(key) ?? 1,
      idIsPlaceholder: PLACEHOLDER_WORKFLOW_IDS.has(wf.id),
      // Fix round 2, §0: restored after consolidation onto the shared
      // GeneratedRegistrySchema silently flattened these away. Spec §7
      // requires them on the Workflow Index; Task 11's surface/actor
      // filters need them on the row to filter by at all.
      primaryActor: wf.primary_actor,
      trigger: wf.trigger,
      surfacesTouched: wf.surfaces_touched ?? [],
      terminalStates: wf.terminal_states ?? [],
    })
  }

  const rows = [...byKey.values()]
  const worstCollapse = Math.max(...rows.map((r) => r.collapsedFrom))
  if (rows.length !== 724 || worstCollapse > 5) {
    throw new Error(
      `Expected 724 composite-keyed workflow rows with worst collapse <= 5, ` +
        `computed ${rows.length} rows, worst collapse ${worstCollapse}`,
    )
  }

  return {
    slug: 'workflows',
    countedThing:
      'distinct extracted workflow-passage records from the 36 extraction chunks, composite-' +
      'keyed on id plus source line -- an extraction-scope count, never a workflow total (the ' +
      'source fixes none anywhere in its 122,241 lines; 81 is the MODULE count and nothing else).',
    reconciledCount: null,
    rawCount: raw.length,
    dedupRule:
      `${raw.length} extracted entries, 1 cross-chunk duplicate merged (both variants: ` +
      '"unnumbered" at line 74182 in CHK-022, "A role reading the audit log (6 steps)", and ' +
      '"unnumbered" at the same line in CHK-023, "A role reading the audit log" -- same line, ' +
      'same trigger, same actor, one workflow extracted twice) -> 724 rows, keyed on ' +
      '`${id}@L${sourceLine}` whenever the extractor id is a placeholder ("unnumbered"/' +
      '"unstated") or recurs at more than one source line. Worst residual collapse: 2.',
    sourceFixesNoTotal: true,
    rows,
  }
}

// ---------------------------------------------------------------------
// Build and write all fourteen.
// ---------------------------------------------------------------------
const registries = [
  buildModulesRegistry(),
  buildJoinedFamily({ slug: 'features', prefix: 'FEAT-', familyLabel: 'Feature' }),
  buildJoinedFamily({ slug: 'sub-features', prefix: 'SUB-', familyLabel: 'Sub-feature' }),
  buildJoinedFamily({ slug: 'functions', prefix: 'FUNC-', familyLabel: 'Function' }),
  buildWorkflowsRegistry(),
  buildIdentifierOnlyRegistry({
    slug: 'business-use-cases',
    prefix: 'UC-',
    countedThing:
      'UC-* identifiers found in the identifier index across every role-scoped use-case ' +
      'register (UC-WKR, UC-SUP, UC-TADM, UC-HO, UC-OFF, ...) -- not one closed count across ' +
      'roles. No names were extracted for this family. Includes the UC-OFF-* offline ' +
      'scenarios, which are also reported on their own below with their own reconciled count.',
  }),
  buildBusinessObjectsRegistry(),
  buildIdentifierOnlyRegistry({
    slug: 'events',
    prefix: 'EVT-',
    countedThing:
      'EVT-* identifiers found in the identifier index; no closed event-count register exists ' +
      'in the frozen source, and no names were extracted for this family.',
  }),
  buildIdentifierOnlyRegistry({
    slug: 'commands',
    prefix: 'CMD-',
    countedThing:
      'CMD-* identifiers found in the identifier index -- a different scope from the source\'s ' +
      '5 closed command classes or its 16-instance command catalogue. No names were extracted ' +
      'for this family.',
    dedupRule:
      'This registry counts CMD-* identifier strings only. The reconciled command-class count ' +
      '(5, closed at AC-PROD-051) and the 16-instance catalogue are separate registers and ' +
      'must not be summed with or substituted for this figure.',
  }),
  buildIdentifierOnlyRegistry({
    slug: 'notifications',
    prefix: 'NOTIF-',
    countedThing:
      'NOTIF-* identifiers found in the identifier index -- a different scope from the ' +
      "source's 19 notification states, 87 categories in 13 families, or 2 channels. No names " +
      'were extracted for this family.',
    dedupRule:
      'This registry counts NOTIF-* identifier strings only; the state, category and channel ' +
      'registers are separate and are not this number.',
  }),
  buildIdentifierOnlyRegistry({
    slug: 'offline-scenarios',
    prefix: 'UC-OFF-',
    countedThing:
      'the canonical offline use-case catalogue UC-OFF-001..UC-OFF-070, verified unique. No ' +
      'names were extracted for this family.',
    reconciledCount: 70,
    sourceFixesNoTotal: false,
    dedupRule:
      'UC-OFF-* identifiers only; 70 raw keys, all unique, zero delta from the canonical ' +
      'catalogue. The other OFF-* families (offline blockers, connectivity failure modes, ' +
      'offline events) are separate registers and are not included here.',
  }),
  buildAiStoryboardsRegistry(),
  buildIdentifierOnlyRegistry({
    slug: 'scheduled-work',
    prefix: 'SCHED-',
    countedThing:
      'SCHED-* identifiers found in the identifier index -- mixes the 35 numbered discovery ' +
      'findings (45A.2 sweep), the Appendix K schedule definitions, and carried-schedule ' +
      'identifiers, which the source keeps as separate registers with no single combined ' +
      'total. No names were extracted for this family.',
    dedupRule:
      'The source explicitly separates the 35 SCHED-0NN discovery findings from the 24 ' +
      "deployable obligations they cross-walk to, and states both counts are true at " +
      'different scopes (source-reconciliation.json, "Anchored timer rows / scheduled ' +
      'work"). This registry\'s raw count is neither of those two figures -- it is every ' +
      'SCHED-* identifier the extraction found, undifferentiated by sub-scope, and is not ' +
      'presented as a canonical scheduled-work total.',
  }),
  buildActionableControlsRegistry(),
]

if (registries.length !== 14) {
  throw new Error(`Expected 14 registries, built ${registries.length}`)
}

for (const registry of registries) writeRegistry(registry)

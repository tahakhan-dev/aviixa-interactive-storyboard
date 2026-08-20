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
 * SIBLING (spine direction fix): `scripts/build-doh-module-reach.mjs` writes
 * `registries/generated/doh/module-reach.json` and runs immediately after
 * this script, from the same `pnpm build:registries`. It is deliberately NOT
 * part of this file: it executes the module graph through `typescript`,
 * which costs ~350ms cold, and `tests/unit/registry-build.test.ts` spawns
 * THIS script inside a 5s budget while forty test files run in parallel --
 * measured, that cost made the spawn time out two runs in three. Two jobs,
 * two scripts, one npm script.
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
  const rows = idsWithPrefix(prefix).map((r) => ({ ...r, status: statusForId(r.id) }))
  return {
    slug,
    countedThing,
    reconciledCount,
    rawCount: rows.length,
    dedupRule: appendNote(dedupRule, statusNote(rows, CITED_BY_A_SHIPPED_SCREEN)),
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
    status: statusForId(id),
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
    dedupRule: appendNote(
      unjoined.length > 0
        ? `${unjoined.length} of ${rows.length} ${prefix}* ids have no reliable band or surface ` +
          `join (second segment not one of the twelve module bands or five surface codes) and are ` +
          `listed unjoined by id, never dropped: ${unjoined.map((r) => r.id).join(', ')}.`
        : `All ${rows.length} ${prefix}* ids joined to a module band or surface code; none unjoined.`,
      statusNote(rows, CITED_BY_A_SHIPPED_SCREEN),
    ),
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

/**
 * Task 10 / addendum §5: maps the raw extraction's seven-value
 * `classification` field (frozen-source vocabulary, see
 * `SOURCE_CLASSIFICATIONS` in `@/registry/schemas`) down to the five
 * `SourceClass` buckets (`@/coverage/descriptors`). Verified against this
 * build's own raw module data: only two classifications actually occur --
 * "SoW Fact" (63) and "Derived Clarification" (18, all MOD-STU-*) -- but
 * the other five are mapped too so this stays correct if a future
 * extraction wave adds a module under one of them.
 */
const SOURCE_CLASSIFICATION_TO_SOURCE_CLASS = {
  'SoW Fact': 'source-defined',
  'Derived Clarification': 'derived',
  'Derived Clarification — adopted working position': 'derived',
  'Recommendation — Research and Development': 'recommended',
  Assumption: 'unresolved',
  'Client Decision Required': 'unresolved',
  'Illustrative Example': 'illustrative',
}


/**
 * ONE pass over the shipped route tree, producing every piece of evidence the
 * fourteen status computations below rest on. Nothing here is a list: delete a
 * route directory and whatever it was the only evidence for falls back to
 * `not-represented` on the next build, which is the whole point.
 *
 * A "shipped route" is a directory under `app/` holding a `page.tsx`. Its own
 * `.ts`/`.tsx` files are read (never a nested route's -- a nested route owns
 * itself), and three things are taken from them:
 *
 *  - `ownedModuleIds` -- the module id a route names more often than any
 *    other. Ownership, not mention: several screens legitimately cross-
 *    reference a neighbouring module, and a naive "any id mentioned here"
 *    rule would mark a module demonstrated because someone linked to it. Ties
 *    throw rather than resolve by Map insertion order.
 *
 *  - `citedTokens` -- every identifier-shaped token a shipped screen names.
 *    This is the SAME evidence class the module rule uses (a `MOD-*` token in
 *    a route file), widened from one prefix to all of them, and it is what
 *    gives the other thirteen inventories a per-item status. A row is
 *    `demonstrated-in-storyboard` when a shipped screen names that EXACT id;
 *    no prefix match, no fuzzy match, no substring match -- "SB-030" does not
 *    demonstrate "SB-030@L61090", because the composite key exists precisely
 *    to say the source has two passages under that id and a bare citation
 *    cannot tell you which one a screen walks.
 *    KNOWN CEILING, disclosed rather than papered over: a screen that names
 *    an identifier in order to record that it does NOT act on it (a disputed
 *    workflow attribution, an absent control, a source conflict) is cited the
 *    same as one that renders it. This build carries no structural marker
 *    separating the two, so these counts are read as "named by a shipped
 *    screen", never as "rendered by one".
 *
 *  - `declaredControlLabels` -- the `control:` label of every control-matrix
 *    row a shipped screen declares. `actionable-controls` rows are keyed on
 *    frozen-source label TEXT (the source gives those actions no identifier),
 *    so a token scan cannot reach them and a substring scan is worse than
 *    useless: the 608 labels include "Add", "Next", "Return" and "Filter",
 *    which match dashboard chrome in `app/coverage` and `app/workflows` and
 *    would have inflated that inventory by dozens of rows that no module
 *    declares. Exact equality against a declared control-matrix label is the
 *    only honest join available, and it under-reports -- see the note that
 *    registry carries.
 */
function walkRouteTree() {
  const ownedModuleIds = new Set()
  const citedTokens = new Set()
  const declaredControlLabels = new Set()
  let declaresControlMatrix = false

  const walkDirs = (dir) => {
    // No silent catch. This walk deciding "nothing is demonstrated" is
    // indistinguishable, in the output, from a build where nothing IS
    // demonstrated -- and the 81/63/18 guards below pass either way. Running
    // this script from another cwd used to regenerate all nineteen SURF-SA
    // modules as `not-represented`, exit 0, no warning.
    const entries = readdirSync(dir, { withFileTypes: true })
    const hasPage = entries.some((e) => e.isFile() && e.name === 'page.tsx')
    if (hasPage) {
      const counts = new Map()
      for (const e of entries) {
        if (e.isDirectory()) continue // a nested route owns itself
        if (!/\.tsx?$/.test(e.name)) continue
        const text = readFileSync(join(dir, e.name), 'utf8')
        for (const id of text.match(/MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g) ?? []) {
          counts.set(id, (counts.get(id) ?? 0) + 1)
        }
        for (const token of text.match(/[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g) ?? []) {
          citedTokens.add(token)
        }
        if (text.includes('CONTROL_MATRIX')) declaresControlMatrix = true
        for (const m of text.matchAll(/\bcontrol:\s*(?:\r?\n\s*)?'((?:[^'\\]|\\.)*)'/g)) {
          declaredControlLabels.add(m[1].replace(/\\(.)/g, '$1'))
        }
      }
      const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
      if (ranked.length > 0) {
        // The comment used to assert "verified unambiguous (zero ties)" and
        // nothing enforced it, while three route directories sat one mention
        // from a flip. A tie would resolve by Map insertion order, silently
        // attributing a route to whichever module happened to be seen first.
        if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
          throw new Error(
            `Ambiguous module ownership for route ${dir}: ${ranked[0][0]} and ${ranked[1][0]} are both mentioned ${ranked[0][1]} times. A route must name its own module more often than any it cross-references.`,
          )
        }
        ownedModuleIds.add(ranked[0][0])
      }
    }
    for (const e of entries) if (e.isDirectory()) walkDirs(join(dir, e.name))
  }
  walkDirs(join(ROOT, 'app'))
  return { ownedModuleIds, citedTokens, declaredControlLabels, declaresControlMatrix }
}

const ROUTE_EVIDENCE = walkRouteTree()
const DEMONSTRATED_MODULE_IDS = ROUTE_EVIDENCE.ownedModuleIds

// A build that finds no shipped module is a broken walk, not an empty product:
// nineteen SURF-SA routes exist on disk. Failing here beats writing a coverage
// dashboard that quietly reports nothing is built.
if (DEMONSTRATED_MODULE_IDS.size === 0) {
  throw new Error(
    'No module route was found under app/. The route walk is broken -- refusing to write registries that would report every module as not-represented.',
  )
}

// Same refusal, extended to the evidence the other thirteen inventories now
// read. A route tree that yields no identifier token at all has not been read;
// twenty-seven module screens on disk cite hundreds. Writing thirteen files
// full of `not-represented` off a walk that read nothing is the exact defect
// this whole mechanism exists to remove.
if (ROUTE_EVIDENCE.citedTokens.size === 0) {
  throw new Error(
    'The route walk found no identifier token under app/ -- refusing to write registries whose per-item status would report every inventory as not-represented off a walk that read nothing.',
  )
}

// The control-label join has a second failure mode the token scan does not:
// it depends on the `control:` field convention holding in the module
// fixtures. A tree that still declares control matrices while this parser
// extracts no label from them is a broken parser, not a build with no
// controls -- and it would silently zero the one signal `actionable-controls`
// has.
if (ROUTE_EVIDENCE.declaresControlMatrix && ROUTE_EVIDENCE.declaredControlLabels.size === 0) {
  throw new Error(
    'Route screens declare a CONTROL_MATRIX but no `control:` label could be parsed from any of them -- refusing to write an actionable-controls registry whose status would read zero because the parser, not the tree, went empty.',
  )
}

/**
 * The one status rule the thirteen non-module inventories share: a shipped
 * route screen names this exact identifier. Derivable and re-derivable --
 * nothing is remembered between builds.
 */
function statusForId(id) {
  return ROUTE_EVIDENCE.citedTokens.has(id) ? 'demonstrated-in-storyboard' : 'not-represented'
}

/**
 * Every registry says, in the prose the registry index already renders, which
 * signal set its statuses and what that signal counted. A status nobody can
 * trace back to evidence is the same defect as a hardcoded zero.
 */
function statusNote(rows, signal) {
  const n = rows.filter((r) => r.status === 'demonstrated-in-storyboard').length
  return (
    `Status is computed from the built route tree, never from a list: ${n} of ${rows.length} rows ` +
    `read demonstrated-in-storyboard because ${signal}; every other row reads not-represented. ` +
    'Delete or rename the route that carries that evidence and those rows fall back on the next build.'
  )
}

const CITED_BY_A_SHIPPED_SCREEN =
  'a shipped route screen under app/ (a directory holding a page.tsx) names that exact ' +
  'identifier as a whole token -- the same evidence class the module rule above uses, widened ' +
  'from MOD-* to this family. Naming includes naming an identifier to record that the screen ' +
  'does NOT act on it, which this build has no structural marker to separate'

function appendNote(dedupRule, note) {
  return dedupRule === null ? note : `${dedupRule} ${note}`
}

function buildModulesRegistry() {
  const rawKeys = new Set()
  const byId = new Map()
  for (const chunk of chunks) {
    for (const m of chunk.modules ?? []) {
      rawKeys.add(m.id)
      if (m.id === 'MOD-SA-20') continue // alias-by-denial; never a module
      if (!CANONICAL_MODULE_ID_RE.test(m.id)) continue // placeholder or range-expression artefact
      if (byId.has(m.id)) continue // first occurrence (chunk order) wins
      const sourceClass = SOURCE_CLASSIFICATION_TO_SOURCE_CLASS[m.classification]
      if (sourceClass === undefined) {
        throw new Error(`Unmapped module classification "${m.classification}" for ${m.id}`)
      }
      byId.set(m.id, {
        id: m.id,
        sourceLine: m.line,
        status: DEMONSTRATED_MODULE_IDS.has(m.id) ? 'demonstrated-in-storyboard' : 'not-represented',
        label: m.name,
        surface: m.surface,
        purpose: m.purpose,
        sourceClass,
      })
    }
  }
  const rows = [...byId.values()]
  if (rows.length !== 81) {
    throw new Error(`Expected 81 canonical modules, computed ${rows.length}`)
  }
  const sourceDefinedCount = rows.filter((r) => r.sourceClass === 'source-defined').length
  const derivedCount = rows.filter((r) => r.sourceClass === 'derived').length
  if (sourceDefinedCount !== 63 || derivedCount !== 18) {
    throw new Error(
      `Addendum §5: expected 63 source-defined + 18 derived modules, computed ` +
        `${sourceDefinedCount} + ${derivedCount}`,
    )
  }
  return {
    slug: 'modules',
    countedThing:
      'canonical modules -- the 81-row inventory the frozen source fixes per surface ' +
      '(19 Super Admin + 19 Delivery Operations Hub + 18 Studio + 13 Command Center + ' +
      '12 Frontline), never the raw extraction key count. 63 source-defined + 18 derived ' +
      '(DEC-STUDIO-001) = 81; the 18 Studio modules may never be presented as source-backed.',
    reconciledCount: 81,
    rawCount: rawKeys.size,
    dedupRule: appendNote(
      `${rawKeys.size} raw MOD-* keys across the 36 extraction chunks -> 82 well-formed ` +
        'identifiers (matching /^MOD-(DOH|CC|FL|SA|STU)-(\\d{2}|[AB]\\d+)$/), excluding 6 ' +
        'placeholder "unnumbered"/"unstated" keys and 4 range-expression artefacts ' +
        '("MOD-SA-01..MOD-SA-19" etc.) -> 81 canonical modules, excluding MOD-SA-20 -- an ' +
        'alias-by-denial for a diligence narrative the source explicitly says is not a module ' +
        '(source-reconciliation.json).',
      statusNote(
        rows,
        'a shipped route directory under app/ names that module id more often than any other ' +
          'module id it mentions -- ownership, not mention, so a screen cross-referencing a ' +
          'neighbour does not demonstrate it, and a tie throws rather than resolving silently',
      ),
    ),
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
        status: statusForId(o.id),
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
    dedupRule: appendNote(
      `${rawObjIds.size} distinct OBJ-* identifiers extracted; only the ${rows.length} numeric ` +
        'OBJ-NNN cards are canonical objects -- the rest are mnemonic pointers into the same 99 ' +
        'concepts (e.g. OBJ-SURFACE, OBJ-SSO) and are not additional objects.',
      statusNote(
        rows,
        `${CITED_BY_A_SHIPPED_SCREEN}. Only the numeric OBJ-NNN card id counts here: the built ` +
          'screens overwhelmingly cite the mnemonic pointers (OBJ-SA-SESSION, OBJ-DOH-SHIFT) ' +
          'into the same concepts, and the source publishes no mnemonic-to-card mapping to join ' +
          'them on without inventing one',
      ),
    ),
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
      // Minor (final review): `label` was never set, only `id` -- every
      // row rendered its label text under "ID" and an em dash under
      // "Name". The label IS the id here (the source gives these actions
      // no other identifier), so both fields carry it.
      label: c.label,
      sourceLine: c.line,
      // The only honest join available for a row whose id IS free text: a
      // shipped screen declares a control-matrix row whose `control:` label
      // is exactly this label. See `walkRouteTree` for why substring
      // matching was rejected outright.
      status: ROUTE_EVIDENCE.declaredControlLabels.has(c.label)
        ? 'demonstrated-in-storyboard'
        : 'not-represented',
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
    status: statusForId(r.id),
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
    dedupRule: appendNote(
      `${rawControls.length} raw controls[] entries across the 36 extraction chunks deduped ` +
        'by exact label text (first occurrence, chunk order, wins) -> 608 distinct actionable ' +
        'controls, matching spec §2.10. Worst collapse: 14 raw entries sharing one label ' +
        '("Request release with a note"). DNC-01..DNC-22 (verified unique, zero delta) is a ' +
        'SEPARATE inventory -- scheduling policy, not an actionable control -- and is listed ' +
        `under the "${DO_NOT_USE_CRON_REGISTER}" register tag rather than mixed into this count.`,
      statusNote(
        [...controlRows, ...dncRows],
        'a shipped route screen declares a control-matrix row whose `control:` label is EXACTLY ' +
          'this source label (the 608 control rows), or names the identifier as a whole token ' +
          `(the DNC-* rows). This is the weakest of the fourteen signals and says so: the built ` +
          `screens declare ${ROUTE_EVIDENCE.declaredControlLabels.size} control-matrix labels, of ` +
          `which ${[...ROUTE_EVIDENCE.declaredControlLabels].filter((l) => byLabel.has(l)).length} ` +
          'are word-for-word a source label and the rest are the same control re-worded for a ' +
          'reader. The frozen source gives these actions no identifier -- the label IS the key -- ' +
          'so there is nothing else to join on, and a looser match was rejected: the 608 labels ' +
          'include "Add", "Next", "Return" and "Filter", which occur in unrelated prose and ' +
          'chrome across the tree and would have inflated this number by dozens. Read this ' +
          'figure as "controls the build labelled identically to the source", never as "controls ' +
          'the build demonstrates"',
      ),
    ),
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
    status: statusForId(id),
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
    dedupRule: appendNote(
      'SB-* splits into four non-overlapping registers by id shape: ' +
        [...byRegister.entries()].map(([register, count]) => `${count} ${register}`).join('; ') +
        '. Two distinct thirty-item registers exist (SB-001..030 platform walkthroughs and ' +
        'SB-AI-01..30 AI storyboards) plus SB-031..033 and sub-panel/mnemonic overflow; the ' +
        'source does not fix one combined total across all four.',
      statusNote(
        rows,
        `${CITED_BY_A_SHIPPED_SCREEN}. Per register: ` +
          [...byRegister.keys()]
            .map(
              (register) =>
                `${rows.filter((r) => r.register === register && r.status === 'demonstrated-in-storyboard').length} of ` +
                `${byRegister.get(register)} in the ${register}`,
            )
            .join('; '),
      ),
    ),
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
      status: statusForId(key),
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
    dedupRule: appendNote(
      `${raw.length} extracted entries, 1 cross-chunk duplicate merged (both variants: ` +
        '"unnumbered" at line 74182 in CHK-022, "A role reading the audit log (6 steps)", and ' +
        '"unnumbered" at the same line in CHK-023, "A role reading the audit log" -- same line, ' +
        'same trigger, same actor, one workflow extracted twice) -> 724 rows, keyed on ' +
        '`${id}@L${sourceLine}` whenever the extractor id is a placeholder ("unnumbered"/' +
        '"unstated") or recurs at more than one source line. Worst residual collapse: 2.',
      statusNote(
        rows,
        `${CITED_BY_A_SHIPPED_SCREEN}. The composite key is matched whole: a screen naming ` +
          '"SB-030" does not demonstrate "SB-030@L61090", because the composite key exists to ' +
          'say the source carries more than one passage under that id and a bare citation ' +
          `cannot say which. The ${rows.filter((r) => !/^[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+$/.test(r.id)).length} ` +
          'composite-keyed and placeholder-named rows carry no citable identifier at all, so ' +
          'this count under-reports rather than guessing',
      ),
    ),
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

// The last extension of the refusal, and the one that covers a mechanism
// failing rather than a walk failing. Twenty-seven module screens ship. If
// every one of the fourteen inventories computed zero demonstrated rows, the
// status mechanism itself is broken -- a regex that stopped matching, a field
// renamed, a path changed -- and the fourteen files would go out saying this
// build demonstrates nothing. That is the measurement-read-as-fact this whole
// change exists to stop, so it fails before anything is written.
const demonstratedByRegistry = registries.map((r) => [
  r.slug,
  r.rows.filter((row) => row.status === 'demonstrated-in-storyboard').length,
])
if (demonstratedByRegistry.every(([, n]) => n === 0)) {
  throw new Error(
    'Every one of the fourteen registries computed zero demonstrated rows while app/ ships module routes. The status mechanism is broken -- refusing to write registries that would report this build as demonstrating nothing.',
  )
}

for (const registry of registries) writeRegistry(registry)
console.log(
  'Demonstrated-in-storyboard rows: ' +
    demonstratedByRegistry.map(([slug, n]) => `${slug} ${n}`).join(', '),
)

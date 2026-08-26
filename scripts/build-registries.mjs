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
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * R5-A02. The ONE comment stripper this repository has, reused rather than
 * re-implemented: three hand-rolled tokenizers were defeated in three
 * different ways before it was rewritten on the TypeScript parser, and a
 * second copy here would be a fourth. Node strips the type annotations off
 * this import itself, so no build step is added.
 */
import { stripComments } from '../tests/coverage/strip-comments.ts'
/** R5-A07: the control-label scan asks the parser what a `control:` is. */
import ts from 'typescript'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const EXTRACT_DIR = join(ROOT, 'registries', 'raw', 'extract')
const INDEX_FILE = join(ROOT, 'registries', 'raw', 'identifier-index.json')
// A caller may redirect the whole output tree with AVIIXA_REGISTRY_OUT.
// This exists so a determinism check can generate somewhere harmless and
// compare, instead of overwriting the committed artefacts to check them --
// which is how a freshness assertion becomes self-healing.
const OUT_DIR = process.env.AVIIXA_REGISTRY_OUT ?? join(ROOT, 'registries', 'generated')

mkdirSync(OUT_DIR, { recursive: true })

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

/**
 * WHAT `sourceLine` ACTUALLY HOLDS, SAID IN THE ARTEFACT ITSELF.
 *
 * It is `Math.min(...)` over the identifier index's line list — **the first
 * mention of the identifier anywhere in the frozen source, not the line that
 * defines it.** The name implies a definition and the value is not one.
 *
 * Measured on one sample of thirty offline use-case rows, **eighteen point at
 * a group table, a diagram-reuse paragraph, or a neighbouring entry**:
 * `UC-OFF-070`'s reads L81212, which is the reuse rule, and `UC-OFF-059`'s
 * reads L81651, which is `UC-OFF-058`'s entry.
 *
 * This is not a wrong citation in the sense `locator-fidelity` catches — the
 * line exists and does mention the identifier — but a reader who follows it
 * lands somewhere that does not define what they looked up, and the coverage
 * pages put this number in front of a client.
 *
 * NOT FIXED BY RENAMING THE FIELD, and that is a deliberate call rather than
 * deferral: `sourceLine` appears 549 times across this tree and almost all of
 * them are modules' own hand-verified locators, which are a different and
 * stronger thing. A sweeping rename would cross into files other tasks own and
 * would blur the one distinction worth keeping — a module's `sourceLine` was
 * opened and read; a registry's was computed from an index.
 *
 * Fixed instead where a reader meets it: every generated registry now states
 * what its own number is.
 *
 * ── AND THE SENTENCE ITSELF WAS WRONG, FOR A ROW IT NAMED (round 1, item 2) ─
 * The published text said the value IS `Math.min` over the identifier index's
 * line list, with no exception. `ai-storyboards.json` contradicts it: after the
 * C-29 fix `SB-AI-01` ships `92693`, not the list minimum `74479`, because a
 * BANDED register takes the first occurrence inside its own chapter rather than
 * the first occurrence anywhere — that being the whole point of the fix, since
 * L74479 is chapter 30D's Command Center panel and the row belongs to §44A.
 * One row of 613, and the artefact was describing itself wrongly for it.
 *
 * A SECOND CLASS OF ROW WAS ALSO MISDESCRIBED, and it is much larger than one
 * row: `modules`, `business-objects`, `actionable-controls`, `workflows`, the
 * `notifications` placement rows, the Studio trigger rows and the deployable
 * half of `scheduled-work` take `sourceLine` from the EXTRACTION RECORD's own
 * line (`m.line`, `o.line`, `c.line`, `wf.line`, `t.line`, `d.line`) or from a
 * chapter-body minimum, never from the identifier index at all. Checked one by
 * one rather than assumed: `events` and `commands` DO use the index minimum,
 * because they are `buildIdentifierOnlyRegistry` calls. So the fix is not a
 * carve-out for one registry: the
 * sentence now states the general contract — a line that mentions the
 * identifier, a starting point and not a definition — and names all three ways
 * it is computed, so no registry publishes a claim its own rows break.
 *
 * `tests/unit/registry-build.test.ts` requires the phrases `FIRST MENTION` and
 * `NOT necessarily the line that defines` to survive any rewording; both do,
 * and both are still true of the default computation.
 */
const SOURCE_LINE_MEANING =
  'A frozen-source line that MENTIONS the identifier, published so a reader can open it. It is ' +
  'NOT necessarily the line that defines the identifier: a group table, a diagram, or a ' +
  'neighbouring entry that cross-references it will often come first. Follow it as a starting ' +
  'point, not as a definition. It is computed one of three ways, and which one depends on the ' +
  'register the row came from. (1) By default, the FIRST MENTION of the identifier anywhere in ' +
  'the frozen source — the minimum of registries/raw/identifier-index.json\'s line list for ' +
  'that id. (2) Where the row belongs to a CHAPTER-BANDED register, the first occurrence inside ' +
  'that register\'s own chapter, which is deliberately NOT the minimum of the list: SB-AI-01 in ' +
  'ai-storyboards.json ships L92693 and not its list minimum L74479, because L74479 is chapter ' +
  '30D and the row belongs to section 44A. A register label that claims a chapter is asserted ' +
  'against every one of its rows at build time, so a row outside its band is a build failure. ' +
  '(3) Where a register was TRANSCRIBED by the extraction rather than derived from the ' +
  'identifier index — modules, business objects, actionable controls, workflows, the ' +
  'notification placement rows, the Studio triggers and the deployable scheduled-work rows — ' +
  'the line the extraction recorded for that row. Where a module in src/ carries its own ' +
  'locator for the same identifier, that one ' +
  'was opened and read against the source and is the stronger citation.'

/* ====================================================================
 * R4-B05 / R4-B12 — THE TWO TERMINAL STATUSES THE GENERATOR COULD NOT EMIT.
 *
 * Master prompt §13.1 closes the actionable-item census both ways: zero
 * rendered controls outside the census, and zero census rows without either a
 * rendered control or an explicit decision-blocked / not-applicable record.
 * Neither string occurred anywhere in this file, so the second half was
 * unreachable by construction — 4,704 of 5,018 rows sat in `not-represented`,
 * which is neither of the two terminal states the section permits, and no
 * amount of authoring could have moved one.
 *
 * The record is authored rather than derived, because a terminal status is a
 * judgement about the source and not something the route tree can compute.
 * `registries/authored/census-status-overrides.json` holds it, and master
 * prompt §9.2 fixes what it must carry: a `Not applicable` classification
 * without reason, owner and source/decision evidence is a validator failure,
 * so all three are required here and a record missing any of them throws.
 *
 * TWO GUARDS, BOTH AGAINST THIS MECHANISM BEING USED TO MOVE A NUMBER:
 *
 *   1. An override may only be applied to a row whose DERIVED status is
 *      `not-represented`. Overriding a demonstrated row would hide real
 *      evidence behind an authored sentence.
 *   2. An override naming a row no registry holds throws. A record that
 *      matches nothing is how a population silently empties, which is the
 *      round-3 shape this build already paid for once.
 *
 * What it does NOT do is make the not-represented count small. After this
 * file the count moves by 22 rows out of 4,704, and the coverage dashboard
 * publishes both figures side by side.
 * ==================================================================== */
const OVERRIDE_FILE = join(ROOT, 'registries', 'authored', 'census-status-overrides.json')
const AUTHORED_OVERRIDE_STATUSES = ['decision-blocked', 'not-applicable']

/** `"<registry-slug> <row id>" -> the authored record`, validated on load. */
const CENSUS_OVERRIDES = (() => {
  const raw = JSON.parse(readFileSync(OVERRIDE_FILE, 'utf8'))
  const byKey = new Map()
  if (!Array.isArray(raw.overrides)) {
    throw new Error(`${OVERRIDE_FILE} has no overrides array.`)
  }
  for (const record of raw.overrides) {
    const where = `${OVERRIDE_FILE} record for ${record.registry}`
    if (!AUTHORED_OVERRIDE_STATUSES.includes(record.status)) {
      throw new Error(
        `${where}: status "${record.status}" is not one of ${AUTHORED_OVERRIDE_STATUSES.join(' / ')}. ` +
          'An authored override may only record one of master prompt §13.1\'s two terminal ' +
          'states; the other three are derived from the built route tree and may not be typed.',
      )
    }
    // Master prompt §9.2: reason, owner and source/decision evidence, all
    // three, or the classification does not stand.
    /* ────────────────────────────────────────────────────────────────────
     * R5-A06: THE WHOLE CITED LINE, NOT A SENTENCE CHOSEN OUT OF IT.
     *
     * The one override in this file quotes line 98508's third sentence,
     * which supports the classification, and that line's FIRST sentence
     * describes a Super Admin screen where all 22 rows render. Nothing could
     * see it: the check asked only whether the quotation is on the line.
     * `evidenceLineVerbatim` must now carry the entire line (compared
     * byte-for-byte against the frozen source by
     * tests/coverage/census-closure.test.ts) and `whatElseThisLineSays`
     * must answer whatever else is on it. A short excerpt of a long line can
     * support almost any classification; a transcription of the whole line
     * puts the counter-evidence in the record and in the diff.
     * ──────────────────────────────────────────────────────────────────── */
    for (const [field, min] of [
      ['reason', 80],
      ['owner', 20],
      ['evidenceQuote', 20],
      ['evidenceLineVerbatim', 20],
      ['whatElseThisLineSays', 80],
    ]) {
      if (typeof record[field] !== 'string' || record[field].trim().length < min) {
        throw new Error(
          `${where}: "${field}" must be at least ${min} characters. Master prompt §9.2 fails a ` +
            'Not applicable classification that carries no reason, owner and source evidence.',
        )
      }
    }
    if (!Number.isInteger(record.evidenceLine) || record.evidenceLine <= 0) {
      throw new Error(`${where}: "evidenceLine" must be a positive frozen-source line number.`)
    }
    if (!Array.isArray(record.ids) || record.ids.length === 0) {
      throw new Error(`${where}: "ids" must name at least one census row.`)
    }
    for (const id of record.ids) {
      const key = `${record.registry} ${id}`
      if (byKey.has(key)) throw new Error(`${where}: ${id} is overridden twice.`)
      byKey.set(key, record)
    }
  }
  return byKey
})()

/** Every override key an actual row consumed, so an unmatched record throws. */
const OVERRIDES_APPLIED = new Set()

/**
 * Applies any authored override to `rows` in place of the derived status, and
 * records WHY in `statusReason` so the row carries its own justification into
 * the artefact rather than pointing at a file the reader has to find.
 */
function applyCensusOverrides(slug, rows) {
  return rows.map((row) => {
    const key = `${slug} ${row.id}`
    const override = CENSUS_OVERRIDES.get(key)
    if (override === undefined) return row
    if (row.status !== 'not-represented') {
      throw new Error(
        `Authored override for ${slug}/${row.id} would replace a derived status of ` +
          `"${row.status}". An override may only record a terminal state for a row nothing ` +
          'demonstrates; overriding derived evidence hides it behind a sentence.',
      )
    }
    OVERRIDES_APPLIED.add(key)
    return {
      ...row,
      status: override.status,
      statusReason:
        `${override.reason} Recorded as an authored ${override.status} census record in ` +
        `registries/authored/census-status-overrides.json. Owner: ${override.owner} Evidence, ` +
        `frozen source line ${override.evidenceLine}: "${override.evidenceQuote}" ` +
        // R5-A06: the rest of the cited line travels with the quotation, so a
        // reader of the row sees what the record had to answer rather than
        // only the sentence that supports it.
        `What else that line says: ${override.whatElseThisLineSays}`,
    }
  })
}

/* ====================================================================
 * R4-B10 — THE ROUTE THAT MADE A ROW `demonstrated`, PUT ON THE ROW.
 *
 * Fourteen index screens rendered 5,018 rows with zero in-row links, so a
 * reader shown "demonstrated in storyboard" had no way to reach the screen
 * that demonstrates it. Master prompt §9.6 requires each index to drill into
 * the item's card, and no per-item route exists or can exist: a second
 * dynamic segment is refused by `tests/coverage/static-export.test.ts`,
 * correctly, because master prompt §4.2 requires a finite build-time route
 * inventory.
 *
 * The resolvable half needs no new route at all. The evidence that set the
 * status already names a directory -- a slug claim, an argmax award, or the
 * route file that spells the identifier -- and this generator was discarding
 * it one line after computing it. So the row carries the route it was
 * demonstrated BY, and the index renders the id as a link to that screen.
 *
 * A row nothing resolves carries no `route` and the index says so in the row
 * rather than rendering a dead id -- master prompt §13 forbids a control that
 * does nothing, and a link to nowhere is one.
 *
 * A DIRECTORY WITH A DYNAMIC SEGMENT RESOLVES TO NOTHING, deliberately.
 * `app/coverage/[registry]` is one route directory standing for fourteen
 * URLs; picking one of them for a row would be a guess dressed as evidence.
 * ==================================================================== */
function routeUrlFor(relDir) {
  if (typeof relDir !== 'string' || relDir === '') return null
  const segments = relDir.split(/[\\/]/)
  if (segments[0] !== 'app') return null
  const rest = segments
    .slice(1)
    // Next.js route groups contribute no URL segment.
    .filter((s) => !(s.startsWith('(') && s.endsWith(')')))
  if (rest.some((s) => s.includes('[') || s.includes(']'))) return null
  return `/${rest.map((s) => `${s}/`).join('')}`
}

/**
 * `MOD-* -> route directory`, slug claim first because it is the stronger
 * evidence: the module DECLARED the route, where argmax only counted
 * mentions. Both maps are built above this point.
 */
function moduleRouteDir(id) {
  return SLUG_DEMONSTRATED.get(id) ?? ARGMAX_DEMONSTRATED.get(id) ?? null
}

function resolveRowRoute(slug, row) {
  if (slug === 'modules') return routeUrlFor(moduleRouteDir(row.id))
  if (slug === 'actionable-controls') {
    return routeUrlFor(ROUTE_EVIDENCE.controlLabelRoutes.get(row.id) ?? null)
  }
  return routeUrlFor(ROUTE_EVIDENCE.citedTokenRoutes.get(row.id) ?? null)
}

function writeRegistry(registry) {
  const withRoutes = applyCensusOverrides(registry.slug, registry.rows).map((row) => {
    const route = resolveRowRoute(registry.slug, row)
    return route === null ? row : { ...row, route }
  })
  const rows = sortById(withRoutes)
  const out = {
    ...registry,
    sourceLineMeaning: SOURCE_LINE_MEANING,
    namedInSourceCount: namedInSourceCount(rows),
    /**
     * R4-B10. How many rows carry a `route`, and what the absence means on
     * the rest, published in the artefact so the index can say it rather
     * than a reader inferring it from a column of em dashes.
     */
    routeResolvedCount: rows.filter((r) => r.route !== undefined).length,
    routeMeaning:
      'The shipped screen whose evidence set this row\'s status: for a module, the route ' +
      'directory its declared slug names or the one whose files name it more often than any ' +
      'other module; for an actionable control, the route directory declaring a control-matrix ' +
      'row with exactly this label; for every other inventory, the route directory that spells ' +
      'this identifier as a whole token. Where several routes qualify, the lexicographically ' +
      'first is recorded, so two independent generations agree. A row carries no route when no ' +
      'route demonstrates it, when the evidence was an import rather than a route file ' +
      '(mounted-in-another-screen), when the row is an authored not-applicable or ' +
      'decision-blocked record, when the only directory found holds a dynamic segment -- ' +
      'app/coverage/[registry] is one directory standing for fourteen URLs and choosing one of ' +
      'them for a row would be a guess -- or, and this is the fifth case and the one the list ' +
      'used to omit, when the evidence is a control matrix declared in a module component under ' +
      'src/ that a route mounts: the row reads demonstrated-in-storyboard and route resolution ' +
      'reads app/ only, so there is no route directory to name. Those rows render their id as ' +
      'plain text with the reason beside it, never as a link to nowhere.',
    namedInSourceMeaning:
      'How many rows this registry holds whose identifier is named anywhere under src/ or app/. ' +
      'It is WEAKER than a status and deliberately not one: a status says a route screen ' +
      'demonstrates the row, and this says only that some file in the build spells its ' +
      'identifier. It is published because the two numbers can differ by a lot -- ' +
      'offline-scenarios reads 0 demonstrated and 70 named, because two tasks transcribed all ' +
      'seventy use cases and no route names a UC-OFF-* identifier. Rows whose id is a free-text ' +
      'label rather than an identifier (actionable-controls) cannot be counted this way and read ' +
      'as unnamed here; that is a limit of the measure, not a gap in the build.',
    rows,
  }
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
  return idsWithPrefixRaw(prefix).map(([id, lines]) => ({ id, sourceLine: firstLine(lines) }))
}

/**
 * The same filter, keeping the WHOLE locator list rather than collapsing it
 * to its minimum. `buildNotificationIdentifierRows` needs every locator,
 * because which register a `NOTIF-NNN` row belongs to is decided by WHICH of
 * its locators falls inside which chapter body — a question `firstLine`
 * destroys the answer to.
 */
function idsWithPrefixRaw(prefix) {
  return Object.entries(identifierIndex).filter(([id]) => id.startsWith(prefix))
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

function buildJoinedFamily({ slug, prefix, familyLabel, extraNote = null }) {
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
      extraNote === null
        ? statusNote(rows, CITED_BY_A_SHIPPED_SCREEN)
        : appendNote(statusNote(rows, CITED_BY_A_SHIPPED_SCREEN), extraNote()),
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
 * Task 10 / addendum §5: maps the raw extraction's `classification` field
 * down to the five `SourceClass` buckets (`@/coverage/descriptors`). The
 * keys are the frozen source's own classification legend, whose seven rows
 * are `SoW Fact`, `Derived Clarification`, `Recommendation — R&D`,
 * `Assumption`, `Client Decision Required`, `Illustrative Example` and
 * `User-Mandated Product Extension`. The eighth key below is not a legend
 * row: `Derived Clarification — adopted working position` is a qualified
 * form the source also writes, and it is kept because the raw extraction
 * carries it.
 *
 * SLICE 10 TASK 13 — TWO KEYS WERE WRONG ABOUT THE SOURCE IN BOTH
 * DIRECTIONS, AND THE COMMENT HERE ASSERTED THE OPPOSITE.
 * It used to read "the other five are mapped too so this stays correct if a
 * future extraction wave adds a module under one of them." Measured in the
 * frozen source: `Recommendation — Research and Development`, the key this
 * map carried, occurs on ZERO lines; `Recommendation — R&D`, what the source
 * actually writes, occurs on 957 and was NOT a key; `User-Mandated Product
 * Extension` occurs on 391 and was NOT a key. So the claim was false for
 * exactly the two labels a future wave was most likely to arrive under, and
 * a row carrying either would have hit the `throw` in
 * `buildModulesRegistry` and aborted the whole fourteen-registry build.
 *
 * WHAT ACTUALLY REACHES THIS MAP, MEASURED RATHER THAN CLAIMED. Only the
 * first occurrence of each canonical `MOD-*` id is looked up, so 81 lookups
 * happen and they carry exactly two values: "SoW Fact" (63) and "Derived
 * Clarification" (18, all MOD-STU-*). Both repaired labels are therefore a
 * LATENT defect today, not a live one — nothing currently carries them into
 * a lookup. The wider fact worth stating: the raw `classification` field is
 * free text, not a closed vocabulary. Across the 36 extraction chunks the
 * modules carry 244 DISTINCT classification strings ("Statement of Work
 * Fact", "unstated", "SoW Fact — §4.1.3, §4.2", …), and only two of them
 * are keys here. This map is correct for what reaches it and is not a
 * substitute for the extraction normalising that field.
 */
const SOURCE_CLASSIFICATION_TO_SOURCE_CLASS = {
  'SoW Fact': 'source-defined',
  'Derived Clarification': 'derived',
  'Derived Clarification — adopted working position': 'derived',
  'Recommendation — R&D': 'recommended',
  Assumption: 'unresolved',
  'Client Decision Required': 'unresolved',
  'Illustrative Example': 'illustrative',
  // "Requested by the blueprint commission but not present in the Statement
  // of Work" -- and the source's own reading rule adds "it needs client
  // confirmation before it becomes scope", which is `unresolved`, the same
  // bucket as `Assumption` and `Client Decision Required`.
  'User-Mandated Product Extension': 'unresolved',
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
 *    useless: the 605 labels include "Add", "Next", "Return" and "Filter",
 *    which match dashboard chrome in `app/coverage` and `app/workflows` and
 *    would have inflated that inventory by dozens of rows that no module
 *    declares. Exact equality against a declared control-matrix label is the
 *    only honest join available, and it under-reports -- see the note that
 *    registry carries.
 */
/* ==================================================================== *
 * THE PROBE GUARD (Phase 0.3).
 *
 * Gates plant scratch directories named `.zz-probe-<pid>` under `app/` and
 * `src/` to prove they can fail. The name is in `.gitignore` AND skipped by
 * every gate's `isForeignProbe`, so a probe a killed process never removed is
 * invisible to `git status` and to every gate at once. `walkDirs` below
 * descends into dot-prefixed directories, so an orphan carrying a `page.tsx`
 * and `MOD-*` tokens mints a phantom route owner nobody can see. One was
 * found in `app/super-admin/` at Phase 0.
 *
 * MATCHED ON SHAPE, NOT ON A SPELLING -- the same regex as
 * `tests/coverage/contract-gates.test.ts:19`: a leading dot, an optional
 * label, and a trailing process id. A guard keyed on one directory name is
 * satisfied by the next agent that picks a different label.
 *
 * LIVE PROBES ARE NOT ORPHANS, and the distinction is what makes this guard
 * safe to run at all. `tests/unit/registry-build.test.ts` spawns this script
 * while other suites plant probes of their own, and Phase 0.4's acceptance is
 * three whole suites running CONCURRENTLY. Refusing on every probe would turn
 * that into a false red. The trailing number is a pid, so liveness is the
 * available test, and it is the same fact the orphan class is defined by: the
 * process that planted it is gone.
 *
 * ponytail: pid reuse -- an orphan whose pid was recycled by an unrelated
 * process reads as live and is missed. The narrower fix is a lock file the
 * planter holds; add it when an orphan actually survives this.
 * ==================================================================== */
const PROBE_DIR_RE = /^\.zz-probe-(?:[a-z0-9-]+-)?(\d+)$/

const isPlanterAlive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    // EPERM: the process exists and is not ours. Alive.
    return err.code === 'EPERM'
  }
}

function probeDirs(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    const full = join(dir, e.name)
    const match = PROBE_DIR_RE.exec(e.name)
    if (match === null) probeDirs(full, acc)
    else acc.push({ path: full, pid: Number(match[1]) })
  }
  return acc
}

const orphanProbes = [join(ROOT, 'app'), join(ROOT, 'src')]
  .flatMap((root) => probeDirs(root))
  .filter((p) => !isPlanterAlive(p.pid))
if (orphanProbes.length > 0) {
  throw new Error(
    'Refusing to generate: a probe directory is orphaned under app/ or src/ -- the process that ' +
      'planted it is gone, so nothing will remove it, and it is invisible to `git status` ' +
      '(.gitignore) and to every gate (isForeignProbe) at once:\n  ' +
      orphanProbes.map((p) => `${p.path} (planted by pid ${p.pid}, not running)`).join('\n  ') +
      '\nDelete it. An orphan carrying a page.tsx and MOD-* tokens mints a phantom route owner ' +
      'in these registries that no reviewer can see.',
  )
}

function walkRouteTree() {
  const ownedModuleIds = new Set()
  /** Module directory names (`fl-b9`, `cc-02`) imported from a file under `app/`. */
  const importedModuleDirs = new Set()
  /**
   * Argmax winners, RECORDED PER DIRECTORY and awarded below, for exactly the
   * reason ties are. This set used to be filled during the walk, which awarded
   * a route to its most-mentioned module EVEN WHERE A SLUG CLAIMED IT -- so a
   * module merely MOUNTED inside another's screen read demonstrated by it. The
   * header two hundred lines up says "ownership, not mention, so a screen
   * cross-referencing a neighbour does not demonstrate it", and that sentence
   * was false of this code: `MOD-CC-02` is chrome that owns no route, is named
   * once inside `app/command-center/sync-conflict-review-panel/` -- a
   * directory `MOD-CC-10` claims by slug -- and was awarded it outright,
   * because it was the only id that route's file mentioned.
   */
  const argmaxWinners = []
  /** Ties, judged after slug claims are known. See the walk below. */
  const ambiguousRoutes = []
  const citedTokens = new Set()
  /** R4-B10: identifier token -> the route directory that names it. */
  const citedTokenRoutes = new Map()
  /** R4-B10: control label -> the app/ directory that declares it. */
  const controlLabelRoutes = new Map()
  /**
   * ── R4-B03: THE CONTROL SCAN NOW READS `src/` TOO, AND IT READS BOTH TREES
   *    WHOLE RATHER THAN ONLY THE DIRECTORIES THAT HOLD A `page.tsx`. ────────
   *
   * This scan used to live INSIDE the route walk below, so it saw only files
   * sitting directly in a route directory under `app/`. Measured with the
   * script's own regex: `app/` yields 83 distinct labels — exactly the figure
   * `/coverage/actionable-controls/` published — and `src/` yields 188 more
   * that appear in no `app/` file at all. Twelve of those are word-for-word
   * rows of the 605-label census (`Mark evidence reviewed`, `Create a Job`,
   * `Approve`, `Decline with reason`, `Grant a qualification clearance`, …),
   * so the published "4 are word-for-word a source label" understated the
   * build in the direction a reader is harmed by.
   *
   * This build already knew the failure mode. The MODULE walk was widened
   * with `importedModuleDirs` (see the mounting-evidence comment below) after
   * five Frontline modules read not-represented because their route imports
   * them by path and names none of them in its text. The `control:` scan sixty
   * lines under that comment was never widened with it. A module's screen
   * lives in `src/…/modules/<dir>/`; its control matrix lives there with it,
   * and the route file that mounts it declares no `control:` of its own.
   *
   * Deliberately SEPARATE from `walkRouteTree`'s route logic rather than
   * folded into it: widening the route walk itself to `src/` would let any
   * `src/` directory holding a `page.tsx` mint a route owner, which is a
   * different and much worse defect. Only the label set is widened.
   */
  const declaredControlLabels = new Set()
  /** The `app/`-only half, kept so the published figure can name both. */
  const appDeclaredControlLabels = new Set()
  /** Route directory basename -> every directory carrying it. See the slug rule below. */
  const routeDirsByName = new Map()
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
      const name = basename(dir)
      const relDir = relative(ROOT, dir)
      routeDirsByName.set(name, [...(routeDirsByName.get(name) ?? []), relDir])
      const counts = new Map()
      for (const e of entries) {
        if (e.isDirectory()) continue // a nested route owns itself
        if (!/\.tsx?$/.test(e.name)) continue
        const text = readFileSync(join(dir, e.name), 'utf8')
        /* ================================================================ *
         * R5-A02: A COMMENT IS NOT A DEMONSTRATION.
         *
         * `out/coverage/ai-storyboards/index.html` rendered
         * `<a href="/hub/shift-management/">SB-STU-03</a>` -- a Studio
         * storyboard linked to a Hub shift screen -- because the whole of
         * `app/hub/shift-management/` names `SB-STU-03` exactly once, in a
         * JSDoc line about numbering style: "the same shape SB-STU-03 uses."
         * The same mention set `status: demonstrated-in-storyboard`, so the
         * census over-counted by the same rows. 17 of the 26 links whose
         * target page never names the item in rendered text were this.
         *
         * WHY THE `MOD-*` COUNT ABOVE STILL READS THE RAW TEXT.
         *
         * R6-C02 CORRECTED THIS PARAGRAPH. It said "measured both ways" and
         * gave a consequence the measurement does not produce: stripping
         * would move `MOD-FL-A1` "from demonstrated to not-represented" and
         * so "report a built screen as absent". Re-measured by replaying this
         * generator with `code` in place of `text` on the line below and
         * diffing `modules.json` (`AVIIXA_REGISTRY_OUT` writes the run
         * anywhere, so neither pass touches the committed registries):
         *
         *   raw       demonstrated 69  mounted 10  not-represented 2
         *   stripped  demonstrated 68  mounted 11  not-represented 2
         *   the single row that moves: MOD-FL-A1
         *     demonstrated-in-storyboard -> mounted-in-another-screen
         *   rows moving to not-represented: NONE.
         *
         * "Exactly one module" was right. The consequence was not: the module
         * lands on `mounted-in-another-screen`, caught by the mounting rule
         * two hundred lines below, because `app/frontline/sign-in/page.tsx`
         * imports `@/frontline/modules/fl-a1/LoginView` whatever its comments
         * say. THAT IS STILL A WRONG ANSWER, AND IT IS WHY THIS SCAN READS
         * `text`: `MOD-FL-A1` OWNS that route. `src/frontline/modules.ts`
         * declares `slug: null` for it -- the basename `sign-in` exists under
         * two surfaces, so the generator refuses a claim it cannot resolve --
         * and states in its own reason that "the argmax rule awards it
         * without one". Strip the comments and the argmax has nothing left to
         * award on, so a module that owns its screen is reported as mounted
         * inside somebody else's. Wrong in a quieter way than "absent", and
         * a status this build deliberately distinguishes.
         *
         * AND THERE IS A SECOND OBSTACLE THE OLD PARAGRAPH DID NOT RECORD.
         * Stripping creates an unresolved argmax tie that the ambiguity check
         * below throws on, so the generator does not merely misclassify, it
         * refuses to run:
         *
         *   Ambiguous module ownership for route app/studio/journey:
         *   MOD-STU-04 and MOD-STU-12 are both mentioned 5 times, and no
         *   module declares slug "journey".
         *
         * Raw, that directory is 6 / 7 and `MOD-STU-12` takes it. THE TIE
         * CANNOT BE SETTLED BY PICKING A WINNER, because the source gives the
         * directory to neither: `app/studio/journey/page.tsx` states under D1
         * that the route composes module routes and is not one, and `journey`
         * is deliberately no module's slug. Both modules are already
         * `demonstrated` from their own slug-claimed routes (`/studio/builder/`
         * and `/studio/versions/`), so nothing is gained by awarding it and an
         * ownership the source refuses would be invented by awarding it.
         *
         * So the scan is unchanged and the reason is now the measured one.
         * Ownership argmax and a citation remain different questions: a
         * citation asks whether a screen NAMES the item, which a comment
         * cannot answer, while ownership asks which module a built directory
         * belongs to, where the header comment is a statement about the
         * directory rather than about its output.
         * ================================================================ */
        const code = stripComments(text)
        for (const id of text.match(/MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+)/g) ?? []) {
          counts.set(id, (counts.get(id) ?? 0) + 1)
        }
        for (const token of code.match(/[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g) ?? []) {
          citedTokens.add(token)
          /**
           * R4-B10: WHICH route named it, not only that one did. The status
           * said a shipped screen demonstrates the row and no artefact said
           * which screen, so fourteen index pages rendered 5,018 ids with
           * zero in-row links. The evidence for the status already knows the
           * answer; it was being thrown away one line above this one.
           *
           * LEXICOGRAPHICALLY SMALLEST, not first-seen. `readdirSync` order
           * is filesystem order and this file is a determinism contract --
           * two generations must diff clean. A token named by several routes
           * resolves to the same one on every machine this way.
           */
          const prior = citedTokenRoutes.get(token)
          if (prior === undefined || relDir < prior) citedTokenRoutes.set(token, relDir)
        }
        /**
         * MOUNTING EVIDENCE, WHICH IS AN IMPORT AND NOT A MENTION.
         *
         * A module with no route of its own can still be built and on screen:
         * the source requires it -- `MOD-CC-13`'s action rail mounts inside the
         * twelve module screens, and `MOD-CC-02` is chrome. (This comment used
         * to name `MOD-CC-07` here too; it is wrong. That module IS named on
         * SCR-CC-13 and DOES claim `slug: 'learning-read-view'`. `MOD-CC-13` is
         * the only routeless Command Center ACTION module -- not the only
         * routeless one: `src/surfaces/cc/modules.ts` gives `slug: null` to
         * two modules and `MOD-CC-02` is the other, which is chrome.) Those
         * modules used to read `not-represented`, which is the same word the
         * inventory uses for a module with no code at all.
         *
         * It was understating the build by seven modules, and the five that
         * matter are `MOD-FL-A4`, `A5`, `B8`, `B9` and `B11`: all five are
         * imported by `app/frontline/run-player/page.tsx` and every one of
         * them read not-represented -- because the route imports them BY PATH
         * and names none of the five in its text, so the mention scan above
         * cannot see them at all.
         *
         * NO FILE COUNT IS CLAIMED HERE ANY MORE. This comment said the five
         * were "ninety-nine source files between them"; measured they are 25
         * (4/5/6/5/5, 12,173 lines), and no reading of the tree reproduces 99
         * -- all twelve `fl-*` directories are 58 files, all of
         * `src/frontline` is 67, and the import closure from the five panels
         * is 18. The number was decoration on a claim that stands without it,
         * so it is gone rather than replaced by a second number nothing
         * checks.
         *
         * An import is the stronger evidence anyway: a mention can be a
         * cross-reference in a sentence, while an import is the screen actually
         * mounting the thing.
         */
        // R5-A02, same rule: a commented-out import mounts nothing. Measured
        // on this tree the two readings agree exactly (50 directories either
        // way), so this changes no output today and closes the hole.
        for (const m of code.matchAll(/from\s+'[^']*\/modules\/([a-z]+-[a-z]?\d+)(?:\/[^']*)?'/g)) {
          importedModuleDirs.add(m[1])
        }
      }
      const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
      if (ranked.length > 0) {
        // The comment used to assert "verified unambiguous (zero ties)" and
        // nothing enforced it, while three route directories sat one mention
        // from a flip. A tie would resolve by Map insertion order, silently
        // attributing a route to whichever module happened to be seen first.
        if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
          // RECORDED, NOT THROWN HERE. A tie is only ambiguous while nobody
          // has CLAIMED the route, and slug claims are parsed below, after
          // this walk. Throwing here judged the route before the evidence
          // that settles it had been read.
          //
          // It matters because mounting a component from one module inside
          // another module's screen is a legitimate and necessary pattern --
          // the source puts a whole module inside another's screen with no
          // route of its own -- and doing it moves the mention count by one.
          // Two Hub routes reached a tie that way in a single wave, and a
          // third sat one mention from it.
          ambiguousRoutes.push({ dir, name, a: ranked[0], b: ranked[1] })
        } else {
          argmaxWinners.push({ dir, id: ranked[0][0] })
        }
      }
    }
    // A LIVE probe belongs to a suite running right now; the orphan guard above
    // has already refused on any dead one. Descending into either would let a
    // scratch `page.tsx` mint a route owner, which is how registry output would
    // differ between an idle box and a concurrent one.
    for (const e of entries) {
      if (e.isDirectory() && !PROBE_DIR_RE.test(e.name)) walkDirs(join(dir, e.name))
    }
  }
  walkDirs(join(ROOT, 'app'))

  /**
   * The widened label scan (R4-B03), NOW ASKING THE PARSER RATHER THAN A
   * REGEX WHAT A `control:` IS (R5-A07).
   *
   * A regex for `control:\s*'...'` matches any property spelled `control`,
   * and this tree has three shapes that are not a declared control at all:
   *
   *   1. `Record<Kind, string>` affordance maps, where `control` is a
   *      UNION-MEMBER KEY and the string is a caption or a tone token --
   *      `control: 'ok'` (a `StatusTone`), `control: 'Control'`,
   *      `control: 'a live control'`, `control: 'Control drawn here'` across
   *      ten sites, and `control: 'border-[var(--color-border-strong)]'`,
   *      which is a Tailwind class.
   *   2. A TYPE, not a value: `control: 'send' | 'submit' | ...` in a type
   *      literal. The regex read `'send'` as a label.
   *   3. Nothing at all where the label is DOUBLE-quoted because it contains
   *      an apostrophe -- "View another identity's inbox" and eight more.
   *      Nine real declared labels were invisible to the single-quote regex.
   *
   * The rule now: a string-literal `control` property of an OBJECT LITERAL
   * that also carries one of the control-matrix sibling keys below. Every
   * real declaration in this tree carries at least one --
   * `CONTROL_MATRIX` rows carry `id` and `sourceRef`, `CC05_CONTROL_SPELLINGS`
   * carries `matrixRef`, `SB_FL_019` carries `sourceRef` -- and not one of
   * the kind maps carries any, because a kind map's siblings are the other
   * members of its union.
   *
   * Measured: 271 -> 274 (79 under app/, 195 only under src/), being the six
   * false positives above removed and the nine double-quoted labels added.
   * `tests/coverage/census-closure.test.ts` runs the loose regex as well and
   * requires the difference to be exactly that named list, so a silent
   * re-widening or a silent narrowing both go red.
   */
  const CONTROL_MATRIX_SIBLINGS = ['id', 'sourceRef', 'matrixRef']
  const controlMatrixLabels = (text) => {
    const found = []
    const source = ts.createSourceFile('control-scan.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node) => {
      if (ts.isObjectLiteralExpression(node)) {
        const props = new Map()
        for (const p of node.properties) {
          if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
            props.set(p.name.text, p.initializer)
          }
        }
        const control = props.get('control')
        if (
          control !== undefined &&
          ts.isStringLiteralLike(control) &&
          CONTROL_MATRIX_SIBLINGS.some((k) => props.has(k))
        ) {
          found.push(control.text)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
    return found
  }
  const collectLabels = (dir, into) => {
    const entries = readIfPresentDir(dir)
    if (entries === null) return
    const relDir = relative(ROOT, dir)
    for (const e of entries) {
      if (PROBE_DIR_RE.test(e.name) || /^\.zz-probe-/.test(e.name)) continue
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        collectLabels(full, into)
        continue
      }
      if (!/\.tsx?$/.test(e.name)) continue
      const text = readIfPresentFile(full)
      if (text === null) continue
      if (text.includes('CONTROL_MATRIX')) declaresControlMatrix = true
      // Cheap gate before an expensive parse: a file with no `control:` at
      // all cannot declare one, and only ~105 of the 618 files in the two
      // trees do.
      if (!text.includes('control:')) continue
      for (const label of controlMatrixLabels(text)) {
        declaredControlLabels.add(label)
        into?.add(label)
        // R4-B10, same rule and same reason as `citedTokenRoutes`:
        // lexicographically smallest, so two generations diff clean.
        if (into !== null) {
          const prior = controlLabelRoutes.get(label)
          if (prior === undefined || relDir < prior) controlLabelRoutes.set(label, relDir)
        }
      }
    }
  }
  collectLabels(join(ROOT, 'app'), appDeclaredControlLabels)
  collectLabels(join(ROOT, 'src'), null)

  return { ownedModuleIds, argmaxWinners, importedModuleDirs, ambiguousRoutes, citedTokens, citedTokenRoutes, controlLabelRoutes, declaredControlLabels, appDeclaredControlLabels, declaresControlMatrix, routeDirsByName }
}

const ROUTE_EVIDENCE = walkRouteTree()
const DEMONSTRATED_MODULE_IDS = ROUTE_EVIDENCE.ownedModuleIds

/* ==================================================================== *
 * THE SLUG RULE (Phase 0.6 -- slice-5 finding F4).
 *
 * Argmax alone awards a route to whichever module its files mention most, so
 * a module that DECLARES a route and shares the screen with its host loses
 * its own route to that host and reads `not-represented` while owning it.
 * Live instance: `MOD-STU-15` declares `slug: 'agents'`, `app/studio/agents/`
 * exists and builds, and `MOD-STU-02` outnumbers it there 4 mentions to 2.
 * Fifteen of eighteen Studio modules moved on the last slice, not eighteen,
 * and the coverage numerator under-reported by exactly that row.
 *
 * The rule: a module declaring `slug: X` whose route directory `X` exists is
 * demonstrated. Argmax still decides every route no module claims by slug --
 * `/studio/journey` and `/studio/sign-in` are two -- so nothing is taken away
 * from it; a second, independent way to earn the status is added.
 *
 * WHY THE DECLARATIONS ARE READ AS TEXT. The spines are TypeScript and the
 * sibling reach generators execute them through `typescript`, which costs
 * ~350ms cold. `tests/unit/registry-build.test.ts` spawns THIS script inside
 * a 5s budget while forty test files run in parallel, and the doc comment at
 * the top of this file records that cost timing out two runs in three. A
 * `slug:` string literal is the one thing in those files a regex can read
 * without becoming an interpreter, and a parse that silently goes empty is
 * refused below rather than falling back on argmax unannounced.
 *
 * NO SURFACE TABLE. The route directory is found by name among the
 * directories the walk above actually visited, never by mapping `MOD-STU-*`
 * to `app/studio`; two route directories sharing a claimed name are refused
 * the same way an argmax tie is, rather than resolved by a guess.
 * ==================================================================== */
const SPINE_MODULE_ID = /\bid:\s*'(MOD-[A-Z]{2,3}-(?:\d{2}|[AB]\d+))'/g
const SPINE_SLUG = /\bslug:\s*'([^'\\]+)'/

/** Every `modules.ts` under `src/` -- the surface spines, found by name. */
function spineFiles(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!PROBE_DIR_RE.test(e.name)) spineFiles(join(dir, e.name), acc)
    } else if (e.name === 'modules.ts') {
      acc.push(join(dir, e.name))
    }
  }
  return acc
}

/** `MOD-* -> declared slug`. An entry runs from its own `id:` to the next one. */
function declaredSlugs() {
  const byModule = new Map()
  for (const file of spineFiles(join(ROOT, 'src'))) {
    const text = readFileSync(file, 'utf8')
    const marks = [...text.matchAll(SPINE_MODULE_ID)]
    marks.forEach((mark, i) => {
      const next = marks[i + 1]
      const entry = text.slice(mark.index, next === undefined ? undefined : next.index)
      const slug = SPINE_SLUG.exec(entry)
      if (slug === null) return // `slug: null`, or a card that declares no route
      const seen = byModule.get(mark[1])
      if (seen !== undefined && seen.slug !== slug[1]) {
        throw new Error(
          `${mark[1]} declares slug "${seen.slug}" in ${seen.file} and "${slug[1]}" in ` +
            `${relative(ROOT, file)}. One module owns at most one route; refusing to pick one.`,
        )
      }
      byModule.set(mark[1], { slug: slug[1], file: relative(ROOT, file) })
    })
  }
  return byModule
}

const MODULE_SLUGS = declaredSlugs()
if (MODULE_SLUGS.size === 0) {
  throw new Error(
    'No `slug:` declaration was parsed from any src/**/modules.ts -- refusing to write registries ' +
      'that would fall back on module-mention argmax alone without saying so. That fallback is ' +
      'exactly the defect this rule exists to remove, and a silent one is worse than the original.',
  )
}

/** `MOD-* -> the route directory its declared slug names`, for modules that have one. */
const SLUG_DEMONSTRATED = new Map()
for (const [id, { slug, file }] of MODULE_SLUGS) {
  const dirs = ROUTE_EVIDENCE.routeDirsByName.get(slug)
  if (dirs === undefined) continue // declared, not built -- honestly not-represented
  if (dirs.length > 1) {
    throw new Error(
      `${id} (${file}) declares slug "${slug}" and ${dirs.length} route directories carry that ` +
        `name: ${dirs.join(', ')}. Which one demonstrates the module is a guess; refusing to make it.`,
    )
  }
  SLUG_DEMONSTRATED.set(id, dirs[0])
  DEMONSTRATED_MODULE_IDS.add(id)
}

/* ====================================================================
 * THE TIES, JUDGED NOW THAT THE CLAIMS ARE KNOWN.
 *
 * The walk records a tie rather than throwing on it, because a tie only
 * means "ambiguous" while nobody has claimed the route. A module that
 * DECLARES a slug owns that route outright; the mention count was only ever
 * a way to guess an owner where no one had said.
 *
 * This is not a loosening. A tie on an UNCLAIMED route still refuses, with
 * the same message it always had. What changed is that mounting a component
 * from one module inside another module's screen -- which the source
 * requires, since it places a whole module inside another's screen with no
 * route of its own -- no longer breaks the build by moving a mention count
 * by one.
 * ==================================================================== */
const SLUG_CLAIMED_DIRS = new Set(SLUG_DEMONSTRATED.values())

/* --------------------------------------------------------------------
 * THE ARGMAX AWARDS, JUDGED THE SAME WAY AND FOR THE SAME REASON.
 *
 * Argmax is the guess for a route NOBODY HAS CLAIMED. On a route a slug
 * claims, the owner is already known and the mention count answers a question
 * that is no longer open -- so awarding its winner as well hands one route to
 * two modules, and the second of them by mention alone.
 *
 * That is not hypothetical: it shipped. `MOD-CC-02` is Command Center chrome
 * that declares `slug: null` on purpose because it owns no route, and it read
 * `demonstrated-in-storyboard` off `MOD-CC-10`'s screen, where it is named
 * once as the chrome mounted inside it. The inventory then reported 58
 * demonstrated modules where 57 are.
 *
 * Deliberately NOT a throw. A slug-claimed route naming a neighbour more
 * often than its owner is the mounting pattern the source requires, not a
 * defect. It is simply not evidence for the neighbour.
 * ------------------------------------------------------------------ */
const ARGMAX_DEMONSTRATED = new Map()
for (const { dir, id } of ROUTE_EVIDENCE.argmaxWinners) {
  if (SLUG_CLAIMED_DIRS.has(relative(ROOT, dir))) continue
  DEMONSTRATED_MODULE_IDS.add(id)
  if (!ARGMAX_DEMONSTRATED.has(id)) ARGMAX_DEMONSTRATED.set(id, relative(ROOT, dir))
}

for (const { dir, name, a, b } of ROUTE_EVIDENCE.ambiguousRoutes) {
  const claimed = SLUG_CLAIMED_DIRS.has(relative(ROOT, dir))
  if (claimed) continue
  throw new Error(
    `Ambiguous module ownership for route ${dir}: ${a[0]} and ${b[0]} are both mentioned ` +
      `${a[1]} times, and no module declares slug "${name}". A route must either name its own ` +
      `module more often than any it cross-references, or be claimed by a slug declaration.`,
  )
}
/* --------------------------------------------------------------------
 * MOUNTED, WHICH IS NEITHER DEMONSTRATED NOR ABSENT.
 *
 * A module that owns no route can still be built and on screen. The source
 * requires it: `MOD-CC-13`'s action rail mounts inside other
 * modules' screens, and `MOD-CC-02` is surface chrome that `AC-CC-040`
 * forbids a route. Until now every one of them read `not-represented` --
 * the same word the inventory uses for a module with no code at all.
 *
 * Measured, that was understating the build by seven modules, and the five
 * that matter are `MOD-FL-A4`, `A5`, `B8`, `B9` and `B11`: ALL FIVE are
 * imported by `app/frontline/run-player/page.tsx` and every one read
 * not-represented. The mention scan could not see them because that route
 * imports them by path and names none of the five in its text. (This comment
 * said "ninety-nine source files between them"; they are 25 -- see the note
 * at the import scan above.)
 *
 * THE EVIDENCE IS AN IMPORT, NOT A MENTION, and that is the stronger of the
 * two: a mention can be a cross-reference in a sentence, an import is the
 * screen mounting the thing. The directory convention is mechanical --
 * `MOD-FL-B9` lives in `.../modules/fl-b9/` -- and `cc-10-s366` maps to no
 * module because it matches no id, which is correct: it is a second
 * treatment of `MOD-CC-10`, not a fourteenth module.
 *
 * PRECEDENCE IS DELIBERATE. A module that owns a route is `demonstrated`
 * whether or not something else also imports it; `mounted-in-another-screen`
 * is only for modules that own none. Reversing that would demote a module
 * for being reused.
 * ------------------------------------------------------------------ */
/**
 * TRANSITIVE, BECAUSE A MODULE TWO HOPS FROM A ROUTE IS STILL ON SCREEN.
 *
 * The first version of this rule read only the import specifiers of files
 * sitting directly inside a route directory. That saw `MOD-FL-A4` and its four
 * neighbours, which the Run Player imports by name — and it did not see
 * `MOD-CC-02`, which the live shift board's own chrome component imports.
 * Chrome mounted inside a module mounted inside a route is exactly the shape
 * this status exists for, and the direct-only rule reported it as absent.
 *
 * So the walk follows imports out of `app/` through `src/`, both `@/…` and
 * relative, and collects every `.../modules/<dir>/` it can reach. Four
 * independent agent reachability probes in this build reached the same design
 * from the other side, and every one of them recorded that a walk which
 * follows only `@/…`, or only single-line `import … from`, under-reports —
 * and a reachability check that under-reports goes green on a broken chain.
 */
const MOUNTED_MODULE_IDS = new Set()

const SPECIFIER = /from\s*['"]([^'"]+)['"]/g
const reachedFiles = new Set()
const resolveSpecifier = (fromFile, spec) => {
  const base = spec.startsWith('@/')
    ? join(ROOT, 'src', spec.slice(2))
    : spec.startsWith('.')
      ? join(dirname(fromFile), spec)
      : null
  if (base === null) return null
  for (const cand of [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
    base,
  ]) {
    try {
      if (statSync(cand).isFile()) return cand
    } catch {
      // Not this extension. The loop is the probe; a specifier that resolves
      // to nothing is a type-only or package import and is not a defect here.
    }
  }
  return null
}
const followImports = (file) => {
  if (reachedFiles.has(file)) return
  reachedFiles.add(file)
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    return // a probe removed mid-walk; the orphan guard has already refused on a dead one
  }
  const dirMatch = /[\\/]modules[\\/]([a-z]+-[a-z]?\d+)[\\/]/.exec(relative(ROOT, file))
  if (dirMatch !== null) MOUNTED_MODULE_IDS.add(`MOD-${dirMatch[1].toUpperCase()}`)
  for (const m of text.matchAll(SPECIFIER)) {
    const target = resolveSpecifier(file, m[1])
    if (target !== null) followImports(target)
  }
}
const seedFromApp = (dir) => {
  const entries = (() => {
    try {
      return readdirSync(dir, { withFileTypes: true })
    } catch {
      return []
    }
  })()
  for (const e of entries) {
    if (PROBE_DIR_RE.test(e.name) || /^\.zz-probe-/.test(e.name)) continue
    const full = join(dir, e.name)
    if (e.isDirectory()) seedFromApp(full)
    else if (/\.tsx?$/.test(e.name)) followImports(full)
  }
}
seedFromApp(join(ROOT, 'app'))

for (const dir of ROUTE_EVIDENCE.importedModuleDirs) {
  // `fl-b9` -> `MOD-FL-B9`. Derived from the directory, NOT looked up in
  // MODULE_SLUGS: that map holds only modules that DECLARE a slug, and the
  // modules this rule exists for are exactly the ones that declare
  // `slug: null`. Iterating it found nothing and reported seven mounted
  // modules as zero -- a lookup keyed on the very field the subject lacks.
  const id = `MOD-${dir.toUpperCase()}`
  if (DEMONSTRATED_MODULE_IDS.has(id)) continue
  MOUNTED_MODULE_IDS.add(id)
}

// A build that finds no shipped module is a broken walk, not an empty product:
// nineteen SURF-SA routes exist on disk. Failing here beats writing a coverage
// dashboard that quietly reports nothing is built.
//
// IT SITS HERE, not next to the walk, because BOTH award paths now run after
// the walk: slug claims and -- since a slug-claimed route stopped awarding its
// argmax winner too -- the argmax awards as well. Left where it was, it read a
// set that is empty by construction and refused every run.
if (DEMONSTRATED_MODULE_IDS.size === 0) {
  throw new Error(
    'No module route was found under app/. The route walk is broken -- refusing to write registries that would report every module as not-represented.',
  )
}

console.log(
  `Route evidence: ${DEMONSTRATED_MODULE_IDS.size} modules demonstrated -- ` +
    `${SLUG_DEMONSTRATED.size} by a declared slug naming a built route directory, the rest by ` +
    `mention argmax over the ${ROUTE_EVIDENCE.routeDirsByName.size} route directory names under app/.`,
)

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

/* ====================================================================
 * NAMED IN THE BUILD, WHICH IS A WEAKER FACT THAN DEMONSTRATED AND A
 * STRONGER ONE THAN ABSENT.
 *
 * `statusForId` asks whether a ROUTE SCREEN names the identifier. That is the
 * right question for a status and the wrong question for a coverage number:
 * across the fourteen inventories the demonstrated count is a small fraction
 * of the named count, and the gap is not unbuilt work — it is work no route
 * happens to spell.
 *
 * NO DIGITS HERE, DELIBERATELY. This comment used to state "237 of 4,970 rows
 * demonstrated" and "663 are named", with a "426-row gap" derived from them.
 * Every one of the three was stale, and a reader had no way to tell. Both
 * numbers move on every build that adds a route or a row, so they live in the
 * artefacts that compute them and nowhere else: sum the
 * `demonstrated-in-storyboard` rows and the `namedInSourceCount` field over
 * the fourteen `registries/generated/*.json`. Four other sites in this tree
 * were corrected the same way for the same reason in slice 10, and this is
 * the fifth.
 *
 * The sharpest case is a SHAPE rather than a figure, so it is safe to state:
 * `offline-scenarios` reads zero demonstrated against every one of its rows
 * named. Two slice-8 tasks transcribed all seventy offline use cases, and
 * nothing under `app/` names a `UC-OFF-*` identifier, so the registry reports
 * none demonstrated. A true statement of the rule and a false impression of
 * the build — and the coverage dashboard puts that number in front of a
 * client.
 *
 * THIS IS DELIBERATELY NOT A STATUS. `mounted-in-another-screen` means a route
 * imports the module DIRECTORY, which is structural. "Named in a file
 * somewhere" is a weaker claim and gets a weaker word: a count beside the
 * total, never a per-row verdict, so no row can read as demonstrated on the
 * strength of a mention.
 *
 * The walk is `src/` and `app/`, whole-token matched, probe-aware for the same
 * reason every other walk in this build is: a concurrent suite's scratch file
 * must not add to a published number.
 * ==================================================================== */
const NAMED_IN_SOURCE = (() => {
  const found = new Set()
  const TOKEN = /[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/g
  const walk = (dir) => {
    const entries = readIfPresentDir(dir)
    if (entries === null) return
    for (const e of entries) {
      if (PROBE_DIR_RE.test(e.name) || /^\.zz-probe-/.test(e.name)) continue
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(?:ts|tsx|mjs)$/.test(e.name)) {
        const text = readIfPresentFile(full)
        if (text === null) continue
        for (const t of text.match(TOKEN) ?? []) found.add(t)
      }
    }
  }
  walk(join(ROOT, 'src'))
  walk(join(ROOT, 'app'))
  return found
})()

function readIfPresentDir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
  } catch (err) {
    if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) return null
    throw err
  }
}

function readIfPresentFile(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch (err) {
    if (err && err.code === 'ENOENT') return null
    throw err
  }
}

/** How many of `rows` are named anywhere under `src/` or `app/`. */
function namedInSourceCount(rows) {
  return rows.filter((r) => NAMED_IN_SOURCE.has(r.id)).length
}

/**
 * Every registry says, in the prose the registry index already renders, which
 * signal set its statuses and what that signal counted. A status nobody can
 * trace back to evidence is the same defect as a hardcoded zero.
 */
function statusNote(rows, signal) {
  const n = rows.filter((r) => r.status === 'demonstrated-in-storyboard').length
  const mounted = rows.filter((r) => r.status === 'mounted-in-another-screen').length
  return (
    `Status is computed from the built route tree, never from a list: ${n} of ${rows.length} rows ` +
    `read demonstrated-in-storyboard because ${signal}. ` +
    (mounted > 0
      ? `${mounted} read mounted-in-another-screen: they own no route and a route file IMPORTS ` +
        'their module directory, which is what the source requires of a module with no screen of ' +
        'its own -- an action rail or surface chrome mounted inside another module\'s screen. ' +
        'The evidence is the import rather than a mention, because a mention can be a ' +
        'cross-reference in a sentence while an import is the screen mounting the thing; five ' +
        'Frontline modules read not-represented until this rule existed, all five mounted in ' +
        'the Run Player and none of the five named in its text. '
      : '') +
    'Every other row reads not-represented, which means no route demonstrates it AND no route ' +
    'mounts it -- a module may be fully built and still read not-represented if nothing has ' +
    'mounted it yet. ' +
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
        status: DEMONSTRATED_MODULE_IDS.has(m.id)
          ? 'demonstrated-in-storyboard'
          : MOUNTED_MODULE_IDS.has(m.id)
            ? 'mounted-in-another-screen'
            : 'not-represented',
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
  // Phase 0.6, checked against the WRITTEN rows rather than against the set
  // they were written from, and against the two inputs separately: the
  // `slug:` declarations parsed out of src/ and the route directories found
  // under app/. It is red on the argmax-only rule this replaced -- MOD-STU-15
  // named it, with `app/studio/agents` on disk the whole time -- and it stays
  // red for anything later that recomputes or filters this status field.
  const slugClaimedButNotDemonstrated = [...SLUG_DEMONSTRATED.entries()].filter(
    ([id]) => byId.has(id) && byId.get(id).status !== 'demonstrated-in-storyboard',
  )
  if (slugClaimedButNotDemonstrated.length > 0) {
    throw new Error(
      `${slugClaimedButNotDemonstrated.length} module(s) declare a slug whose route directory is ` +
        'built and still read not-represented:\n  ' +
        slugClaimedButNotDemonstrated.map(([id, dir]) => `${id} -> ${dir}`).join('\n  ') +
        '\nA module that owns a shipped route is demonstrated by it, however often the screen it ' +
        'shares names its host.',
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
        'the module declares a `slug` and a shipped route directory of that name exists under ' +
          `app/ (${SLUG_DEMONSTRATED.size} rows), or, for a route no module claims by slug, ` +
          'because the route directory names that module id more often than any other module id ' +
          'it mentions -- ownership, not mention, so a screen cross-referencing a neighbour does ' +
          'not demonstrate it, and a tie throws rather than resolving silently. The declared ' +
          'slug is read first because argmax alone awarded a shared screen to whichever module ' +
          'it mentioned most, so a module that owns a route and shares the screen with its host ' +
          'read not-represented while owning it',
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
      appendNote(
        statusNote(
          rows,
          `${CITED_BY_A_SHIPPED_SCREEN}. Only the numeric OBJ-NNN card id counts here: the built ` +
            'screens overwhelmingly cite the mnemonic pointers (OBJ-SA-SESSION, OBJ-DOH-SHIFT) ' +
            'into the same concepts, and the source publishes no mnemonic-to-card mapping to join ' +
            'them on without inventing one',
        ),
        studioObjectGapNote(rawObjIds, byId),
      ),
    ),
    sourceFixesNoTotal: false,
    rows,
  }
}

// ---------------------------------------------------------------------
// Slice 5 Task 25 -- three closures over Studio content the frozen source
// states but never gives an identifier to. All three live in the generator
// because `registries/generated/**` is build output (C14): a hand-edited row
// there is erased by the next `pnpm build` and stays invisible until slice 10
// tries to reconcile it.
//
// The line band of Chapter 20's eighteen Studio module cards (20.2.1
// MOD-STU-01 at L31552 through the last line before 20.3 begins at L34690).
// Every locator the three blocks below cite falls inside it, and each block
// asserts that rather than trusting it.
// ---------------------------------------------------------------------
const STU_CARD_BAND = { first: 31552, last: 34689 }

// ---------------------------------------------------------------------
// R19 -- the Studio notification triggers, as DERIVED rows.
//
// The eighteen module cards each carry a `**Notifications.**` table whose
// rows state a trigger, its recipient, its channel and its state
// progression. Not one of those rows carries a `NOTIF-*` identifier: the
// 205-row `NOTIF-*` register this file already builds has ZERO locators
// anywhere inside the Studio card band, which `buildNotificationsRegistry`
// below re-derives and asserts rather than repeating from a brief. So a
// slice-10 reconciliation reading `notifications.json` would find these
// behaviours nowhere.
//
// Slice 4 hit the mirror of this shape as its R9 -- identifiers with no
// content. This is content with no identifiers, and the two failure modes
// have opposite fixes: R9 could not invent content, and R19 must not invent
// an identifier. The row ids below are `STU-TRIGGER-<module>-<position>`,
// derived and labelled `sourceClass: 'derived'`, and no `NOTIF-*` id is
// minted for any of them. `position` is the row's position in its card's own
// table, so the one deliberately-absent row leaves its position empty rather
// than being papered over by renumbering.
//
// COUNT, MEASURED: the brief for this task stated forty-one trigger rows.
// The cards hold FIFTY-SEVEN, of which fifty-six are notifiable and one is
// the deliberate absence excluded below. Forty-one is the running total
// through MOD-STU-13 -- a truncated count, the third brief-supplied figure
// in this slice that did not survive checking. The assertions below carry
// the measured numbers, never the stated one.
//
// `trigger` and `delivery` are verbatim source cell text (recipient and
// channel joined by an em dash); `line` is the table row's own locator.
// ---------------------------------------------------------------------
const STU_NOTIFICATION_TRIGGERS = [
  { mod: '01', pos: 1, line: 31662, trigger: 'A capability a published Workflow depends on is disabled', delivery: 'Quality Manager — In-app and email' },
  { mod: '01', pos: 2, line: 31663, trigger: 'A newly registered capability becomes available within entitlement', delivery: 'Quality Manager and Tenant Admin — In-app' },
  { mod: '02', pos: 1, line: 31836, trigger: 'Repeated coaching for one worker on one screen crosses the tenant threshold', delivery: 'Supervisor — In-app, with email per the tenant\'s configuration' },
  { mod: '02', pos: 2, line: 31837, trigger: 'A deviation is confirmed and classified', delivery: 'Roles named in the referenced escalation routing template, resolved to people on shift — In-app and email' },
  { mod: '02', pos: 3, line: 31838, trigger: 'The Shift Handoff brief is assembled', delivery: 'Incoming supervisor by default; optionally Quality Manager and plant manager — In-app with optional email' },
  { mod: '02', pos: 4, line: 31839, trigger: 'An emerging-pattern watch item names a candidate screen for instruction review', delivery: 'Quality Manager and authoring-grant holders — In-app' },
  { mod: '03', pos: 1, line: 31998, trigger: 'The implementation team\'s temporary authoring grant is due to be revoked at onboarding close', delivery: 'Tenant Admin and Quality Manager — In-app and email' },
  { mod: '03', pos: 2, line: 31999, trigger: 'A custom Job Type is created', delivery: 'Quality Manager — In-app' },
  { mod: '03', pos: 3, line: 32000, trigger: 'Linkage counts have been unavailable for longer than the tenant\'s connectivity-loss alert threshold', delivery: 'Tenant Admin — In-app' },
  { mod: '04', pos: 1, line: 32166, trigger: 'A branch target is deleted, making an open draft structurally invalid', delivery: 'The draft\'s Author — In-app' },
  { mod: '04', pos: 2, line: 32167, trigger: 'A workflow default routing template is archived while Workflows still inherit it', delivery: 'Quality Manager — In-app and email' },
  { mod: '05', pos: 1, line: 32401, trigger: 'A screen is left Incomplete when the author leaves the Workflow', delivery: 'The author — In-app' },
  { mod: '05', pos: 2, line: 32402, trigger: 'A curated coaching default designated on a screen is retired in the corpus', delivery: 'Quality Manager and the Workflow\'s last author — In-app and email' },
  { mod: '05', pos: 3, line: 32403, trigger: 'A certification named in a Section 9 override is no longer maintained by the tenant', delivery: 'Quality Manager — In-app and email' },
  { mod: '06', pos: 1, line: 32545, trigger: 'A block edit changes content on screens already published in a prior version', delivery: 'The Workflow\'s Author, at draft time — In-app' },
  { mod: '06', pos: 2, line: 32546, trigger: 'A block is left with no applying screens at submission', delivery: 'The Author — In-app' },
  { mod: '07', pos: 1, line: 32747, trigger: 'A coaching asset\'s resolution rate falls below the review threshold', delivery: 'Quality Manager — In-app and email' },
  { mod: '07', pos: 2, line: 32748, trigger: 'An authoring-grant holder proposes a library change', delivery: 'Quality Manager — In-app and email' },
  { mod: '07', pos: 3, line: 32749, trigger: 'A library edit to a published item takes effect', delivery: 'Quality Manager and the authors of referencing Workflows — In-app' },
  { mod: '07', pos: 4, line: 32750, trigger: 'Indexing has been unavailable beyond the tenant\'s alert threshold', delivery: 'Quality Manager and Tenant Admin — In-app' },
  { mod: '07', pos: 5, line: 32751, trigger: 'A deviation escalation is delivered as a nobody-on-shift fallback', delivery: 'The nobody-on-shift fallback recipient, marked as a fallback delivery — In-app and email' },
  { mod: '08', pos: 1, line: 32909, trigger: 'A training item is published', delivery: 'Supervisors at the affected scope — In-app' },
  { mod: '08', pos: 2, line: 32910, trigger: 'Storage entitlement for training content is approaching its ceiling', delivery: 'Tenant Admin — In-app and email' },
  { mod: '09', pos: 1, line: 33060, trigger: 'A drafted level awaits the author\'s edit', delivery: 'The author — In-app' },
  { mod: '09', pos: 2, line: 33061, trigger: 'A screen has fewer than six renderings at submission', delivery: 'The author — In-app' },
  { mod: '10', pos: 1, line: 33200, trigger: 'A skeletal part record is created from the Studio', delivery: 'Tenant Admin, as the registry\'s completion owner — In-app' },
  { mod: '10', pos: 2, line: 33201, trigger: 'A skeletal record remains incomplete beyond the tenant\'s review interval', delivery: 'Tenant Admin — In-app and email' },
  { mod: '11', pos: 1, line: 33379, trigger: 'A submission enters the Approval Queue', delivery: 'Eligible Reviewers — In-app and email' },
  { mod: '11', pos: 2, line: 33380, trigger: 'A submission is returned with comments', delivery: 'The Author — In-app and email' },
  { mod: '11', pos: 3, line: 33381, trigger: 'A submission is advanced to release', delivery: 'The Release Authority — In-app and email' },
  { mod: '11', pos: 4, line: 33382, trigger: 'A submission ages beyond the tenant\'s review interval', delivery: 'The Quality Manager — In-app and email' },
  { mod: '11', pos: 5, line: 33383, trigger: 'The chain cannot be staffed at submission', delivery: 'The Author and the Tenant Admin — In-app and email' },
  { mod: '12', pos: 1, line: 33568, trigger: 'A notified-class version is published', delivery: 'The owner named on each Job running the prior version — In-app and email' },
  { mod: '12', pos: 2, line: 33569, trigger: 'The update window is about to lapse without a decision', delivery: 'The Job Owner, with the Quality Manager on the second notice — In-app and email' },
  { mod: '12', pos: 3, line: 33570, trigger: 'A patch version is published', delivery: 'Quality Manager, informational — In-app' },
  { mod: '12', pos: 4, line: 33571, trigger: 'A version is archived', delivery: 'Quality Manager and the Workflow\'s last Author — In-app' },
  { mod: '13', pos: 1, line: 33747, trigger: 'A qualification gate blocks a worker', delivery: 'Supervisor, through the standard escalation path — In-app and email' },
  { mod: '13', pos: 2, line: 33748, trigger: 'A second override in the same area in the same shift', delivery: 'Quality Manager — In-app and email' },
  { mod: '13', pos: 3, line: 33749, trigger: 'An active assignment is grandfathered and flagged by a requirement change', delivery: 'Supervisor of the affected area — In-app and email' },
  { mod: '13', pos: 4, line: 33750, trigger: 'A published override names a certification the tenant no longer maintains', delivery: 'Quality Manager — In-app and email' },
  { mod: '14', pos: 1, line: 33927, trigger: 'Package delivery to a device fails before the shift', delivery: 'Supervisor of the affected area — In-app and email' },
  { mod: '14', pos: 2, line: 33928, trigger: 'A package fails integrity verification and is quarantined', delivery: 'Supervisor and Quality Manager — In-app and email' },
  { mod: '14', pos: 3, line: 33929, trigger: 'Coaching assets were omitted for storage', delivery: 'Supervisor, informational — In-app' },
  { mod: '15', pos: 1, line: 34118, trigger: 'A composed agent fails the evaluation gate', delivery: 'The composing Agent Author — In-app and email' },
  { mod: '15', pos: 2, line: 34119, trigger: 'A composed agent is released and awaits platform review', delivery: 'Quality Manager — In-app' },
  { mod: '15', pos: 3, line: 34120, trigger: 'Platform review approves or declines', delivery: 'Quality Manager and the composing Agent Author — In-app and email' },
  { mod: '15', pos: 4, line: 34121, trigger: 'A capability a deployed composed agent depends on is disabled', delivery: 'Quality Manager and the composing Agent Author — In-app and email' },
  { mod: '16', pos: 1, line: 34315, trigger: 'A Lane-B proposal is raised', delivery: 'Quality Manager — In-app and email' },
  { mod: '16', pos: 2, line: 34316, trigger: 'A proposal reaches 30 days undecided and is stale-flagged', delivery: 'Quality Manager — In-app and email' },
  { mod: '16', pos: 3, line: 34317, trigger: 'An approved package-borne value auto-publishes a patch', delivery: 'Quality Manager, informational — In-app' },
  { mod: '16', pos: 4, line: 34318, trigger: 'A coaching asset is flagged for low resolution rate', delivery: 'Quality Manager — In-app and email' },
  { mod: '17', pos: 1, line: 34469, trigger: 'The completeness check blocks a locale at publication', delivery: 'The Author and the Release Authority — In-app and email' },
  { mod: '17', pos: 2, line: 34470, trigger: 'A locale variant is drafted and awaits review', delivery: 'The Author — In-app' },
  { mod: '18', pos: 1, line: 34653, trigger: 'An authoring grant is assigned or revoked', delivery: 'The affected user and the Quality Manager — In-app and email' },
  { mod: '18', pos: 2, line: 34654, trigger: 'The Agent Author capability is delegated or revoked', delivery: 'The affected user and the Quality Manager — In-app and email' },
  { mod: '18', pos: 3, line: 34655, trigger: 'The implementation team\'s temporary capacity is due for revocation', delivery: 'Tenant Admin and Quality Manager — In-app and email' },
]

/**
 * The one row of the eighteen cards' notification tables that states its own
 * absence. Excluded from the derived rows above by the source's own reason,
 * quoted from the cell, and asserted absent so a later paste cannot quietly
 * reintroduce it as a notification the source refuses to send.
 */
const STU_TRIGGER_DELIBERATELY_ABSENT = {
  moduleId: 'MOD-STU-01',
  position: 3,
  line: 31664,
  trigger: 'A request to define a foundation object is refused',
  reason:
    'Not applicable -- a refusal is audited, not notified; notifying every refusal would train ' +
    'users to ignore notifications',
}

/**
 * The measured per-card distribution of notifiable trigger rows. Asserted
 * against the table above in both directions, so a row moved between two
 * cards fails even though the total still adds up -- the total alone would
 * not catch it.
 */
const STU_TRIGGER_ROWS_PER_CARD = {
  '01': 2, '02': 4, '03': 3, '04': 2, '05': 3, '06': 2,
  '07': 5, '08': 2, '09': 2, '10': 2, '11': 5, '12': 4,
  '13': 4, '14': 3, '15': 4, '16': 4, '17': 2, '18': 3,
}

const STU_TRIGGER_REGISTER =
  'Studio module-card notification triggers (derived -- the frozen source states these as ' +
  'trigger rows on the eighteen MOD-STU-* cards of Chapter 20 and mints no NOTIF-* identifier ' +
  'for any of them)'
const NOTIF_IDENTIFIER_REGISTER = 'NOTIF-* identifiers from the identifier index'

/* ==================================================================== *
 * SLICE 10 TASK 13 — TWO NOTIFICATION REGISTERS SHARE ONE `NOTIF-*` KEY
 * SPACE, AND DEDUP-BY-IDENTIFIER SILENTLY DROPPED TWENTY-FIVE ROWS.
 *
 * The frozen source catalogues notifications twice and both catalogues
 * number from `NOTIF-001`:
 *
 *   - Chapter 27.7's notification catalog. Header L51686, separator L51687,
 *     body L51688-L51712. Twenty-five data rows.
 *   - Chapter 30C.2's notification-category catalog, thirteen family tables
 *     between L72948 and L73096. Eighty-seven data rows, `NOTIF-001`
 *     through `NOTIF-087`, contiguous.
 *
 * IT IS NOT A SUBSET. All twenty-five of Chapter 27.7's identifiers exist in
 * Chapter 30C.2 and not one of the twenty-five carries the same name in
 * both: `NOTIF-001` is "Subscription or tier lifecycle change" at L51688 and
 * "Tenant workspace activated" at L72950. `src/registry/signals.ts`
 * transcribes both and measures the name agreement at zero.
 *
 * WHAT THIS FILE USED TO DO, MEASURED. `idsWithPrefix` keys on the
 * identifier alone and `firstLine` takes the MINIMUM locator, so
 * `NOTIF-001`..`025` resolved to Chapter 27.7's lines and `NOTIF-026`..`087`
 * to Chapter 30C.2's. Eighty-seven plain rows — which reads as complete and
 * is a BLEND of two different assignments, with Chapter 30C.2's own first
 * twenty-five rows absent entirely.
 *
 * THE KEY IS NOW (register, identifier), which yields 25 + 87 = 112 plain
 * rows with no leftovers: measured against this build's own identifier
 * index, every one of the 87 plain identifiers has at least one locator
 * inside one of the two bodies, exactly one locator inside each body it
 * touches, and none falls outside both.
 *
 * THE COMPOSITE SPELLING REUSES `buildWorkflowsRegistry`'s, deliberately:
 * `${id}@L${line}`, and ONLY where the bare id is genuinely ambiguous — the
 * twenty-five that both registers claim. The other sixty-two keep their bare
 * id, so a screen naming `NOTIF-030` still demonstrates it. That is the same
 * rule and the same reason as the workflow keys: a bare `NOTIF-001` in a
 * source file cannot tell you which of two different notifications it means,
 * so it demonstrates neither, and the fifty composite rows read
 * `not-represented` on purpose rather than by accident.
 * ==================================================================== */
const NOTIF_REGISTER_BODIES = [
  {
    label:
      'Chapter 27.7 notification catalog (body L51688-L51712, 25 rows) -- the narrower of the ' +
      'two registers by its own description at L51609, and NOT a subset: it reuses ' +
      'NOTIF-001..NOTIF-025 for twenty-five DIFFERENT notifications',
    first: 51_688,
    last: 51_712,
  },
  {
    label:
      'Chapter 30C.2 notification-category catalog (thirteen family tables, body ' +
      'L72950-L73096, 87 rows) -- NOTIF-001..NOTIF-087, contiguous',
    first: 72_950,
    last: 73_096,
  },
]

const NOTIF_PLAIN_ID_RE = /^NOTIF-\d+$/

/**
 * One row per (register, identifier) pair for the plain `NOTIF-NNN`
 * identifiers, plus the unchanged mnemonic `NOTIF-*` rows.
 *
 * Every figure below is DERIVED and then asserted, never restated from a
 * brief: the per-register counts, the size of the overlap, and the total.
 * The overlap assertion is what makes this repair measurable — 25 is both
 * the number of rows the old key lost and the number of composite keys
 * minted, and a check on the total alone would be satisfied by any 112.
 */
function buildNotificationIdentifierRows() {
  const all = idsWithPrefixRaw('NOTIF-')
  const plain = all.filter(([id]) => NOTIF_PLAIN_ID_RE.test(id))
  const mnemonic = all.filter(([id]) => !NOTIF_PLAIN_ID_RE.test(id))

  const perRegister = NOTIF_REGISTER_BODIES.map(() => 0)
  const placements = []
  const unplaced = []
  for (const [id, lines] of plain) {
    const hits = []
    NOTIF_REGISTER_BODIES.forEach((body, index) => {
      const inBody = lines.filter((l) => l >= body.first && l <= body.last)
      if (inBody.length === 0) return
      perRegister[index] += 1
      hits.push({ index, body, sourceLine: Math.min(...inBody) })
    })
    if (hits.length === 0) {
      unplaced.push(id)
      continue
    }
    for (const hit of hits) {
      placements.push({
        // Ambiguous only when both registers claim it. Sixty-two of the
        // eighty-seven are claimed by one register and keep their bare id.
        id: hits.length > 1 ? `${id}@L${hit.sourceLine}` : id,
        bareId: id,
        sourceLine: hit.sourceLine,
        register: hit.body.label,
      })
    }
  }

  if (unplaced.length > 0) {
    throw new Error(
      `${unplaced.length} plain NOTIF-* identifier(s) fall inside neither register body ` +
        `(${unplaced.join(', ')}). The two bodies are the whole of this key space -- a row ` +
        'outside both means a body range moved or a third register exists, and it must not be ' +
        'assigned to a register by default.',
    )
  }

  const EXPECTED_PER_REGISTER = [25, 87]
  const EXPECTED_OVERLAP = 25
  const overlap = placements.filter((p) => p.id !== p.bareId).length / 2
  if (
    perRegister[0] !== EXPECTED_PER_REGISTER[0] ||
    perRegister[1] !== EXPECTED_PER_REGISTER[1] ||
    overlap !== EXPECTED_OVERLAP ||
    placements.length !== EXPECTED_PER_REGISTER[0] + EXPECTED_PER_REGISTER[1]
  ) {
    throw new Error(
      `Notification register split: expected ${EXPECTED_PER_REGISTER[0]} Chapter 27.7 rows + ` +
        `${EXPECTED_PER_REGISTER[1]} Chapter 30C.2 rows = ` +
        `${EXPECTED_PER_REGISTER[0] + EXPECTED_PER_REGISTER[1]} plain rows with ` +
        `${EXPECTED_OVERLAP} identifiers claimed by both, computed ${perRegister[0]} + ` +
        `${perRegister[1]} = ${placements.length} with ${overlap} claimed by both`,
    )
  }

  const rows = [
    ...placements.map((p) => ({
      id: p.id,
      sourceLine: p.sourceLine,
      status: statusForId(p.id),
      register: p.register,
    })),
    ...mnemonic.map(([id, lines]) => ({
      id,
      sourceLine: firstLine(lines),
      status: statusForId(id),
      register: NOTIF_IDENTIFIER_REGISTER,
    })),
  ]
  return { rows, plainCount: plain.length, mnemonicCount: mnemonic.length, overlap }
}

function buildStudioTriggerRows() {
  const rows = STU_NOTIFICATION_TRIGGERS.map((t) => {
    const id = `STU-TRIGGER-${t.mod}-${String(t.pos).padStart(2, '0')}`
    return {
      id,
      sourceLine: t.line,
      status: statusForId(id),
      label: t.trigger,
      purpose: t.delivery,
      surface: 'SURF-STU',
      moduleId: `MOD-STU-${t.mod}`,
      register: STU_TRIGGER_REGISTER,
      sourceClass: 'derived',
    }
  })

  // Derive, then assert the derived figures -- the shape buildModulesRegistry
  // uses for the 63 + 18 module split.
  const perCard = {}
  for (const r of rows) perCard[r.moduleId.slice(-2)] = (perCard[r.moduleId.slice(-2)] ?? 0) + 1
  const cards = Object.keys(perCard).sort()
  const expectedCards = Object.keys(STU_TRIGGER_ROWS_PER_CARD).sort()
  if (cards.join(',') !== expectedCards.join(',')) {
    throw new Error(
      `R19: expected trigger rows on all eighteen Studio cards ${expectedCards.join(',')}, ` +
        `computed ${cards.join(',')}`,
    )
  }
  for (const card of cards) {
    if (perCard[card] !== STU_TRIGGER_ROWS_PER_CARD[card]) {
      throw new Error(
        `R19: MOD-STU-${card} -- expected ${STU_TRIGGER_ROWS_PER_CARD[card]} notifiable trigger ` +
          `rows, computed ${perCard[card]}`,
      )
    }
  }
  // Named, so a planted wrong figure cannot print "expected 56 ... computed
  // 56" while failing -- the message must name the expectation the check
  // actually uses.
  const EXPECTED_NOTIFIABLE = 56
  const total = rows.length
  const distributionTotal = Object.values(STU_TRIGGER_ROWS_PER_CARD).reduce((a, b) => a + b, 0)
  if (total !== EXPECTED_NOTIFIABLE || distributionTotal !== EXPECTED_NOTIFIABLE) {
    throw new Error(
      `R19: expected ${EXPECTED_NOTIFIABLE} notifiable Studio trigger rows (57 rows on the ` +
        `eighteen cards less the one deliberate absence at ` +
        `L${STU_TRIGGER_DELIBERATELY_ABSENT.line}), computed ${total} from the table and ` +
        `${distributionTotal} from the per-card distribution`,
    )
  }

  // Content with no identifiers must not become content with INVENTED
  // identifiers. Neither the row ids nor the verbatim trigger text may carry
  // a NOTIF-* identifier, and the deliberate absence must stay absent.
  for (const r of rows) {
    if (/NOTIF-/.test(r.id) || /NOTIF-/.test(r.label)) {
      throw new Error(`R19: ${r.id} carries a NOTIF-* identifier the frozen source does not have`)
    }
    if (r.sourceLine < STU_CARD_BAND.first || r.sourceLine > STU_CARD_BAND.last) {
      throw new Error(
        `R19: ${r.id} cites L${r.sourceLine}, outside the Studio card band ` +
          `L${STU_CARD_BAND.first}-L${STU_CARD_BAND.last}`,
      )
    }
    if (r.sourceLine === STU_TRIGGER_DELIBERATELY_ABSENT.line) {
      throw new Error(
        `R19: L${STU_TRIGGER_DELIBERATELY_ABSENT.line} is the deliberately-absent row ` +
          `("${STU_TRIGGER_DELIBERATELY_ABSENT.reason}") and must never be registered`,
      )
    }
  }
  const ids = new Set(rows.map((r) => r.id))
  if (ids.size !== rows.length) {
    throw new Error(`R19: derived trigger ids collide -- ${rows.length} rows, ${ids.size} ids`)
  }
  const lines = new Set(rows.map((r) => r.sourceLine))
  if (lines.size !== rows.length) {
    throw new Error(`R19: two derived trigger rows cite the same source line`)
  }
  return rows
}

/**
 * `notifications.json` = the `NOTIF-*` identifier rows, keyed on (register,
 * identifier) rather than on the identifier alone, PLUS the 56 derived
 * Studio trigger rows above, each tagged with the `register` it belongs to
 * so nothing is silently merged -- the same disclosure
 * `actionable-controls` uses for the DNC-* register.
 *
 * `rawCount` stays the NOTIF-* EXTRACTION count (205 distinct identifier
 * strings) and is NOT restated as the row count, which is now higher than it
 * because twenty-five identifiers stand for two notifications each. The
 * count-scope rule at the head of this file forbids presenting one scope's
 * figure as another's, and this is the sharpest case of it in the tree.
 */
function buildNotificationsRegistry() {
  const countedThing =
    'NOTIF-* identifiers found in the identifier index, keyed on (register, identifier) -- a ' +
    "different scope from the source's 19 notification states or 2 channels, and a HIGHER row " +
    'count than the identifier count because the two catalogues share one key space and ' +
    'twenty-five identifiers name a different notification in each. No names were extracted ' +
    'for this family. Plus 56 DERIVED Studio notification-trigger rows (R19), which are ' +
    'trigger behaviours the frozen source states on the eighteen MOD-STU-* module cards ' +
    'without giving any of them a NOTIF-* identifier; the registers are tagged separately on ' +
    'every row and are never summed into one canonical total.'
  const split = buildNotificationIdentifierRows()
  const identifierRows = split.rows
  const studioRows = buildStudioTriggerRows()

  // The claim "none of the eighteen cards' trigger rows carries a NOTIF-*
  // identifier", re-derived from this build's own identifier index rather
  // than accepted from a brief: no NOTIF-* id has any locator in the band.
  const notifInBand = Object.entries(identifierIndex).filter(
    ([id, ls]) =>
      id.startsWith('NOTIF-') &&
      ls.some((l) => l >= STU_CARD_BAND.first && l <= STU_CARD_BAND.last),
  )
  if (notifInBand.length !== 0) {
    throw new Error(
      `R19: ${notifInBand.length} NOTIF-* identifiers now have a locator inside the Studio card ` +
        `band (${notifInBand.map(([id]) => id).join(', ')}). The derived rows exist precisely ` +
        'because the source names none there -- re-check before registering them as derived.',
    )
  }
  const studioIdentifierRows = identifierRows.filter((r) => /STU/.test(r.id))
  if (studioIdentifierRows.length !== 0) {
    throw new Error(
      `R19: the NOTIF-* register now holds ${studioIdentifierRows.length} Studio rows; the ` +
        'derived register below assumes it holds none.',
    )
  }

  const rows = [...identifierRows, ...studioRows]
  const rawIdentifierCount = split.plainCount + split.mnemonicCount
  return {
    slug: 'notifications',
    countedThing,
    reconciledCount: null,
    sourceFixesNoTotal: true,
    rows,
    // Deliberately NOT rows.length and deliberately not identifierRows.length
    // either: 205 is what the NOTIF-* extraction found, and the register
    // split turns 87 of those identifiers into 112 rows.
    rawCount: rawIdentifierCount,
    dedupRule: appendNote(
      `This registry holds three registers, tagged per row and never summed. (1) ` +
        `${split.plainCount + split.overlap} plain NOTIF-NNN rows keyed on (register, ` +
        'identifier), because TWO catalogues share this key space and both number from ' +
        `NOTIF-001: Chapter 27.7 (body L51688-L51712, 25 rows) and Chapter 30C.2's thirteen ` +
        `family tables (body L72950-L73096, 87 rows). ${split.overlap} identifiers are claimed ` +
        'by both and NOT ONE of them names the same notification in each -- NOTIF-001 is ' +
        '"Subscription or tier lifecycle change" at L51688 and "Tenant workspace activated" at ' +
        'L72950 -- so the overlap is a different assignment of one key space, not a shorter ' +
        `version of one. Keying on the identifier alone produced ${split.plainCount} rows that ` +
        `read as complete and were a BLEND: NOTIF-001..025 resolved to Chapter 27.7's lines and ` +
        "NOTIF-026..087 to Chapter 30C.2's, so Chapter 30C.2's own first twenty-five rows were " +
        `absent entirely. The ${split.overlap * 2} ambiguous rows carry the composite key ` +
        'NOTIF-NNN@L<line>, the same spelling and the same rule the workflow registry uses; the ' +
        'other 62 keep their bare identifier. A composite-keyed row reads not-represented on ' +
        'purpose -- a bare NOTIF-001 in a source file cannot say which of two notifications it ' +
        `means, so it demonstrates neither. (2) ${split.mnemonicCount} mnemonic NOTIF-* ` +
        'identifier strings (NOTIF-DOH-01-1, NOTIF-DEV-SEV1 and so on), which key on no shared ' +
        'space and are unchanged. The 19 notification states and the 2 channels are separate ' +
        'registers again and are not any of these numbers. (3) ' +
        `${studioRows.length} DERIVED Studio notification triggers (R19), one per notifiable ` +
        'row of the `**Notifications.**` table on each of the eighteen MOD-STU-* module cards ' +
        `(Chapter 20, L${STU_CARD_BAND.first}-L${STU_CARD_BAND.last}). Every one of the ` +
        'eighteen cards states triggers; not one of those rows carries a NOTIF-* identifier, ' +
        'and no NOTIF-* identifier has any locator inside that band, so none is minted here -- ' +
        'each derived row is `sourceClass: derived`, keyed STU-TRIGGER-<card>-<row position>, ' +
        'and carries its own card locator. The cards hold 57 trigger rows in total; ' +
        `MOD-STU-01 position ${STU_TRIGGER_DELIBERATELY_ABSENT.position} (L` +
        `${STU_TRIGGER_DELIBERATELY_ABSENT.line}) is EXCLUDED because the source itself makes ` +
        `it an absence -- "${STU_TRIGGER_DELIBERATELY_ABSENT.reason}" -- leaving ` +
        `${studioRows.length}. Per card: ` +
        // Sorted explicitly: '10'..'18' are canonical integer keys and '01'..
        // '09' are not, so object insertion order puts 10-18 first.
        Object.entries(STU_TRIGGER_ROWS_PER_CARD)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([c, n]) => `MOD-STU-${c} ${n}`)
          .join(', ') +
        '.',
      statusNote(rows, CITED_BY_A_SHIPPED_SCREEN),
    ),
  }
}

// ---------------------------------------------------------------------
// D11 -- three Studio object gaps, registered as a GAP LIST and not as rows.
//
// `OBJ-STU-QUALREQ`, `OBJ-STU-CAPSTATE` and `OBJ-STU-LOCALE` are Studio-owned
// objects the source names, gives lifecycle states, and assigns an owner --
// and none of them has a numeric counterpart in the closed OBJ-001..OBJ-099
// register. Three module tasks found them independently and all three
// declined to mint a number, which is the correct call: OBJ-1xx rows would
// inflate a ninety-nine the source closes (R23). They are disclosed here, in
// the prose the registry index already renders, rather than added to `rows`
// -- adding rows is how a closed count silently becomes 102.
// ---------------------------------------------------------------------
const STU_OBJECT_GAPS = [
  {
    id: 'OBJ-STU-QUALREQ',
    cardLocator: 'MOD-STU-13 Qualification Requirements, card L33604-L33782 (objects-affected L33653)',
    reason:
      'the numeric register\'s nearest row is OBJ-031 "Qualification" (L8418, owned by SURF-DOH) ' +
      '-- the certification a worker holds, not the requirement a Workflow states, so it is a ' +
      'different object and not a numeric counterpart',
  },
  {
    id: 'OBJ-STU-CAPSTATE',
    cardLocator: 'MOD-STU-15 The Agent Builder, card L33961-L34153 (objects-affected L34028)',
    reason:
      'the numeric register carries no capability, enablement or entitlement object at all, so ' +
      'there is no row to map onto',
  },
  {
    id: 'OBJ-STU-LOCALE',
    cardLocator: 'MOD-STU-17 Localisation, card L34351-L34499 (objects-affected L34391)',
    reason:
      'the numeric register\'s nearest row is OBJ-051 "Locale pack" (L8875, owned by SURF-SA) -- ' +
      'platform-side locale-pack governance, not the per-locale authored variant held inside one ' +
      'Workflow, so it is a different object and not a numeric counterpart',
  },
]

/**
 * D11's disclosure, derived from this build's own object extraction: each
 * mnemonic must be present in the raw OBJ-* set and absent from the numeric
 * OBJ-NNN set. If a future extraction wave mints a number for one of them,
 * the gap stops being a gap and this throws rather than going on claiming it.
 */
function studioObjectGapNote(rawObjIds, numericById) {
  for (const gap of STU_OBJECT_GAPS) {
    if (!rawObjIds.has(gap.id)) {
      throw new Error(`D11: ${gap.id} is no longer in the OBJ-* extraction; re-derive the gap list`)
    }
    if (numericById.has(gap.id)) {
      throw new Error(`D11: ${gap.id} is a numeric OBJ-NNN card now; it is no longer a gap`)
    }
  }
  if (STU_OBJECT_GAPS.length !== 3) {
    throw new Error(`D11: expected 3 Studio object gaps, computed ${STU_OBJECT_GAPS.length}`)
  }
  return (
    `Studio object gaps (D11), ${STU_OBJECT_GAPS.length} of them, registered as a GAP LIST and ` +
    'deliberately NOT as rows: minting OBJ-100..OBJ-102 for these would inflate a ninety-nine ' +
    'the source closes (R23), so the count above stays 99 and the gap is stated instead of ' +
    'papered over. ' +
    STU_OBJECT_GAPS.map(
      (g) => `${g.id} -- ${g.cardLocator}; no numeric row because ${g.reason}`,
    ).join('. ') +
    '. All three were found independently by three different Studio module tasks, and all three ' +
    'declined to mint a number.'
  )
}

// ---------------------------------------------------------------------
// D10 -- the two Studio feature schemes, mapped ONCE, in one table.
//
// The frozen source runs two parallel numbering schemes over the same Studio
// features and never reconciles them:
//
//   (a) Chapter 20's three-part scheme, inside the eighteen module cards --
//       FEAT-STU-01-01 / SUB-STU-01-01-A / FUNC-STU-01-01-A-1;
//   (b) the four-digit traceability catalogue at L47378-L47431 --
//       FEAT-STU-0101 / SUB-STU-0101 / FUNC-STU-0101, exactly three features
//       per module across all eighteen modules.
//
// THE FOUR-DIGIT CATALOGUE IS THE TRACEABILITY KEY -- same ruling and same
// reason as slice 4's D20. The two are never mixed in a ticket, and the map
// below is why that rule is not merely tidiness: the schemes DO NOT
// correspond positionally. Ten of the eighteen modules disagree on how many
// features they have, so `FEAT-STU-05-02` is not `FEAT-STU-0502` and reading
// one as the other silently retargets the reference.
// ---------------------------------------------------------------------
const FEAT_STU_FOUR_DIGIT_RE = /^FEAT-STU-(\d{2})(\d{2})$/
const FEAT_STU_THREE_PART_RE = /^FEAT-STU-(\d{2})-(\d{2})$/

function studioFeatureSchemeNote() {
  const byCard = {}
  for (const id of Object.keys(identifierIndex)) {
    const four = FEAT_STU_FOUR_DIGIT_RE.exec(id)
    const three = FEAT_STU_THREE_PART_RE.exec(id)
    const card = four?.[1] ?? three?.[1]
    if (card === undefined) continue
    byCard[card] ??= { four: [], three: [] }
    byCard[card][four ? 'four' : 'three'].push(id)
  }
  const cards = Object.keys(byCard).sort()
  for (const c of cards) {
    byCard[c].four.sort()
    byCard[c].three.sort()
  }
  const fourTotal = cards.reduce((n, c) => n + byCard[c].four.length, 0)
  const threeTotal = cards.reduce((n, c) => n + byCard[c].three.length, 0)
  const divergent = cards.filter((c) => byCard[c].three.length !== byCard[c].four.length)

  if (cards.length !== 18) {
    throw new Error(`D10: expected 18 Studio module cards in the feature schemes, computed ${cards.length}`)
  }
  for (const c of cards) {
    if (byCard[c].four.length !== 3) {
      throw new Error(
        `D10: the four-digit catalogue fixes exactly three features per module; MOD-STU-${c} ` +
          `has ${byCard[c].four.length}`,
      )
    }
  }
  // Named, so the message cannot drift from the check it reports -- a planted
  // wrong figure printed "expected 54 ... computed 54" while failing, which
  // is a gate telling the truth in the assertion and a lie in the diagnosis.
  const EXPECTED_FOUR_DIGIT = 54
  const EXPECTED_THREE_PART = 69
  if (fourTotal !== EXPECTED_FOUR_DIGIT || threeTotal !== EXPECTED_THREE_PART) {
    throw new Error(
      `D10: expected ${EXPECTED_FOUR_DIGIT} four-digit catalogue features (18 x 3) and ` +
        `${EXPECTED_THREE_PART} Chapter 20 three-part features, computed ${fourTotal} and ` +
        `${threeTotal}`,
    )
  }
  if (divergent.length !== 10) {
    throw new Error(
      `D10: expected 10 of 18 modules where the two schemes disagree on feature count, computed ` +
        `${divergent.length} (${divergent.join(', ')})`,
    )
  }
  // The SUB-/FUNC- halves of Chapter 20's three-part scheme (SUB-STU-01-01-A,
  // FUNC-STU-01-01-A-1) are IN the frozen source but absent from this build's
  // identifier index -- a real extraction gap, declared rather than hidden.
  // Asserted at zero so the day the extraction is widened, this goes red and
  // the map gets extended instead of quietly under-reporting.
  const threePartSub = Object.keys(identifierIndex).filter((id) =>
    /^SUB-STU-\d{2}-\d{2}-[A-Z]$/.test(id),
  ).length
  const threePartFunc = Object.keys(identifierIndex).filter((id) =>
    /^FUNC-STU-\d{2}-\d{2}-[A-Z]-\d+$/.test(id),
  ).length
  if (threePartSub !== 0 || threePartFunc !== 0) {
    throw new Error(
      `D10: the identifier index now carries ${threePartSub} three-part SUB-STU-* and ` +
        `${threePartFunc} three-part FUNC-STU-* ids; extend the scheme map to cover them.`,
    )
  }

  return (
    'Studio feature schemes (D10), mapped once, here, and nowhere else. The Studio module count ' +
    'used throughout this note is a DERIVED COUNT, not stated in the Statement of Work: L30897 ' +
    'records that the Statement of Work provides no canonical module count for this surface, and ' +
    'the eighteen come from one stated derivation rule under DEC-STUDIO-001 [Derived ' +
    'Clarification]. AC-STU-014 binds this note as much as it binds a screen. The frozen source ' +
    'runs TWO numbering schemes over the same Studio features: Chapter 20\'s three-part scheme ' +
    `inside the eighteen module cards (FEAT-STU-01-01 style, ${threeTotal} ids, L${STU_CARD_BAND.first}-` +
    `L${STU_CARD_BAND.last}), and the four-digit traceability catalogue at L47378-L47431 ` +
    `(FEAT-STU-0101 style, ${fourTotal} ids, exactly three per module across all 18 modules). ` +
    'THE FOUR-DIGIT CATALOGUE IS THE TRACEABILITY KEY (same ruling and reason as slice 4\'s ' +
    'D20); the two are never mixed in one ticket. They are NOT positionally equivalent -- ' +
    `${divergent.length} of the 18 modules (${divergent.map((c) => `MOD-STU-${c}`).join(', ')}) ` +
    'disagree on how many features they hold, so reading FEAT-STU-05-02 as FEAT-STU-0502 ' +
    'retargets the reference. The map: ' +
    cards
      .map(
        (c) =>
          `MOD-STU-${c} ch20 [${byCard[c].three.map((i) => i.slice(9)).join(' ')}] -> ` +
          `catalogue [${byCard[c].four.map((i) => i.slice(9)).join(' ')}]`,
      )
      .join('; ') +
    `. The SUB-/FUNC- halves of the three-part scheme (SUB-STU-01-01-A, FUNC-STU-01-01-A-1) are ` +
    'in the frozen source but absent from this build\'s identifier index, which carries only ' +
    'their four-digit forms; that extraction gap is declared here, not hidden, and the map ' +
    'covers FEAT-* only until the extraction is widened.'
  )
}

// ---------------------------------------------------------------------
// Actionable controls (fix round 1): the SEMANTIC `controls[]` extraction
// category -- 759 raw entries, each carrying `label`/`surface`/`module_id`/
// `allowed_roles`/`effect`/`line` and NO `id` field at all -- is the real
// actionable-control catalogue, deduped by exact label text (first
// occurrence, chunk order, wins) to 605 distinct controls. R7-A10: THIS USED
// TO CLAIM THAT 605 MATCHED SPEC §2.10, AND §2.10 DISAGREES. Its availability table
// reads `| actionable controls | semantic extraction | 608 keyed |` and says
// nothing anywhere about excluding rendered messages; what it does say is the
// count-scope rule this figure obeys, "A raw key count is not a canonical
// count". 605 is that 608 less the three deduped labels R6-B01 excluded by
// source line. `DNC-*` (the do-not-use-cron register, 22, identifier-index only)
// is a real, separate, reconciled inventory -- scheduling policy, never an
// actionable control -- and is disclosed on the same index under its own
// `register` tag rather than occupying this slug's main count or being
// dropped for lack of a fifteenth slug to hold it.
// ---------------------------------------------------------------------
const ACTIONABLE_CONTROLS_REGISTER = 'actionable controls (surface action catalogue)'
const DO_NOT_USE_CRON_REGISTER = 'do-not-use-cron controls (DNC-01..DNC-22, scheduling policy)'

/* ====================================================================
 * R4-B04 — THE TWO DIMENSIONS MASTER PROMPT §13.1 ASKS THE CENSUS TO COUNT
 * BY, CARRIED THROUGH INSTEAD OF DISCARDED.
 *
 * Master prompt §13.1 requires "counts by surface, module, control type, and
 * implementation status". Before this change the census could compute two of
 * the four: `moduleId` was present on 0 of the 627 rows and `surface` was the
 * extraction's raw free text.
 *
 * The data was never missing upstream. `registries/raw/extract/CHK-*.json`
 * carries `module_id` on 653 of its 759 control entries and the generator
 * simply dropped the field on the way into the row.
 *
 * WHAT IS AND IS NOT NORMALISED, measured rather than asserted.
 *
 *   module_id — 759 raw entries carry 202 distinct values. 349 are exactly a
 *   canonical `MOD-<SURFACE>-<NN|AN>` id; 14 more name two or three modules in
 *   one cell ("MOD-CC-02 / MOD-CC-03"); the remaining 290 are prose ("Audit
 *   log", "Conflict-review panel", "Frontline module A2 — My Runs"). Only an
 *   EXACT single canonical id becomes `moduleId`. A cell naming several is
 *   ambiguous and a prose cell is not an id at all, so both are carried
 *   verbatim in `moduleDescriptor` instead — disclosed, never dropped, and
 *   never guessed into a canonical id the extraction did not write.
 *
 *   surface — 736 of 759 raw entries already carry a canonical `SURF-*` code.
 *   The other 23 are prose or a qualified code, and every one of them is
 *   mapped by the table below, which is EXHAUSTIVE: a value it does not cover
 *   throws rather than falling through to a guess or to `null`. Two of them
 *   genuinely name more than one surface and normalise to `cross-surface`,
 *   which is a real value in this vocabulary and not a bucket for the
 *   unmatched.
 *
 * CONTROL TYPE IS NOT DERIVED, AND THAT IS THE FINDING RATHER THAN A GAP IN
 * THE FIX. The raw extraction's control entries carry exactly six fields —
 * label, surface, module_id, allowed_roles, effect, line — and none of them
 * is a type. Master prompt §13.1 names two dozen control kinds (search,
 * filters, sorts, tabs, pagination, drill-down, breadcrumbs, chart points,
 * timeline entries, notification rows, cards, table rows, menu items, context
 * actions, drag-and-drop, import/export, reset, role switch, locale/theme
 * switch, simulated connectivity, failure injection, story navigation, review
 * controls) and the frozen source classifies none of the 605 against them.
 * Inventing a taxonomy and running the 605 labels through a keyword guess
 * would produce a column that looks like source truth and is this build's own
 * opinion — the exact defect the census exists to prevent. So the absence is
 * published on the index page and recorded as the delta in the
 * actionable-controls reconciliation row.
 * ==================================================================== */
const CONTROL_SURFACE_NORMALISATION = new Map([
  ['Client Command Center', 'SURF-CC'],
  ['Client Command Center sync-conflict review panel', 'SURF-CC'],
  ['Client Command Center deviation workspace', 'SURF-CC'],
  ['Client Command Center gate queue and learned-change queue', 'SURF-CC'],
  ['Frontline Worker Application', 'SURF-FL'],
  ['Delivery Operations Hub', 'SURF-DOH'],
  ['SURF-DOH (tenant banner)', 'SURF-DOH'],
  ['SURF-DOH / tenant-visible support access control', 'SURF-DOH'],
  ['Super Admin platform console', 'SURF-SA'],
  ['Standards and Operations Studio', 'SURF-STU'],
  ['SURF-CC-wide', 'SURF-CC'],
  // The two that genuinely name more than one surface. `cross-surface` is a
  // value the source supports here -- a handoff is rendered by every surface
  // that participates in it -- not a bucket for what did not match.
  ['all surfaces rendering a handoff', 'cross-surface'],
  [
    'Delivery Operations Hub (tenant banner); also Studio and Client Command Center',
    'cross-surface',
  ],
])
const CANONICAL_SURFACE_ID_RE = /^SURF-(DOH|CC|FL|SA|STU)$/

function normaliseControlSurface(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  if (CANONICAL_SURFACE_ID_RE.test(raw)) return raw
  const mapped = CONTROL_SURFACE_NORMALISATION.get(raw)
  if (mapped === undefined) {
    throw new Error(
      `Unmapped control surface "${raw}". The normalisation table in build-registries.mjs is ` +
        'exhaustive by design: add the mapping rather than letting the row fall through to a ' +
        'guess or to no surface at all.',
    )
  }
  return mapped
}

function normaliseControlModule(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return { moduleId: null, descriptor: null }
  const trimmed = raw.trim()
  if (CANONICAL_MODULE_ID_RE.test(trimmed)) return { moduleId: trimmed, descriptor: null }
  return { moduleId: null, descriptor: trimmed }
}

/* ──────────────────────────────────────────────────────────────────────
 * R6-B01 — a census row must be a CONTROL, and three of them were not.
 *
 * The extraction lifted three sentence-shaped runs that the frozen source
 * describes as RENDERED MESSAGES rather than actions, and the census
 * counted them as actionable controls. All three source lines were opened:
 *
 *   L13538  "Run interruption is a floor action and is not available from
 *           this surface." -- the panel "carries a short line", in a
 *           passage whose whole point is that the Command Center run
 *           drill-down "offers no pause, stop, or edit control anywhere".
 *   L41894  "Changed in this version." -- "a small in-situ flag reads ...".
 *           (The audit missed this one; the same storyboard's real control,
 *           the single "Start", stays.)
 *   L42209  "The Training Library needs a connection. It is not needed for
 *           any of your runs." -- the destination "shows a single line
 *           reading ...", explicitly "not an empty list, and not an error
 *           code".
 *
 * The rule is deterministic and deliberately narrow: strip the quotes ONLY
 * where the label is WHOLLY quoted, then exclude what ends in a period. A
 * label is a control label, and control labels do not end in full stops.
 *
 * WHY NOT A NAIVE TRAILING-QUOTE STRIP: it catches a fourth row,
 * `In-app locked control with the text "Always on. In-app notifications
 * cannot be turned off."` (L73228), and excluding that one would be wrong.
 * The source's own word there is "control" -- "In-app renders as a locked
 * control with the text ..." -- master prompt §13.1 names notification rows
 * as census members, and round 6's R6-C01 settled that a locked entry whose
 * attempt fails with a stated reason is this build's canonical DISABLED
 * rendering, which is a control and not an absence. The label is not wholly
 * quoted, so the rule leaves it where it belongs: in the census.
 *
 * The count is asserted at exactly 3 below, so the rule cannot quietly grow
 * into a heuristic that eats real controls.
 * ────────────────────────────────────────────────────────────────────── */
const CONTROL_EXCLUSION_LINES = [13538, 41894, 42209]

function isRenderedMessageNotAControl(label) {
  if (typeof label !== 'string') return false
  const trimmed = label.trim()
  const unquoted =
    trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed
  return unquoted.endsWith('.')
}

function buildActionableControlsRegistry() {
  const rawControls = []
  for (const chunk of chunks) {
    for (const c of chunk.controls ?? []) rawControls.push(c)
  }
  const byLabel = new Map()
  const excludedMessages = new Map()
  for (const c of rawControls) {
    if (byLabel.has(c.label)) continue // first occurrence (chunk order) wins
    if (isRenderedMessageNotAControl(c.label)) {
      if (!excludedMessages.has(c.label)) excludedMessages.set(c.label, c.line)
      continue
    }
    const surface = normaliseControlSurface(c.surface)
    const { moduleId, descriptor } = normaliseControlModule(c.module_id)
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
      // R4-B04: normalised, never the extraction's raw free text, and the
      // raw text is kept beside it wherever normalisation changed it.
      ...(surface !== null && { surface }),
      ...(surface !== null && surface !== c.surface && { surfaceDescriptor: c.surface }),
      ...(moduleId !== null && { moduleId }),
      ...(descriptor !== null && { moduleDescriptor: descriptor }),
      register: ACTIONABLE_CONTROLS_REGISTER,
    })
  }
  const controlRows = [...byLabel.values()]
  // R6-B01: the exclusion is asserted, not trusted -- by count AND by the
  // three source lines it is allowed to remove. A fourth sentence-shaped
  // label appearing in the extraction reds the build rather than silently
  // shrinking the §13.1 denominator.
  const excludedLines = [...excludedMessages.values()].sort((a, b) => a - b)
  if (
    excludedMessages.size !== 3 ||
    excludedLines.join(',') !== CONTROL_EXCLUSION_LINES.join(',')
  ) {
    throw new Error(
      `Expected exactly 3 rendered-message exclusions at lines ` +
        `${CONTROL_EXCLUSION_LINES.join(', ')}, computed ${excludedMessages.size} at ` +
        `${excludedLines.join(', ') || 'none'}: ` +
        `${[...excludedMessages.keys()].map((l) => JSON.stringify(l)).join(' | ')}`,
    )
  }
  if (controlRows.length !== 605) {
    throw new Error(`Expected 605 distinct actionable controls, computed ${controlRows.length}`)
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
      '605 distinct actionable UI controls (labelled actions like "End-session", "Resolve ' +
      'All", "Request release with a note"), deduped by exact label text from 759 raw ' +
      'extraction entries and less the three rendered messages the source describes as lines ' +
      'rather than actions. Spec §2.10 fixes this inventory at "608 keyed" and says nothing ' +
      'about rendered messages; 605 is that 608 less R6-B01\'s three, under §2.10\'s own rule ' +
      'that a raw key count is not a canonical count. Also discloses, under its own register tag, ' +
      'the separate DNC-01..DNC-22 do-not-use-cron register (22): scheduling policy, never an ' +
      'actionable control, and never merged into this count.',
    reconciledCount: 605,
    rawCount: rawControls.length,
    dedupRule: appendNote(
      `${rawControls.length} raw controls[] entries across the 36 extraction chunks deduped ` +
        'by exact label text (first occurrence, chunk order, wins) -> 605 distinct actionable ' +
        'controls. R7-A10: THE CITATION HERE CLAIMED 605 MATCHED SPEC §2.10, AND §2.10 SAYS 608. ' +
        'Its availability table reads "| actionable controls | semantic extraction | 608 keyed |" ' +
        'and mentions rendered messages nowhere. What §2.10 does supply is the rule this figure ' +
        'obeys -- "A raw key count is not a canonical count" -- and 605 is that 608 less the ' +
        'three labels R6-B01 excluded, each asserted by its own source line below. ' +
        'Worst collapse: 14 raw entries sharing one label ' +
        '("Request release with a note"). R6-B01: THREE DEDUPED LABELS ARE EXCLUDED BECAUSE ' +
        'THE FROZEN SOURCE DESCRIBES THEM AS RENDERED MESSAGES RATHER THAN ACTIONS, so the ' +
        'census counts controls and not the lines a screen prints -- L13538 "Run interruption ' +
        'is a floor action and is not available from this surface." (the panel "carries a ' +
        'short line", where the drill-down "offers no pause, stop, or edit control anywhere"), ' +
        'L41894 "Changed in this version." ("a small in-situ flag reads"), and L42209 "The ' +
        'Training Library needs a connection. It is not needed for any of your runs." (the ' +
        'destination "shows a single line reading"). The rule strips enclosing quotes only ' +
        'where a label is wholly quoted and then drops what ends in a period, and the ' +
        'generator throws unless it removes exactly those three lines. The L73228 in-app ' +
        'locked control is NOT excluded: the source calls it a control, and a locked entry ' +
        'whose attempt fails with a stated reason is a DISABLED rendering rather than an ' +
        'absence. DNC-01..DNC-22 (verified unique, zero delta) is a ' +
        'SEPARATE inventory -- scheduling policy, not an actionable control -- and is listed ' +
        `under the "${DO_NOT_USE_CRON_REGISTER}" register tag rather than mixed into this count. ` +
        // R4-B04, measured on the written rows rather than asserted.
        `THE FOUR CENSUS DIMENSIONS MASTER PROMPT §13.1 ASKS FOR, AND WHICH OF THEM THIS ` +
        `EXTRACTION CAN ANSWER. Surface: ${controlRows.filter((r) => r.surface !== undefined).length} ` +
        `of 605 rows carry a normalised surface (` +
        `${controlRows.filter((r) => r.surface === 'cross-surface').length} of them cross-surface), ` +
        `and ${controlRows.filter((r) => r.surfaceDescriptor !== undefined).length} of those were ` +
        'prose in the extraction and are normalised here with the raw wording kept beside them. ' +
        `Module: ${controlRows.filter((r) => r.moduleId !== undefined).length} rows carry a ` +
        `canonical MOD-* id; ${controlRows.filter((r) => r.moduleDescriptor !== undefined).length} ` +
        'name their module in prose or name several at once, and carry that text verbatim rather ' +
        `than a guessed id; ${controlRows.filter((r) => r.moduleId === undefined && r.moduleDescriptor === undefined).length} ` +
        'record no module at all. Implementation status: every row. CONTROL TYPE: NO ROW, AND ' +
        'NOT BECAUSE THE GENERATOR DROPS IT. The frozen source classifies none of these 605 ' +
        'controls by type -- the extraction records label, surface, module, allowed roles, ' +
        'effect and line, and the source names no type for any of them. A type column here ' +
        'would be this build\'s own taxonomy presented in a source-derived census, so the ' +
        'dimension is declared absent instead of invented, and the reconciliation row for this ' +
        'inventory carries it as its delta.',
      statusNote(
        [...controlRows, ...dncRows],
        'a shipped route screen declares a control-matrix row whose `control:` label is EXACTLY ' +
          'this source label (the 605 control rows), or names the identifier as a whole token ' +
          `(the DNC-* rows). This is the weakest of the fourteen signals and says so: the built ` +
          `screens declare ${ROUTE_EVIDENCE.declaredControlLabels.size} control-matrix labels ` +
          `(${ROUTE_EVIDENCE.appDeclaredControlLabels.size} in a route file under app/ and ` +
          `${ROUTE_EVIDENCE.declaredControlLabels.size - ROUTE_EVIDENCE.appDeclaredControlLabels.size} ` +
          'only in the module components under src/ that those routes mount -- the scan behind ' +
          'this figure read app/ alone until audit round 4 finding R4-B03, and published 83 and ' +
          '4 where the two trees together hold what is printed here), of ' +
          `which ${[...ROUTE_EVIDENCE.declaredControlLabels].filter((l) => byLabel.has(l)).length} ` +
          'are word-for-word a source label. ' +
          /* ────────────────────────────────────────────────────────────────
           * R5-B03 — THE TWO-WAY CLOSURE, MEASURED IN BOTH DIRECTIONS AND
           * RENDERED, BECAUSE THE RECONCILIATION ROW USED TO DECLARE IT MET.
           *
           * `reconciliation_rows[17]` read "The census closes both ways as
           * master prompt §13.1 requires". It does not close in either
           * direction, and neither distance was rendered anywhere -- a
           * `grep -c` for both numbers over the built page returns 1 each and
           * both hits are React row keys inside the flight payload, which is
           * not something a reader sees. Both figures are DERIVED here rather
           * than written into the authored reconciliation row, so neither can
           * go stale, and the row now points at them instead of claiming the
           * closure.
           *
           * R5-A07 also lands in this sentence: it used to say the non-census
           * labels are "the same control re-worded for a reader", which was
           * false of the four `Record<Kind, string>` captions the scan was
           * miscounting and is a claim this build cannot make about the rest
           * either. It states the distance instead of characterising it.
           * ──────────────────────────────────────────────────────────────── */
          'THE §13.1 CENSUS DOES NOT CLOSE IN EITHER DIRECTION, and the two distances are ' +
          `published here rather than claimed. Direction one, rendered controls outside the ` +
          `census: ${[...ROUTE_EVIDENCE.declaredControlLabels].filter((l) => !byLabel.has(l)).length} ` +
          'of the declared labels above match no census row word for word. Some are the same ' +
          'control re-worded for a reader and this build does not claim that all of them are -- ' +
          'the join is exact label text and nothing weaker is available. Direction two, census ' +
          `rows with neither a rendered control nor a terminal record: ` +
          `${controlRows.filter((r) => r.status === 'not-represented').length} of the 605. ` +
          `The ${dncRows.length} DNC-* rows carry an authored terminal record and are counted in ` +
          'neither direction. The frozen source gives these actions no identifier -- the label IS the key -- ' +
          'so there is nothing else to join on, and a looser match was rejected: the 605 labels ' +
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
/*
 * ── THE CHAPTER IN A REGISTER LABEL IS NOW MEASURED, NOT ASSERTED (C-28) ───
 *
 * Every `SB-AI-*` row shipped the label "Chapter 44, 48 total" and 19 of the
 * 48 are not in chapter 44: binding each row's `sourceLine` to its enclosing
 * `^# N\.` heading gives 17 in chapter 40, 1 in chapter 41, 1 in chapter 30D
 * and 29 in chapter 44. Two separate defects produced that:
 *
 *   1. `SB-AI-*` is TWO registers, not one. The two-digit `SB-AI-NN` ids are
 *      section 44A's thirty storyboards; the three-digit `SB-AI-NNN` ids are
 *      chapter 40/41's agent and configuration-lifecycle storyboards. One
 *      `startsWith('SB-AI-')` test merged them and then labelled all 48 with
 *      one chapter.
 *   2. `SB-AI-01`'s row pointed at L74479, chapter 30D's Command Center
 *      agent-activity panel, because `sourceLine` is the FIRST occurrence
 *      anywhere and `SB-AI-01` has three (74479, 92693, 92793). Its 29
 *      siblings point at the §44A index table. That is C-29, and a flat
 *      inventory silently committing to one of several homes is the exact
 *      failure `src/coverage/uninventoried.ts` reason 2 argues against.
 *
 * Both are fixed by giving a register a BAND as well as a label, and the band
 * does the work of both fixes: the row's line is the first occurrence INSIDE
 * its own register's chapter, and `assertStoryboardBands` below throws if any
 * row lands outside the chapter its label claims. So the label can no longer
 * drift from the data — a wrong chapter is a build failure, not a rendered
 * sentence nobody rechecks.
 *
 * The bands are chapter heading lines in the frozen source
 * (sha256 47bd18db…, 122,241 lines), each the `^# N\.` line for the chapter
 * and the line before the next chapter's heading:
 *   ch 30 L60895 (next: 30A at L66118) · ch 40 L85974 · ch 41 L88020
 *   (next: 42 at L88993) · ch 44 L91386 (next: 45 at L95410).
 * They are literals because this script may not read the blueprint: it runs
 * from `registries/raw/` alone, on a clean clone where the frozen source is
 * not present. The invariant below is what keeps them honest.
 */
const STORYBOARD_REGISTERS = [
  {
    match: (id) => /^SB-\d{3}$/.test(id),
    label: 'platform storyboard catalogue (SB-NNN, Chapter 30, 30 total)',
    band: { first: 60895, last: 66117 },
  },
  {
    match: (id) => /^SB-AI-\d{2}$/.test(id),
    label: 'AI / fallback storyboards (SB-AI-NN, Chapter 44 section 44A, 30 total)',
    band: { first: 91386, last: 95409 },
  },
  {
    match: (id) => /^SB-AI-\d{3}$/.test(id),
    label:
      'agent and configuration-lifecycle storyboards (SB-AI-NNN, Chapters 40-41, 18 total) -- a ' +
      'DIFFERENT register from the thirty section-44A storyboards above, and not transcribed by ' +
      'this build',
    band: { first: 85974, last: 88992 },
  },
  {
    match: (id) => id.split('-').length === 3,
    label:
      'storyboard sub-panels and mnemonic identifiers (SB-*-NN, 3-segment, non-AI, 490 total)',
    band: null,
  },
  {
    match: () => true,
    label: 'further-nested storyboard identifiers (4-segment SB-*, 45 total)',
    band: null,
  },
]

function storyboardRegister(id) {
  const found = STORYBOARD_REGISTERS.find((r) => r.match(id))
  if (found === undefined) throw new Error(`No storyboard register matches ${id}`)
  return found
}

/**
 * The row's line, preferring the first occurrence inside its own register's
 * chapter over the first occurrence anywhere. Falls back to the global first
 * when the register has no band or the id occurs nowhere inside it; the
 * invariant below then reports the fallback rather than hiding it.
 */
function storyboardSourceLine(register, lines) {
  if (register.band === null) return firstLine(lines)
  const inBand = lines.filter((l) => l >= register.band.first && l <= register.band.last)
  return inBand.length === 0 ? firstLine(lines) : Math.min(...inBand)
}

/** A label claiming a chapter must be a label whose rows are in it. */
function assertStoryboardBands(rows) {
  const strays = rows.filter((r) => {
    const band = storyboardRegister(r.id).band
    return band !== null && (r.sourceLine < band.first || r.sourceLine > band.last)
  })
  if (strays.length > 0) {
    throw new Error(
      `${strays.length} SB-* row(s) cite a line outside the chapter their register label ` +
        'claims, which is how "Chapter 44, 48 total" shipped over 19 rows that were not in ' +
        'chapter 44: ' +
        strays.map((r) => `${r.id}@L${r.sourceLine} (${r.register})`).join('; '),
    )
  }
}

/**
 * The 18 chapter-40/41 rows read `not-represented` and, until C-32, carried no
 * reason for it — while `SB-AI-*`'s sibling thirty are transcribed card by
 * card. The reason is structural rather than a shortfall, so it is stated.
 */
const STORYBOARD_STATUS_REASONS = new Map([
  [
    'agent and configuration-lifecycle storyboards',
    'Chapters 40 and 41, a different register from the thirty section-44A storyboards this ' +
      'build transcribed. No route names one, and none was in scope: slice 11 built §44A. The ' +
      'row is here so the register is visible, not because a screen was expected to demonstrate ' +
      'it.',
  ],
])

function buildAiStoryboardsRegistry() {
  const raw = idsWithPrefixRaw('SB-')
  const rows = raw.map(([id, lines]) => {
    const register = storyboardRegister(id)
    const status = statusForId(id)
    const reason =
      status === 'not-represented'
        ? STORYBOARD_STATUS_REASONS.get(register.label.split(' (')[0])
        : undefined
    return {
      id,
      sourceLine: storyboardSourceLine(register, lines),
      status,
      register: register.label,
      ...(reason === undefined ? {} : { statusReason: reason }),
    }
  })
  if (rows.length !== 613) {
    throw new Error(`Expected 613 SB-* identifiers, found ${rows.length}`)
  }
  assertStoryboardBands(rows)
  const byRegister = new Map()
  for (const r of rows) byRegister.set(r.register, (byRegister.get(r.register) ?? 0) + 1)
  return {
    slug: 'ai-storyboards',
    // THE REGISTER COUNT IS INTERPOLATED, NEVER TYPED. It read "four" while
    // STORYBOARD_REGISTERS held five and the rows below grouped into five --
    // audit C-28's repair split SB-AI-* by id width and this summary line did
    // not follow, so the sentence and the table under it on
    // `app/coverage/[registry]/page.tsx` gave different answers on one page.
    // A count typed beside a derived list is the defect, not the number.
    countedThing:
      `every SB-* identifier in the identifier index (${rows.length}), split across ` +
      `${byRegister.size} separate, clearly labelled registers -- never scoped down to just one ` +
      'of them. No names were extracted for this family.',
    reconciledCount: null,
    rawCount: rows.length,
    dedupRule: appendNote(
      `SB-* splits into ${byRegister.size} non-overlapping registers by id shape: ` +
        [...byRegister.entries()].map(([register, count]) => `${count} ${register}`).join('; ') +
        '. Two distinct thirty-item registers exist (SB-001..030 platform walkthroughs and ' +
        'SB-AI-01..30 AI storyboards), and audit C-28 split SB-AI-* by id width, which is what ' +
        'makes the count above what it is rather than four; the source fixes no combined total ' +
        'across them.',
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

/**
 * A CITATION OF A BLANK LINE IS ALWAYS WRONG (audit round 4, finding R4-06).
 *
 * The workflow extractor records the line a passage BEGINS on, and for a
 * passage introduced by a bold heading it recorded the blank line between the
 * heading and step 1. Three of the 5,018 `sourceLine` fields the seventeen
 * generated registries carry landed on a blank line that way, and two of the
 * three were then printed to a reader as the workflow's identity, because a
 * placeholder-id row is keyed `${id}@L${sourceLine}`.
 *
 * `locator-fidelity`'s doctrine already calls this wrong; it could not see it,
 * because it scans `src`/`app`/`tests`/`scripts` and these are bare numbers in
 * `registries/generated`. So the fix is at the extractor, and the assertion
 * that keeps it fixed is in `tests/coverage/rendered-absence-claims.test.ts`.
 *
 * Walking UP rather than down: the line that names a passage is the heading
 * above it, never the first step below it. All three cases are exactly one
 * blank line under their heading -- L101682, L34885, L95238.
 */
const BLUEPRINT_LINES = readFileSync(
  join(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md'),
  'utf8',
).split('\n')

function anchorToHeading(line) {
  let n = line
  while (n > 1 && (BLUEPRINT_LINES[n - 1] ?? '').trim() === '') n -= 1
  return n
}

function collectRawWorkflows() {
  const raw = []
  for (const chunk of chunks) {
    for (const wf of chunk.workflows ?? []) raw.push({ ...wf, line: anchorToHeading(wf.line) })
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
/* ====================================================================
 * R4-B07 — THE FOUR §10.5 DIMENSIONS THE WORKFLOW INDEX DID NOT SHIP.
 *
 * Master prompt §10.5 requires the Workflow Index to list every workflow with
 * its ID, plain-language name, owning surface and module, initiating and
 * participating roles, primary objects, implementation status and variant
 * coverage summary, filterable by each. The index shipped four of the eight.
 *
 * ONE OF THE FOUR IS DERIVABLE AND THREE ARE NOT, and the difference is
 * measured rather than assumed. The extraction's workflow records carry
 * exactly eight fields -- id, name, primary_actor, trigger, surfaces_touched,
 * terminal_states, line, and exercised_by on 57 of 725 -- and no others.
 *
 *   participating roles — DERIVED, from a closed vocabulary and from the
 *   extraction's own text. `primary_actor` is prose and routinely names more
 *   than one role ("Quality Manager with an authoring grant, then Supervisor,
 *   then Worker, then Quality Manager"), so the nine canonical role names are
 *   matched inside `primary_actor` and `trigger` and the matches are the
 *   cell. Longest name first, with each match consumed, because "Admin" is a
 *   substring of both "Tenant Admin" and "Root Super Admin" and a naive scan
 *   would report the platform Admin on every tenant-admin workflow. This is
 *   labelled on the screen as roles NAMED IN the extracted text, never as the
 *   source's own role-result mapping, which §10.5 also requires and which the
 *   extraction does not carry.
 *
 *   owning module, primary objects, variant coverage — NOT EXTRACTED, and
 *   rendered as exactly that rather than dropped or synthesised. There is no
 *   module field on a workflow record; there is no object field; and
 *   `terminal_states` is a list of end states, not §10.5's seven variant
 *   classes (branch, denied, failure, first-fallback, fallback-failure,
 *   terminal-safe, recovery). Deriving a variant summary from terminal states
 *   would be this build's opinion printed in a source-derived column.
 *
 *   exercisedBy — carried through because it is real and was being dropped.
 *   §10.5's first bullet requires the trace chain to link a workflow to its
 *   use cases, and 57 rows carry exactly that.
 * ==================================================================== */
const CANONICAL_ROLE_NAMES = [
  'Root Super Admin',
  'Platform Engineer',
  'Read-only Auditor',
  'Quality Manager',
  'Tenant Admin',
  'Supervisor',
  'Support',
  'Worker',
  'Admin',
]

function rolesNamedIn(...texts) {
  let haystack = texts.filter((t) => typeof t === 'string').join('   ')
  const found = []
  // Longest first, each match consumed, so "Tenant Admin" is not also counted
  // as the platform "Admin" role.
  for (const name of [...CANONICAL_ROLE_NAMES].sort((a, b) => b.length - a.length)) {
    if (!haystack.includes(name)) continue
    found.push(name)
    haystack = haystack.split(name).join(' ')
  }
  return found.sort()
}

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
      // R4-B07. `participatingRoles` is derived; `exercisedBy` is carried
      // straight through. Owning module, primary objects and variant coverage
      // are absent from the extraction and are absent here too -- the index
      // renders the column and says "not extracted" rather than dropping it.
      participatingRoles: rolesNamedIn(wf.primary_actor, wf.trigger),
      ...(Array.isArray(wf.exercised_by) && wf.exercised_by.length > 0
        ? { exercisedBy: wf.exercised_by }
        : {}),
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

/* ==================================================================== *
 * SLICE 10 TASK 13 — SCHEDULED WORK: FOUR KEY SPACES, ONE PROSE
 * TEMPLATE TOKEN TO DROP, AND A REGISTER THAT WAS NOT IN THE FILE AT ALL.
 *
 * WHAT THIS FILE USED TO SAY AND WHAT WAS MEASURED. Its `dedupRule` claimed
 * it separated "the 35 SCHED-0NN discovery findings from the 24 deployable
 * obligations", and it contained none of the 24. Its 67 rows were 35 + 24 +
 * 1 + 7, and the plan this repair was written from attributed the 24
 * two-digit rows to false positives from `PER-SCHED-NN`, `FB-SCHED-01/02`
 * and `SB-030A-SCHED-01`. THAT ATTRIBUTION IS WRONG. The extractor matches
 * whole tokens, so none of those three patterns can yield a `SCHED-0N`; the
 * 24 two-digit rows are §54.7 Matrix 14, a real register with its own
 * `SCHED-` definition, its own `REQ-*` requirement per row and its own
 * non-human identity per row. They belong in this file as their own key
 * space.
 *
 * THE ONE GENUINE FALSE POSITIVE IS `SCHED-0NN` — the source's own prose
 * template token, and its only locator (L102465) is the sentence that
 * DEFINES the numbering convention: "A numbered `SCHED-0NN` row is a
 * finding". A template is not an identifier and it is the single row
 * dropped here.
 *
 * FOUR KEY SPACES SHARE THE `SCHED-` PREFIX where L102392 says two
 * numbering schemes exist. Read whole, that line is right about the two it
 * names and is not the census: it reconciles §45A.2's numbered findings with
 * §45A.17.1's mnemonic commitments — "a numbered row is a finding, a
 * mnemonic row is a commitment", neither superseding the other, several
 * findings mapping to none — and it rules Chapters 27 and 30A's short forms
 * narrative. It never mentions §54.7, and §54.7 never mentions Chapter 45A.
 * `src/scheduling/registers.ts` transcribes all four and is the denominator
 * the inventory closure runs against; this file is now keyed the same way.
 *
 * `SCHED-01` IS A PREFIX OF `SCHED-010`, and both are real identifiers of
 * different things — the per-shift digest against the schedule visibility
 * horizon. The two key spaces are disjoint as STRINGS, so no composite key
 * is needed here, but nothing in this file may ever match a `SCHED-*`
 * identifier by prefix.
 * ==================================================================== */
const SCHED_KEY_SPACES = [
  {
    space: 'ch-45a.2-discovery',
    label:
      '§45A.2 Scheduled-Work Coverage and Gap Register, the DISCOVERY register (key space ' +
      'ch-45a.2-discovery) -- SCHED-001..SCHED-035, body L98341-L98375. A numbered row is a ' +
      'FINDING: something the sweep identified as having time-based behaviour, including ' +
      'candidates that turned out not to be scheduled obligations at all',
    matches: (id) => /^SCHED-\d{3}$/.test(id),
    expected: 35,
  },
  {
    space: 'ch-54.7-matrix-14',
    label:
      '§54.7 Matrix 14 Schedule Definitions (key space ch-54.7-matrix-14) -- ' +
      'SCHED-01..SCHED-24, three blocks over one key space, block A body L117892-L117915. A ' +
      'real register that does not know the other three exist: Chapter 45A never names §54.7 ' +
      'and §54.7 never names Chapter 45A. NOT false positives, which is what every brief ' +
      'before this repair recorded',
    matches: (id) => /^SCHED-\d{2}$/.test(id),
    expected: 24,
  },
  {
    space: 'ch-45a.17.1-deployable',
    label:
      '§45A.17.1 the DEPLOYABLE register (key space ch-45a.17.1-deployable) -- keyed by ' +
      'mnemonic, body L102396-L102419. A mnemonic row is a COMMITMENT: an obligation that is ' +
      'actually built and run. Transcribed from the source table rather than taken from the ' +
      'identifier index, which holds none of them',
    matches: (id) => SCHED_DEPLOYABLE_IDS.has(id),
    expected: 24,
  },
  {
    space: 'ch-30a.3-carried',
    label:
      '§30A.3 the seven carried schedules (key space ch-30a.3-carried) -- body L66410-L66416. ' +
      'Real identifiers, and L102537 rules them narrative short forms: "Chapters 27 and 30A ' +
      'use short mnemonic forms of the same obligations for narrative readability", with the ' +
      'deployable register authoritative where they differ',
    matches: (id) => /^SCHED-[A-Z-]+-001$/.test(id),
    expected: 7,
  },
]

/**
 * §45A.17.1's twenty-four deployable obligations, transcribed in source
 * order with each row's own locator. The identifier index holds NOT ONE of
 * them, which is why they are written here: this is the register the
 * scheduled-work inventory closure must close against, and a file that
 * claimed to distinguish it while containing none of it could not be that
 * denominator.
 *
 * Same shape and same reason as `STU_NOTIFICATION_TRIGGERS` above — source
 * content the extraction missed, transcribed with its locators and then
 * asserted, never inferred. No `label` is carried: this registry states that
 * no names were extracted for this family, and inventing twenty-four labels
 * here would make that statement false.
 */
const SCHED_DEPLOYABLE = [
  { id: 'SCHED-RUN-AUTOCLOSE', line: 102_396 },
  { id: 'SCHED-QUAL-WARN', line: 102_397 },
  { id: 'SCHED-QUAL-ACK', line: 102_398 },
  { id: 'SCHED-DIGEST', line: 102_399 },
  { id: 'SCHED-NOSHOW-ALERT', line: 102_400 },
  { id: 'SCHED-NOSHOW-CANCEL', line: 102_401 },
  { id: 'SCHED-HANDOFF', line: 102_402 },
  { id: 'SCHED-HANDOFF-GRACE', line: 102_403 },
  { id: 'SCHED-GATE-TIMEOUT', line: 102_404 },
  { id: 'SCHED-CRIT-RENOTIFY', line: 102_405 },
  { id: 'SCHED-PROPOSAL-STALE', line: 102_406 },
  { id: 'SCHED-CONNECTIVITY', line: 102_407 },
  { id: 'SCHED-USAGE-LADDER', line: 102_408 },
  { id: 'SCHED-SUSPEND-SOFT', line: 102_409 },
  { id: 'SCHED-SUSPEND-HARD', line: 102_410 },
  { id: 'SCHED-PILOT-EXPIRY', line: 102_411 },
  { id: 'SCHED-TIERING', line: 102_412 },
  { id: 'SCHED-ANONYMISE', line: 102_413 },
  { id: 'SCHED-DRIFT-CANARY', line: 102_414 },
  { id: 'SCHED-REPORT-DELIVERY', line: 102_415 },
  { id: 'SCHED-COMMAND-AGE', line: 102_416 },
  { id: 'SCHED-TRACE-RETENTION', line: 102_417 },
  { id: 'SCHED-BACKUP', line: 102_418 },
  { id: 'SCHED-DB-MAINT', line: 102_419 },
]

const SCHED_DEPLOYABLE_IDS = new Set(SCHED_DEPLOYABLE.map((d) => d.id))

/**
 * The prose template token, and the one row this repair removes. Its only
 * locator is the sentence defining the numbering convention.
 */
const SCHED_PROSE_TEMPLATE = { id: 'SCHED-0NN', line: 102_465 }

function buildScheduledWorkRegistry() {
  const indexed = idsWithPrefixRaw('SCHED-')
  const rows = []
  const unclassified = []
  const perSpace = new Map(SCHED_KEY_SPACES.map((k) => [k.space, 0]))

  for (const [id, lines] of indexed) {
    if (id === SCHED_PROSE_TEMPLATE.id) continue
    const space = SCHED_KEY_SPACES.find((k) => k.matches(id))
    if (space === undefined) {
      unclassified.push(id)
      continue
    }
    perSpace.set(space.space, perSpace.get(space.space) + 1)
    rows.push({ id, sourceLine: firstLine(lines), status: statusForId(id), register: space.label })
  }

  // The deployable register comes from the SOURCE TABLE, not the index --
  // the index holds none of it. If a re-extraction ever adds them, that is a
  // fact worth stopping on rather than silently deduplicating: the index's
  // locator would be a first mention and this transcription's is the row.
  const deployableSpace = SCHED_KEY_SPACES.find((k) => k.space === 'ch-45a.17.1-deployable')
  const fromIndex = perSpace.get(deployableSpace.space)
  if (fromIndex !== 0) {
    throw new Error(
      `The identifier index now holds ${fromIndex} of the 24 deployable mnemonics. They are ` +
        'transcribed here from L102396-L102419 precisely because it held none -- reconcile the ' +
        'two sources before either is registered.',
    )
  }
  for (const d of SCHED_DEPLOYABLE) {
    rows.push({
      id: d.id,
      sourceLine: d.line,
      status: statusForId(d.id),
      register: deployableSpace.label,
    })
  }
  perSpace.set(deployableSpace.space, SCHED_DEPLOYABLE.length)

  if (unclassified.length > 0) {
    throw new Error(
      `${unclassified.length} SCHED-* identifier(s) match no known key space ` +
        `(${unclassified.join(', ')}). A fifth key space, a new prose token, or a changed ` +
        'spelling -- classify it against the frozen source before it is registered, and never ' +
        'let it fall into a default bucket.',
    )
  }
  if (rows.some((r) => r.id === SCHED_PROSE_TEMPLATE.id)) {
    throw new Error(
      `${SCHED_PROSE_TEMPLATE.id} is the source's own prose template token (its only locator, ` +
        `L${SCHED_PROSE_TEMPLATE.line}, is the sentence that defines the numbering convention) ` +
        'and must never be registered as an identifier',
    )
  }
  for (const space of SCHED_KEY_SPACES) {
    if (perSpace.get(space.space) !== space.expected) {
      throw new Error(
        `Scheduled-work key space ${space.space}: expected ${space.expected} rows, computed ` +
          `${perSpace.get(space.space)}`,
      )
    }
  }
  // Named rather than computed from the same array the check reads, so a
  // plant cannot print "expected N ... computed N" while failing.
  const EXPECTED_ROWS = 90
  if (rows.length !== EXPECTED_ROWS) {
    throw new Error(
      `Expected ${EXPECTED_ROWS} scheduled-work rows across four key spaces (35 + 24 + 24 + 7), ` +
        `computed ${rows.length}`,
    )
  }
  const deployableLines = SCHED_DEPLOYABLE.map((d) => d.line)
  if (
    new Set(deployableLines).size !== SCHED_DEPLOYABLE.length ||
    Math.min(...deployableLines) !== 102_396 ||
    Math.max(...deployableLines) !== 102_419 ||
    Math.max(...deployableLines) - Math.min(...deployableLines) + 1 !== SCHED_DEPLOYABLE.length
  ) {
    throw new Error(
      'The deployable register must be twenty-four rows on twenty-four contiguous lines ' +
        `L102396-L102419; computed ${SCHED_DEPLOYABLE.length} rows on ` +
        `L${Math.min(...deployableLines)}-L${Math.max(...deployableLines)}`,
    )
  }
  const ids = new Set(rows.map((r) => r.id))
  if (ids.size !== rows.length) {
    throw new Error(`Scheduled-work ids collide -- ${rows.length} rows, ${ids.size} ids`)
  }

  return {
    slug: 'scheduled-work',
    countedThing:
      'SCHED-* rows across the FOUR key spaces that share the prefix, tagged per row and never ' +
      'summed into a canonical scheduled-work total, because the source fixes none: L102392 ' +
      'states that a numbered row is a finding and a mnemonic row is a commitment, that neither ' +
      'supersedes the other, and that several findings map to no commitment at all. No names ' +
      'were extracted for this family.',
    reconciledCount: null,
    rawCount: indexed.length,
    dedupRule: appendNote(
      `${indexed.length} raw SCHED-* keys in the identifier index -> ${rows.length} rows in ` +
        `four key spaces. ONE key was dropped: ${SCHED_PROSE_TEMPLATE.id} ` +
        `(L${SCHED_PROSE_TEMPLATE.line}) is the source's own prose TEMPLATE token, and that ` +
        'line is the sentence defining the convention rather than a row of any register. ' +
        'TWENTY-FOUR rows were ADDED, transcribed from the source table at L102396-L102419: ' +
        'the identifier index holds not one of the deployable mnemonics ' +
        '(SCHED-RUN-AUTOCLOSE..SCHED-DB-MAINT), while this registry previously claimed to ' +
        'distinguish them from the 35 numbered findings. The four key spaces, per row: ' +
        SCHED_KEY_SPACES.map((k) => `${k.space} ${perSpace.get(k.space)}`).join(', ') +
        '. They are DISJOINT AS STRINGS, so no composite key is needed -- but SCHED-01 is a ' +
        'prefix of SCHED-010 and the two are different things (the per-shift digest against ' +
        'the schedule visibility horizon), so nothing here matches a SCHED-* identifier by ' +
        'prefix. The 24 two-digit rows are §54.7 Matrix 14 and are NOT false positives from ' +
        'PER-SCHED-NN, FB-SCHED-01/02 or SB-030A-SCHED-01: the extraction matches whole tokens ' +
        'and none of those patterns can yield a SCHED-0N. The §45A.3 do-not-use-cron register ' +
        '(DNC-01..DNC-22), the §45A.4.1 anchored timers (35 rows keyed by TIMER NAME, carrying ' +
        'no SCHED-* token at all), the thirteen candidate groups and the eight standing ' +
        'prohibitions are further registers of this chapter that key on no SCHED-* identifier; ' +
        'they are transcribed in src/scheduling/registers.ts and are not any of these numbers.',
      statusNote(rows, CITED_BY_A_SHIPPED_SCREEN),
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
  buildJoinedFamily({
    slug: 'features',
    prefix: 'FEAT-',
    familyLabel: 'Feature',
    // D10: the two Studio feature schemes, mapped once and only here.
    extraNote: studioFeatureSchemeNote,
  }),
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
      'EVT-* identifiers the identifier index holds -- which is neither a catalogue nor a ' +
      'census of this build\'s events, and is stated that way because reporting the number as ' +
      '"the events" overstates both. No names were extracted for this family.',
    // SLICE 10 TASK 13. This registry had no dedupRule at all, so its
    // twenty-eight rows read as an inventory. They are not one, in both
    // directions, and both figures are measured rather than asserted.
    dedupRule:
      'THIS IS A SUBSET AND SAYS SO. The frozen source carries 378 DISTINCT whole-token EVT-* ' +
      'identifiers; the identifier index holds 28 of them, so this file represents about one ' +
      'in fourteen. The shortfall is not random and not a per-family gap: the index lists what ' +
      'the graph judged an entity, so a family arrives as an arbitrary subset or not at all. ' +
      'Whole EVT-* families have NO representation here -- EVT-TENCFG-* (25 in the source), ' +
      'EVT-CC-* (23), EVT-SA-* (21), EVT-FL-* (21) -- and EVT-DOH-* is represented by 2 of its ' +
      '30, EVT-DOH-NOSHOW-15 and EVT-DOH-NOSHOW-30, which are rows 7 and 8 of a ten-row ' +
      'emission table at L26171-L26180 whose other eight rows appear in no registry. WHAT THE ' +
      '28 DO CONTAIN: 25 rows of the two catalogued registers Chapter 27.5 states -- nine ' +
      'capture-family events (EVT-CAP-001..009, body L51051-L51059, and L51045 states the nine ' +
      'beside the enumeration, which agrees) and sixteen operational-and-server events (four ' +
      'EVT-OPS-* and twelve EVT-SRV-*, body L51177-L51192) -- plus 3 identifiers from ' +
      'elsewhere in the source: EVT-CONN-30MIN, EVT-DOH-NOSHOW-15 and EVT-DOH-NOSHOW-30. ' +
      'src/registry/signals.ts transcribes the 25 as the catalogue and holds those 3 in ' +
      'EVENT_REGISTRY_EXTRAS with their provenance, never merged into it. So: 25 catalogued, 3 ' +
      'extras, 28 rows, 378 in the source, and no closed build-wide event count exists in the ' +
      'frozen source to reconcile against.',
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
  buildNotificationsRegistry(),
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
  buildScheduledWorkRegistry(),
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

const written = registries.map((registry) => writeRegistry(registry))

/**
 * R4-B05 guard 2: an authored override that matched no row is how a
 * population silently empties -- 20 ids named, 0 matched, no assertion run,
 * suite green. Every key must have been consumed by a real row.
 */
const unmatchedOverrides = [...CENSUS_OVERRIDES.keys()].filter((k) => !OVERRIDES_APPLIED.has(k))
if (unmatchedOverrides.length > 0) {
  throw new Error(
    `${unmatchedOverrides.length} authored census override(s) matched no row in the registry ` +
      `they name:\n  ${unmatchedOverrides.join('\n  ')}\n` +
      'An override that matches nothing is indistinguishable, in the output, from one that was ' +
      'never written -- refusing to ship a census whose escape hatch quietly does nothing.',
  )
}

const statusTally = {}
for (const registry of written) {
  for (const row of registry.rows) statusTally[row.status] = (statusTally[row.status] ?? 0) + 1
}
console.log(
  'Census status tally across the fourteen registries: ' +
    Object.entries(statusTally)
      .sort()
      .map(([s, n]) => `${s} ${n}`)
      .join(', ') +
    `, total ${Object.values(statusTally).reduce((a, b) => a + b, 0)}.`,
)

console.log(
  'Demonstrated-in-storyboard rows: ' +
    demonstratedByRegistry.map(([slug, n]) => `${slug} ${n}`).join(', '),
)

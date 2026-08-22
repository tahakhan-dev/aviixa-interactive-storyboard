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
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  const declaredControlLabels = new Set()
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
      routeDirsByName.set(name, [...(routeDirsByName.get(name) ?? []), relative(ROOT, dir)])
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
        /**
         * MOUNTING EVIDENCE, WHICH IS AN IMPORT AND NOT A MENTION.
         *
         * A module with no route of its own can still be built and on screen:
         * the source requires it -- `MOD-CC-13`'s action rail and `MOD-CC-07`
         * mount inside other modules' screens, and `MOD-CC-02` is chrome. Those
         * modules used to read `not-represented`, which is the same word the
         * inventory uses for a module with no code at all.
         *
         * It was understating the build by seven modules and five of them are
         * substantial: `MOD-FL-A4`, `A5`, `B8`, `B9` and `B11` are ninety-nine
         * source files between them, all five imported by
         * `app/frontline/run-player/page.tsx`, and every one of them read
         * not-represented -- because the route imports them BY PATH and never
         * names a module id in its text, so the mention scan above cannot see
         * them at all.
         *
         * An import is the stronger evidence anyway: a mention can be a
         * cross-reference in a sentence, while an import is the screen actually
         * mounting the thing.
         */
        for (const m of text.matchAll(/from\s+'[^']*\/modules\/([a-z]+-[a-z]?\d+)(?:\/[^']*)?'/g)) {
          importedModuleDirs.add(m[1])
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
  return { ownedModuleIds, argmaxWinners, importedModuleDirs, ambiguousRoutes, citedTokens, declaredControlLabels, declaresControlMatrix, routeDirsByName }
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
 * requires it: `MOD-CC-13`'s action rail and `MOD-CC-07` mount inside other
 * modules' screens, and `MOD-CC-02` is surface chrome that `AC-CC-040`
 * forbids a route. Until now every one of them read `not-represented` --
 * the same word the inventory uses for a module with no code at all.
 *
 * Measured, that was understating the build by seven modules, and five of
 * them are substantial: `MOD-FL-A4`, `A5`, `B8`, `B9` and `B11` are
 * ninety-nine source files between them, ALL FIVE imported by
 * `app/frontline/run-player/page.tsx`, and every one read not-represented.
 * The mention scan could not see them because that route imports them by
 * path and never names a module id in its text.
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
const MOUNTED_MODULE_IDS = new Set()
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
        'Frontline modules of ninety-nine source files between them read not-represented until ' +
        'this rule existed, all five mounted in the Run Player and none of them named in its ' +
        'text. '
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
 * `notifications.json` = the 205 `NOTIF-*` identifier rows this file has
 * always built, PLUS the 56 derived Studio trigger rows above, each tagged
 * with the `register` it belongs to so the two are never silently merged --
 * the same disclosure `actionable-controls` uses for the DNC-* register.
 *
 * `rawCount` stays the NOTIF-* extraction count and is NOT restated as the
 * row count: the count-scope rule at the head of this file forbids
 * presenting one scope's figure as another's.
 */
function buildNotificationsRegistry() {
  const base = buildIdentifierOnlyRegistry({
    slug: 'notifications',
    prefix: 'NOTIF-',
    countedThing:
      'NOTIF-* identifiers found in the identifier index -- a different scope from the ' +
      "source's 19 notification states, 87 categories in 13 families, or 2 channels. No names " +
      'were extracted for this family. Plus 56 DERIVED Studio notification-trigger rows ' +
      '(R19), which are trigger behaviours the frozen source states on the eighteen MOD-STU-* ' +
      'module cards without giving any of them a NOTIF-* identifier; the two registers are ' +
      'tagged separately on every row and are never summed into one canonical total.',
  })
  const identifierRows = base.rows.map((r) => ({ ...r, register: NOTIF_IDENTIFIER_REGISTER }))
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
  return {
    ...base,
    rows,
    // Deliberately NOT rows.length: 205 is what the NOTIF-* extraction found.
    rawCount: identifierRows.length,
    dedupRule: appendNote(
      `This registry holds two registers, tagged per row and never summed. (1) ` +
        `${identifierRows.length} NOTIF-* identifier strings; the state, category and channel ` +
        'registers are separate and are not this number. (2) ' +
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

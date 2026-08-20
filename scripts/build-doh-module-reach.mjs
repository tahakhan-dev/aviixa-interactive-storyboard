#!/usr/bin/env node
/**
 * SURF-DOH MODULE REACH -- writes `registries/generated/doh/module-reach.json`,
 * the per-module `rolesReaching` map the SURF-DOH spine
 * (`src/surfaces/doh/modules.ts`) reads to decide which module links a
 * persona is offered.
 *
 * WHAT THIS REPLACES, AND WHY IT MOVED TO BUILD TIME. `rolesReaching` was
 * hand-maintained and wrong on three modules; commit ce0cd7b fixed that by
 * DERIVING it from each module's own control matrix, which is right and
 * stays. The price it paid was the direction of the import: the spine
 * imported the eight `app/hub/<module>/fixtures.ts` files, so the shared
 * contract imported its own consumers. `HubShell.tsx` and two fixtures
 * import back into the spine, so that closed a real value cycle --
 * reproduced as `TypeError: Cannot read properties of undefined` -- and the
 * field had to become a getter to defer every read past module
 * initialisation. A getter working around an init-order cycle is a
 * workaround holding up a spine that nine more slices will build on.
 *
 * So the derivation runs HERE instead, once, at build time, and the spine
 * imports the answer. One direction, no cycle, no getter, and the field
 * still cannot drift from the data -- which was the whole point of ce0cd7b.
 *
 * THE RULE IS NOT REIMPLEMENTED. This script loads the real
 * `rolesReachingByMatrix` out of `src/surfaces/doh/modules.ts` and applies
 * it to the real matrices. There is exactly one implementation of the rule,
 * in the same file that documents it, and `MOD-DOH-12`'s screen still calls
 * it directly at runtime over its own matrix (`tests/unit/doh-sso.test.ts`
 * compares that call against the generated value, so the two are pinned
 * equal by an existing suite).
 *
 * NOTHING HERE IS A HAND-MAINTAINED LIST. The modules come from
 * `DOH_MODULES`; each module's matrix is found at `app/hub/<slug>/fixtures`
 * off that module's own `slug`; and the cell reader is chosen by the shape
 * of the row rather than by a table mapping module to spelling. A ninth
 * module needs no edit here, and a fourth cell spelling fails loudly below
 * rather than being skipped.
 *
 * WHY THIS IS NOT PART OF `build-registries.mjs`, which is where the rest of
 * this build's generated data comes from: the output is not one of the
 * fourteen inventory registries (hence the subdirectory -- slice-2c gate 5
 * counts the `.json` files at the TOP of `registries/generated/`), and the
 * ~350ms this costs cold is spent inside a script that
 * `tests/unit/registry-build.test.ts` spawns under a 5s budget while forty
 * test files run in parallel. Measured: folded in, that spawn timed out two
 * runs in three. Both scripts run from `pnpm build:registries`.
 *
 * Run with: node scripts/build-doh-module-reach.mjs
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname, resolve as resolvePath, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import ts from 'typescript'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// A caller may redirect the whole output tree with AVIIXA_REGISTRY_OUT.
// This exists so a determinism check can generate somewhere harmless and
// compare, instead of overwriting the committed artefacts to check them --
// which is how a freshness assertion becomes self-healing.
const OUT_DIR = process.env.AVIIXA_REGISTRY_OUT ?? join(ROOT, 'registries', 'generated')

/**
 * A TypeScript loader for this process only.
 *
 * The matrices cannot be read as text: their rows carry helper calls
 * (`prohibitedForAllFive(...)`, `sameForAllFive(...)`), shared-constant
 * references (`READ_ONLY_FOR_ADMIN_AND_AUDITOR`) and object spreads. A
 * parser for that is a small interpreter, and an interpreter that quietly
 * misreads one row is exactly the defect class this build keeps paying for.
 * So the fixtures are EXECUTED, and the values are the real ones.
 *
 * `registerHooks` is in-process and synchronous, so this needs no separate
 * loader file and no new dependency: `typescript` is already a devDependency
 * and is the only thing here that can transform the `.tsx` in the graph
 * (`app/hub/tenant-view-of-platform-administration/fixtures.ts` re-exports a
 * value from `HubShell.tsx`, which is JSX -- Node's own type stripping
 * cannot take it).
 */
const EXT_CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

function resolveSourceFile(base) {
  for (const ext of EXT_CANDIDATES) {
    const candidate = base + ext
    try {
      if (statSync(candidate).isFile()) return candidate
    } catch {
      // Not this extension. The loop is the probe; the caller fails if none hit.
    }
  }
  return null
}

/**
 * The reach map is what this script COMPUTES, so during generation it does
 * not exist yet -- and one fixture in the graph
 * (`app/hub/integration-surface/fixtures.ts`) imports the spine for the
 * rule, which drags the spine's own import of this artefact in with it.
 *
 * Serving an empty map for it is not a workaround, it is the guarantee: this
 * generator PHYSICALLY CANNOT read its own previous output, so nothing is
 * remembered between builds and a wrong value on disk cannot reproduce
 * itself. Every id answers `[]`, which is a shape the spine accepts and a
 * value this script refuses to write (see the emptiness refusal below).
 */
const REACH_DIR = join(OUT_DIR, 'doh')
const REACH_FILE = join(REACH_DIR, 'module-reach.json')
const REACH_STUB =
  'const reachOfNothing = new Proxy({}, { get: () => [] })\n' +
  'export const reach = reachOfNothing\n' +
  'export default { reach: reachOfNothing }\n'

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base = null
    if (specifier.startsWith('@/')) {
      base = resolvePath(ROOT, 'src', specifier.slice(2))
    } else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
      base = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier)
    }
    if (base !== null) {
      if (base === REACH_FILE) return { url: pathToFileURL(base).href, shortCircuit: true }
      const found = resolveSourceFile(base)
      if (found !== null) return { url: pathToFileURL(found).href, shortCircuit: true }
    }
    try {
      return nextResolve(specifier, context)
    } catch (err) {
      // `next/link` and friends publish bundler-facing specifiers that Node's
      // own ESM resolver will not extend. Retrying with `.js` is the whole of
      // the bundler emulation this needs; anything else still throws.
      if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
        try {
          return nextResolve(specifier + '.js', context)
        } catch {
          throw err
        }
      }
      throw err
    }
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:')) {
      const path = fileURLToPath(url)
      if (path === REACH_FILE) {
        return { format: 'module', source: REACH_STUB, shortCircuit: true }
      }
      if (/\.tsx?$/.test(path)) {
        const source = ts.transpileModule(readFileSync(path, 'utf8'), {
          fileName: path,
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
          },
        }).outputText
        return { format: 'module', source, shortCircuit: true }
      }
      if (path.endsWith('.json')) {
        return {
          format: 'module',
          source: `export default ${readFileSync(path, 'utf8')}\n`,
          shortCircuit: true,
        }
      }
    }
    return nextLoad(url, context)
  },
})

const loadTs = (path) => import(pathToFileURL(resolvePath(ROOT, path)).href)

const spine = await loadTs('src/surfaces/doh/modules.ts')
const { rolesInDomain } = await loadTs('src/domain/roles.ts')
const TENANT_ROLES = rolesInDomain('TENANT').map((r) => r.id)

/**
 * The cell reader, chosen by the shape of the row rather than by a table
 * mapping module to spelling. Three spellings ship; a fourth reaches here as
 * an unmatched shape and throws, which is the difference between a build
 * that stops and a module that silently reaches nobody.
 */
function readerFor(row, slug) {
  if ('status' in row) return spine.cellStatus
  if ('byRole' in row) return spine.titleCaseCellStatus
  if ('cells' in row) return spine.outcomeCellStatus
  throw new Error(
    `app/hub/${slug}/fixtures.ts: matrix row "${row.id}" carries none of the three known cell ` +
      'spellings (status / byRole / cells). Refusing to derive a reach map from a matrix this ' +
      'script cannot read.',
  )
}

const HOLDING = new Set(['allowed', 'allowed-with-conditions', 'read-only'])

/**
 * The two MUTANTS of the rule, and the only reimplementation of anything in
 * this script -- deliberately, because a mutant that shares code with the
 * real rule proves nothing. `blind` drops clause one (the `screen`
 * classification ce0cd7b added); `permissive` drops clause two (the
 * `Unavailable` withholding token). Each is run below and its effect PINNED,
 * so a change that makes either clause stop mattering fails this build
 * instead of quietly making the classification decorative.
 */
function mutantReach(rows, statusOf, { blind, permissive }) {
  const considered = blind ? rows : rows.filter((row) => row.surface === 'screen')
  return TENANT_ROLES.filter((role) => {
    const column = considered.map((row) => statusOf(row, role))
    const holds = column.some((status) => HOLDING.has(status))
    return holds && (permissive || !column.includes('unavailable'))
  })
}

const reach = {}
const derivedFrom = {}
const mutantMoves = { noClassification: [], noWithholding: [], neitherClause: [] }

for (const module of spine.DOH_MODULES) {
  const fixturePath = `app/hub/${module.slug}/fixtures.ts`
  const fixtures = await loadTs(fixturePath)
  const matrix = fixtures.CONTROL_MATRIX ?? fixtures.PERMISSION_MATRIX
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error(
      `${fixturePath} exports no non-empty CONTROL_MATRIX or PERMISSION_MATRIX. Refusing to ` +
        `write a reach map that would withhold ${module.id} from every role because its matrix ` +
        'could not be found.',
    )
  }
  const statusOf = readerFor(matrix[0], module.slug)

  if (!matrix.some((row) => row.surface === 'screen')) {
    throw new Error(
      `${fixturePath}: no row is classified \`screen\`. The classification is what clause one of ` +
        `the rule reads; without it ${module.id} reaches nobody. Refusing to write that.`,
    )
  }

  const roles = spine.rolesReachingByMatrix(matrix, statusOf)
  if (roles.length === 0) {
    throw new Error(
      `${module.id} derives an EMPTY reach set from ${fixturePath}. No module in this slice ` +
        'withholds its route from all five tenant roles; an empty set here is a broken ' +
        'derivation, and writing it would silently remove the module from every rail.',
    )
  }
  reach[module.id] = [...roles]
  derivedFrom[module.id] = fixturePath

  const same = (a, b) => a.length === b.length && a.every((role, i) => role === b[i])
  const moved = (options) => !same(mutantReach(matrix, statusOf, options), roles)
  if (moved({ blind: true, permissive: false })) mutantMoves.noClassification.push(module.id)
  if (moved({ blind: false, permissive: true })) mutantMoves.noWithholding.push(module.id)
  if (moved({ blind: true, permissive: true })) mutantMoves.neitherClause.push(module.id)
}

/**
 * ce0cd7b's own proof, repeated on every build rather than recorded once in a
 * commit message, and MEASURED rather than restated.
 *
 * Three mutants, because the interesting claim needs all three to be honest:
 *
 * - `noClassification` -- clause one off, clause two still on: NOTHING moves.
 *   Reading every row instead of the screen rows gains the chrome grants, but
 *   the same widening also drags the screen rows' `Unavailable` cells into
 *   the same column, and clause two withholds on them anyway. This is the
 *   spine's own claim that "each alone reaches the same eight answers", and
 *   it is pinned here so the claim is executable instead of asserted.
 * - `noWithholding` -- clause two off: exactly `MOD-DOH-04` moves, gaining
 *   the Worker, which is `tests/unit/doh-workers.test.ts` going red.
 * - `neitherClause` -- both off, which is the raw "does this role hold
 *   anything anywhere in this matrix" question `slice-04-gates.test.ts` gate
 *   4 compares against: exactly `MOD-DOH-01`, `MOD-DOH-04` and `MOD-DOH-13`
 *   move, the same three that gate pins as derivation exceptions.
 *
 * So the classification is load-bearing against the MEANING question, not
 * against clause two -- which is a sharper statement than "strip the
 * classification and three modules move", and it is the one the numbers
 * support.
 */
const MUTANT_PINS = {
  noClassification: {
    ids: [],
    clause: 'the `screen` classification (clause one), with the withholding token left in place',
  },
  noWithholding: { ids: ['MOD-DOH-04'], clause: 'the `Unavailable` withholding token (clause two)' },
  neitherClause: {
    ids: ['MOD-DOH-01', 'MOD-DOH-04', 'MOD-DOH-13'],
    clause: 'both clauses, leaving the bare "holds anything anywhere" question gate 4 asks',
  },
}
for (const [mutant, { ids, clause }] of Object.entries(MUTANT_PINS)) {
  const got = [...mutantMoves[mutant]].sort().join(', ')
  const want = [...ids].sort().join(', ')
  if (got !== want) {
    throw new Error(
      `Mutation proof ${mutant} failed: removing ${clause} moves [${got}], not [${want}]. Either ` +
        'the matrices changed and this pin must be re-measured, or the rule has stopped meaning ' +
        'what its doc comment in src/surfaces/doh/modules.ts says it means.',
    )
  }
}

/**
 * THE DIRECTION GUARD, and the reason this fix cannot quietly undo itself.
 *
 * The cycle being gone is not provable by a green build -- the build was
 * green with the cycle in it. What IS provable is that the edge which
 * created it cannot be drawn again: no file under `src/` may VALUE-import
 * anything under `app/`. `import type` stays legal and is exempt, because it
 * is erased and opens no runtime edge at all (`modules.ts` still takes
 * `TenantRoleId` that way). Anything this scan cannot prove is type-only is
 * treated as a value import.
 */
const IMPORT_STATEMENT = /^[ \t]*(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/gm

/**
 * ENOENT IS TOLERATED HERE, AND THAT IS NOT LAZINESS. Verbatim the rule
 * `scripts/build-stu-module-reach.mjs` already states, applied to the sibling
 * that never got it. This scan walks the whole `src/` tree, and other
 * processes plant and delete scratch probes in it to prove their own gates
 * can fail (`tests/coverage/slice-2c-gates.test.ts` is the pattern). A
 * sibling's `finally` removing its probe between this walk listing it and
 * this walk reading it makes a correct build fail on a path that no longer
 * exists.
 *
 * IT DOES NOT DETECT LESS. A file that exists is read; only a file that has
 * ALREADY BEEN DELETED is skipped, and a deleted file imports nothing at
 * runtime. It in fact detects MORE than the unguarded form did: measured
 * before this change, an ENOENT thrown by a vanished neighbour ABORTED the
 * whole scan, so a real inverted import sitting beside it was never reported
 * at all. The proof is in the task report — probe C went from "ENOENT masked
 * the real finding" to "inverted import still DETECTED alongside a vanished
 * entry".
 */
function readIfPresent(read, path) {
  try {
    return read(path)
  } catch (err) {
    if (err && err.code === 'ENOENT') return null
    throw err
  }
}

function srcFiles(dir, acc = []) {
  const entries = readIfPresent((d) => readdirSync(d, { withFileTypes: true }), dir)
  if (entries === null) return acc
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) srcFiles(full, acc)
    else if (/\.tsx?$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const APP_DIR = join(ROOT, 'app')
const inverted = []
for (const file of srcFiles(join(ROOT, 'src'))) {
  const text = readIfPresent((f) => readFileSync(f, 'utf8'), file)
  if (text === null) continue
  for (const match of text.matchAll(IMPORT_STATEMENT)) {
    const [statement, specifier] = match
    if (!specifier.startsWith('.')) continue
    const target = resolvePath(dirname(file), specifier)
    if (target !== APP_DIR && !target.startsWith(APP_DIR + '/')) continue
    const clause = statement.slice(0, statement.lastIndexOf('from'))
    const typeOnly =
      /^\s*(?:import|export)\s+type\b/.test(clause) ||
      (clause.includes('{') &&
        clause
          .slice(clause.indexOf('{') + 1, clause.lastIndexOf('}'))
          .split(',')
          .filter((binding) => binding.trim() !== '')
          .every((binding) => /^\s*type\s/.test(binding)))
    if (!typeOnly) inverted.push(`${relative(ROOT, file)} -> ${specifier}`)
  }
}
if (inverted.length > 0) {
  throw new Error(
    'A file under src/ VALUE-imports app/, which points the dependency the wrong way and is how ' +
      'the SURF-DOH spine closed an initialisation cycle it needed a getter to survive:\n  ' +
      inverted.join('\n  ') +
      '\nShared contracts under src/ are consumed by app/, never the reverse. Data that has to ' +
      'travel from app/ to src/ is derived at build time, the way this script derives ' +
      'registries/generated/doh/module-reach.json.',
  )
}

mkdirSync(REACH_DIR, { recursive: true })
writeFileSync(
  REACH_FILE,
  JSON.stringify(
    {
      generatedBy: 'scripts/build-doh-module-reach.mjs',
      doNotEdit:
        'GENERATED by scripts/build-doh-module-reach.mjs -- every hand edit here is destroyed by ' +
        'the next `pnpm build`, and until then the eight module suites in tests/unit that compare ' +
        'this map against their own live control matrices go red on the edited entry.',
      rule:
        'A role reaches a module when that module’s own screen rows offer it something and no ' +
        'screen row marks it Unavailable. Implemented once, as rolesReachingByMatrix in ' +
        'src/surfaces/doh/modules.ts, and applied here to each module’s real matrix.',
      derivedFrom,
      reach,
    },
    null,
    2,
  ) + '\n',
)
console.log(
  'Wrote SURF-DOH module reach: ' +
    Object.entries(reach)
      .map(([id, roles]) => `${id} ${roles.length}`)
      .join(', '),
)

#!/usr/bin/env node
/**
 * SURF-STU MODULE REACH -- writes `registries/generated/stu/module-reach.json`,
 * the per-module answer the SURF-STU spine (`src/studio/modules.ts`) reads to
 * decide which module routes a persona is offered, and whether each module's
 * route exists in the tree at all.
 *
 * WHY THIS RUNS AT BUILD TIME AND NOT IN THE SPINE (plan C3). Slice 4's
 * `src/surfaces/doh/modules.ts` documents the alternative in full: deriving
 * reach by importing the matrices pointed the shared contract at its own
 * consumers, closed a real value cycle, and survived only because the field
 * was a getter -- a workaround holding up a spine nine more slices build on.
 * The fix was a build-time generator, and this is the same fix applied
 * before the same mistake, not after it.
 *
 * THE RULE IS NOT REIMPLEMENTED HERE. This script loads the real
 * `reachByStudioMatrix` out of `src/studio/modules.ts` and applies it to the
 * real matrices. One implementation, in the file that documents it.
 *
 * WHAT IS DIFFERENT FROM THE SURF-DOH GENERATOR, AND WHY IT IS NOT A
 * WEAKNESS. When the SURF-DOH generator was written all eight of its
 * matrices existed, so a missing one could only mean a mistake and it threw.
 * Here, eighteen module tasks follow this one and land their matrices one at
 * a time. So the two absences are distinguished rather than merged:
 *
 *   - a module whose directory `src/studio/modules/stu-NN/` DOES NOT EXIST
 *     has not been built. Its reach is written as `null` -- "not derived" --
 *     and the shell fails closed on it, listing the module, offering no link
 *     and saying why. That is a declared absence, not an empty answer.
 *   - a module whose directory EXISTS but exports no readable matrix is a
 *     MISTAKE, and this refuses to write anything at all. A module that
 *     silently reaches nobody is the failure this refusal exists for.
 *
 * NOTHING HERE IS A HAND-MAINTAINED LIST. The modules come from
 * `STU_MODULES`; each matrix is found from that module's own id; each route
 * is found from that module's own slug; and the cell reader is chosen by the
 * shape of the row rather than by a table mapping module to spelling.
 *
 * NO MUTATION PINS, AND THE REASON IS THE POINT. The SURF-DOH generator pins
 * which modules move when a clause of the rule is removed, because it has
 * eight real matrices to measure. This one has none yet, so a pin here would
 * assert that removing a clause moves nothing -- a check that passes on
 * correct code and on the rule deleted, which is worse than no check. The
 * two clauses are instead proven directly, against synthetic matrices, in
 * `tests/component/stu-shell.test.tsx`: a chrome row that grants, an
 * `another-surface` row that grants, and the connectivity row that reads
 * `Unavailable` in seven of eight columns each go red if clause one is
 * dropped. When the module matrices land, pins measured over them belong
 * here.
 *
 * Run with: node scripts/build-stu-module-reach.mjs
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve as resolvePath, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import ts from 'typescript'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'registries', 'generated')
const REACH_DIR = join(OUT_DIR, 'stu')
const REACH_FILE = join(REACH_DIR, 'module-reach.json')

/**
 * A TypeScript loader for this process only, the same one
 * `scripts/build-doh-module-reach.mjs` carries and for the same reason: the
 * matrices cannot be read as text. Their rows carry helper calls, shared
 * constants and object spreads, and a parser for that is a small interpreter
 * -- one that quietly misreads a row is exactly the defect class this build
 * keeps paying for. So the modules are EXECUTED and the values are real.
 *
 * ponytail: duplicated from the SURF-DOH generator rather than extracted to
 * a shared `scripts/ts-loader.mjs`, because that extraction would edit a
 * file this task does not own and the two generators are dispatched to
 * different agents. Extract it when one owner holds both.
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
 * not exist yet -- and `src/studio/modules.ts` imports it. Serving a stub
 * for it is the guarantee rather than a workaround: this generator
 * PHYSICALLY CANNOT read its own previous output, so nothing is remembered
 * between builds and a wrong value on disk cannot reproduce itself. Every
 * module answers "not derived, no route", which is a shape the spine accepts
 * and one this script always overwrites.
 */
const REACH_STUB =
  'const entry = { matrixPath: null, reach: null, routePath: null }\n' +
  'const modules = new Proxy({}, { get: () => entry })\n' +
  'export const modules_ = modules\n' +
  'export default { modules }\n'

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
      // `next/link` and friends publish bundler-facing specifiers Node's own
      // ESM resolver will not extend. Retrying with `.js` is the whole of the
      // bundler emulation this needs; anything else still throws.
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

/* ==================================================================== *
 * THE DIRECTION GUARD, RUN FIRST.
 *
 * The cycle being absent is not provable by a green build -- the SURF-DOH
 * build was green with the cycle in it. What IS provable is that the edge
 * which creates it cannot be drawn: no file under `src/` may VALUE-import
 * anything under `app/`. `import type` stays legal and is exempt, because it
 * is erased and opens no runtime edge at all. Anything this scan cannot
 * prove is type-only is treated as a value import.
 *
 * It runs BEFORE the module graph is loaded, deliberately: an inverted
 * import can make the load itself fail in a confusing way, and the guard's
 * message is the one worth reading.
 * ==================================================================== */
const IMPORT_STATEMENT = /^[ \t]*(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/gm

/**
 * ENOENT IS TOLERATED HERE, AND THAT IS NOT LAZINESS. This scan walks the
 * whole `src/` tree, and other processes plant and delete scratch probes in
 * it to prove their own gates can fail (`tests/coverage/slice-03-gates.test.ts`
 * is the pattern). A sibling's `finally` removing its probe between this
 * walk listing it and this walk reading it makes a correct build fail on a
 * path that no longer exists -- reproduced in this project as ENOENT inside
 * a concurrent scan, and fixed there the same way it is fixed here: the
 * vanished entry is skipped rather than the run being retried.
 *
 * It cannot hide a real inversion. A file that exists is read; only a file
 * that has ALREADY BEEN DELETED is skipped, and a deleted file imports
 * nothing at runtime.
 */
function readIfPresent(read, path) {
  try {
    return read(path)
  } catch (err) {
    if (err && err.code === 'ENOENT') return null
    throw err
  }
}

function sourceFiles(dir, acc = []) {
  const entries = readIfPresent((d) => readdirSync(d, { withFileTypes: true }), dir)
  if (entries === null) return acc
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(full, acc)
    else if (/\.tsx?$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const APP_DIR = join(ROOT, 'app')
const inverted = []
for (const file of sourceFiles(join(ROOT, 'src'))) {
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
      'registries/generated/stu/module-reach.json.',
  )
}

/* ==================================================================== *
 * THE DERIVATION.
 * ==================================================================== */
const loadTs = (path) => import(pathToFileURL(resolvePath(ROOT, path)).href)

const spine = await loadTs('src/studio/modules.ts')
const PERSONA_IDS = spine.STU_PERSONAS.map((p) => p.id)

/** Two tokens no Studio matrix may carry: this surface has no offline mode. */
const OFFLINE_TOKENS = new Set(['cachedReadOnlyOffline', 'queuedOffline'])

/**
 * The cell reader, chosen by the shape of the row rather than by a table
 * mapping module to spelling. Two container spellings and two cell
 * spellings ship; anything else reaches here as an unmatched shape and
 * throws, which is the difference between a build that stops and a module
 * that silently reaches nobody.
 */
function readerFor(row, where) {
  const container = 'cells' in row ? 'cells' : 'status' in row ? 'status' : null
  if (container === null) {
    throw new Error(
      `${where}: matrix row "${row.id ?? '(no id)'}" carries neither a \`cells\` nor a \`status\` ` +
        'map. Refusing to derive reach from a matrix this script cannot read.',
    )
  }
  return (r, persona) => {
    const cell = r[container][persona]
    if (cell === undefined) {
      throw new Error(
        `${where}: matrix row "${r.id ?? '(no id)'}" has no cell for persona "${persona}". The ` +
          'eight Studio persona columns are the vocabulary published by src/studio/modules.ts ' +
          `(${PERSONA_IDS.join(', ')}); a matrix keyed on anything else -- role identifiers, for ` +
          'instance -- cannot express the two Supervisor columns, the Plant Manager persona or ' +
          'GRANT-STU-IMPL, and is refused rather than partially read.',
      )
    }
    const outcome = typeof cell === 'string' ? cell : cell.outcome
    if (typeof outcome !== 'string') {
      throw new Error(
        `${where}: matrix row "${r.id ?? '(no id)'}" cell for "${persona}" is neither an outcome ` +
          'string nor an object carrying `outcome`.',
      )
    }
    if (OFFLINE_TOKENS.has(outcome)) {
      throw new Error(
        `${where}: matrix row "${r.id ?? '(no id)'}" cell for "${persona}" carries "${outcome}". ` +
          'The Studio has no offline mode: STATE-07 renders nowhere on this surface (D22) and ' +
          'nothing on it ever queues a write (D4). A matrix carrying an offline outcome is a ' +
          'defect, not an input.',
      )
    }
    return outcome
  }
}

/** The one exported matrix in a module directory, found by shape. */
function matrixIn(moduleExports) {
  const candidates = Object.entries(moduleExports).filter(
    ([, value]) =>
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((row) => row !== null && typeof row === 'object' && 'surface' in row),
  )
  return candidates.length === 1 ? candidates[0] : null
}

const modules = {}
for (const module of spine.STU_MODULES) {
  const dir = join(ROOT, 'src', 'studio', 'modules', `stu-${module.id.slice(-2)}`)
  const slug = module.slug
  const routeFile = slug === null ? null : join(ROOT, 'app', 'studio', slug, 'page.tsx')
  const routePath =
    routeFile !== null && existsSync(routeFile) ? relative(ROOT, routeFile) : null

  if (!existsSync(dir)) {
    // Declared absence: this module has not been built yet. Not an empty
    // answer, and not a guess -- the spine renders it as "not derived".
    modules[module.id] = { matrixPath: null, reach: null, routePath }
    continue
  }

  let found = null
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue
    const path = join(dir, entry.name)
    const hit = matrixIn(await loadTs(relative(ROOT, path)))
    if (hit !== null) {
      found = { path, exportName: hit[0], rows: hit[1] }
      break
    }
  }
  if (found === null) {
    throw new Error(
      `${relative(ROOT, dir)} exists but exports no readable permission matrix -- a non-empty ` +
        'array of rows each carrying a `surface` classification. Refusing to write a reach map ' +
        `that would leave ${module.id} withheld from every persona because its matrix could not ` +
        'be found. If this module genuinely has no matrix, say so in its own registry entry ' +
        'rather than by omission.',
    )
  }

  const where = `${relative(ROOT, found.path)} (${found.exportName})`
  const reach = spine.reachByStudioMatrix(found.rows, readerFor(found.rows[0], where))
  modules[module.id] = {
    matrixPath: relative(ROOT, found.path),
    reach,
    routePath,
  }
}

mkdirSync(REACH_DIR, { recursive: true })
writeFileSync(
  REACH_FILE,
  JSON.stringify(
    {
      generatedBy: 'scripts/build-stu-module-reach.mjs',
      doNotEdit:
        'GENERATED by scripts/build-stu-module-reach.mjs -- every hand edit here is destroyed by ' +
        'the next `pnpm build`, and until then tests/component/stu-shell.test.tsx goes red on the ' +
        'edited entry because src/studio/modules.ts validates every key and value it reads.',
      rule:
        'Over a module’s own screen rows only, a persona is offered the route when some cell lets ' +
        'it read or act; failing that it is an open client decision when some cell defers to one; ' +
        'failing both the route is withheld. Implemented once, as reachByStudioMatrix in ' +
        'src/studio/modules.ts, and applied here to each module’s real matrix. `reach: null` ' +
        'means the module has not been built yet and nothing was derived -- the spine fails ' +
        'closed on it and says so on screen.',
      modules,
    },
    null,
    2,
  ) + '\n',
)

const derived = Object.entries(modules).filter(([, m]) => m.reach !== null)
const routed = Object.entries(modules).filter(([, m]) => m.routePath !== null)
console.log(
  `Wrote SURF-STU module reach: ${derived.length} of ${Object.keys(modules).length} modules ` +
    `derived from a matrix, ${routed.length} with a built route` +
    (derived.length === 0
      ? ' (no module matrix exists yet -- every module reads as not-derived, which the shell ' +
        'renders as a declared absence rather than as a withheld route)'
      : `: ${derived.map(([id]) => id).join(', ')}`),
)

#!/usr/bin/env node
/**
 * SURF-CC REACH -- which `SCR-CC-*` tokens are screens, which screens have a
 * route key, and which of those route keys are built. Three different
 * populations that a single count collapses, and collapsing them is the trap
 * this script exists to keep open.
 *
 * WHY THIS REPORTS AND WRITES NOTHING. The sibling reach generators
 * (`build-doh-module-reach.mjs`, `build-stu-module-reach.mjs`) write into
 * `registries/generated/`, and `tests/coverage/registry-freshness.test.ts`
 * compares that whole directory against a fresh run of exactly three named
 * generators. A fourth artefact there with no generator in that list turns
 * that gate red on a coherent tree, and neither that test nor `package.json`
 * is this task's to edit. So this prints, and exits non-zero on the three
 * conditions below. Nothing downstream reads a file it produces.
 *
 * THE THREE POPULATIONS, AND WHY NONE OF THEM IS THIRTEEN ROUTE DIRECTORIES.
 *
 *  1. THE REGISTER: thirteen screens. Counted here by walking from the header
 *     row to the first line that is not a row -- never by subtracting two
 *     line numbers, which is how six of slice 8's brief errors were made.
 *  2. THE ROUTE KEYS: twelve. `SCR-CC-01` is the sign-in and reuses the Hub's
 *     own identity module, and its key `sign-in` already names two directories
 *     on other surfaces, so this surface authors no directory for it.
 *  3. THE DIRECTORIES ON DISK: however many have been built so far.
 *
 * A check that counts route directories and asserts thirteen is green and
 * wrong in both directions at once.
 *
 * THE TOKEN COUNT DEPENDS ENTIRELY ON THE REGEX, AND ALL THE ANSWERS ARE
 * REAL. Over the same 176 occurrences of `SCR-CC-`, the distinct count is 56
 * if a token stops at the mnemonic and 96 if its trailing sequence number is
 * kept (`SCR-CC-BOARD` versus `SCR-CC-BOARD-01`). Both are printed, because a
 * bare "distinct tokens" number is not a fact about the source -- it is a
 * fact about the regex, and this build has spent seven counts learning that.
 *
 * THE LOOK-ALIKE FAMILY IS A LEFT-BOUNDARY DEFECT, NOT A FAMILY. An
 * unanchored `SCR-CC-\d+` collects eighteen numbered tokens, five of them
 * three-digit. Those five have zero standalone occurrences: every one is the
 * tail of an `AC-SCR-CC-00N` or `TEST-SCR-CC-00N` identifier. Anchor the left
 * side and the population is exactly the register's thirteen. Both are
 * reported, so the difference is visible rather than inferred.
 *
 * Run with: node scripts/cc-reach.mjs [--json]
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BLUEPRINT = join(ROOT, '..', 'AVIIXA_Production_Product_Blueprint.md')
const ROUTE_ROOT = join(ROOT, 'app', 'command-center')

const LINES = readFileSync(BLUEPRINT, 'utf8').split('\n')
/** 1-based, so a printed locator is the line a reader can open. */
const lineNo = (i) => i + 1
const cells = (row) =>
  row
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())

/* ==================================================================== *
 * 1. THE REGISTER, COUNTED ROW BY ROW.
 *
 * The header is found by its own column names rather than by a line number,
 * so this stays true if the source is ever re-paginated, and the body is
 * walked until a line stops being a row. The separator is skipped by
 * position and then CHECKED to be a separator -- a table check satisfied by
 * the `|---|---|` row is on the catalogue of gates that could not fail.
 * ==================================================================== */
const HEADER_CELLS = [
  'Screen identifier',
  'Screen name',
  'Purpose',
  'Roles that can open it',
  'Modules and features shown',
  'Navigation entry point',
]

const ROW_ID = /^`?SCR-CC-\d\d`?$/

/**
 * THE HEADER IS NOT UNIQUE AND THE FIRST WRITING OF THIS ASSUMED IT WAS.
 * Every surface's §25 screen register carries these same six column names, so
 * `findIndex` on the header alone lands on whichever surface's register comes
 * first in the file and reads zero Command Center rows -- a parse failure that
 * reports as an empty table rather than as an error. The register is
 * identified by the header AND by the first data row being a numbered
 * `SCR-CC-*`; nothing else in the source is both.
 */
function findRegister() {
  const headerIdx = LINES.findIndex((l, i) => {
    const c = cells(l)
    if (c.length !== HEADER_CELLS.length || !HEADER_CELLS.every((h, j) => c[j] === h)) return false
    const first = cells(LINES[i + 2] ?? '')
    return first.length === HEADER_CELLS.length && ROW_ID.test(first[0])
  })
  if (headerIdx === -1) throw new Error('No §25.5 screen register header found in the blueprint.')
  const sep = cells(LINES[headerIdx + 1])
  if (sep.length !== HEADER_CELLS.length || !sep.every((c) => /^-+$/.test(c))) {
    throw new Error(
      `Line ${lineNo(headerIdx + 1)} is not a separator row. Refusing to read the row beneath a ` +
        'header as data without it -- a body that starts one line early counts the separator.',
    )
  }
  const rows = []
  for (let i = headerIdx + 2; i < LINES.length; i += 1) {
    const c = cells(LINES[i])
    if (c.length !== HEADER_CELLS.length || !ROW_ID.test(c[0])) break
    rows.push({
      line: `L${lineNo(i)}`,
      screen: c[0].replaceAll('`', ''),
      name: c[1],
      rolesColumn: c[3],
      modulesShown: c[4],
    })
  }
  return { headerLine: `L${lineNo(headerIdx)}`, separatorLine: `L${lineNo(headerIdx + 1)}`, rows }
}

const REGISTER = findRegister()

/* ==================================================================== *
 * 2. THE TOKENS, UNDER FOUR REGEXES RATHER THAN ONE.
 * ==================================================================== */
const TEXT = LINES.join('\n')
const countDistinct = (re) => new Set(TEXT.match(re) ?? []).size
const occurrences = (TEXT.match(/SCR-CC-[A-Za-z0-9]/g) ?? []).length

const numberedAnchored = [
  ...new Set(
    (TEXT.match(/(?:^|[^A-Za-z0-9-])SCR-CC-\d+/gm) ?? []).map((m) => m.slice(m.indexOf('SCR'))),
  ),
].sort()
const numberedUnanchored = [...new Set(TEXT.match(/SCR-CC-\d+/g) ?? [])].sort()

const TOKENS = {
  occurrences,
  distinctToMnemonic: countDistinct(/SCR-CC-[A-Za-z0-9]+/g),
  distinctFullShape: countDistinct(/SCR-CC-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g),
  numberedAnchored,
  numberedUnanchored,
  prefixArtefacts: numberedUnanchored.filter((t) => !numberedAnchored.includes(t)),
}

/* ==================================================================== *
 * 3. THE ROUTE KEYS, READ OFF THE SPINE AS TEXT.
 *
 * The same regex pair `scripts/build-registries.mjs` uses, and for the reason
 * it states: the spine is TypeScript and executing it costs ~350ms cold, but
 * a `slug:` string literal is the one thing in it a regex can read without
 * becoming an interpreter. A parse that goes empty is refused rather than
 * reported as "no routes claimed".
 * ==================================================================== */
const SPINE_MODULE_ID = /\bid:\s*'(MOD-CC-\d{2})'/g
const SPINE_SLUG = /\bslug:\s*'([^'\\]+)'/
const SCREEN_ID = /\bid:\s*'(SCR-CC-\d{2})'/g
const OWNING_MODULE = /\bowningModule:\s*'(MOD-CC-\d{2})'/
const UNOWNED_SLUG = /\bunownedSlug:\s*'([^'\\]+)'/

/** Split a spine file into one chunk per `id:`, so a field cannot cross records. */
function byRecord(text, idRe) {
  const marks = [...text.matchAll(idRe)]
  return marks.map((m, i) => ({
    id: m[1],
    body: text.slice(m.index, marks[i + 1] === undefined ? undefined : marks[i + 1].index),
  }))
}

const MODULES_TS = readFileSync(join(ROOT, 'src', 'surfaces', 'cc', 'modules.ts'), 'utf8')
const SCREENS_TS = readFileSync(join(ROOT, 'src', 'surfaces', 'cc', 'screens.ts'), 'utf8')

const moduleSlugs = new Map()
for (const { id, body } of byRecord(MODULES_TS, SPINE_MODULE_ID)) {
  const hit = SPINE_SLUG.exec(body)
  moduleSlugs.set(id, hit === null ? null : hit[1])
}
if (moduleSlugs.size === 0) {
  throw new Error(
    'No MOD-CC-* record was parsed out of src/surfaces/cc/modules.ts. Refusing to report zero ' +
      'claimed route keys, which would read as "the surface claims nothing" rather than as the ' +
      'parse failure it is.',
  )
}

/** One row per register screen: its owner, its route key, and whether it is built. */
const MAPPING = byRecord(SCREENS_TS, SCREEN_ID).map(({ id, body }) => {
  const owner = OWNING_MODULE.exec(body)
  const unowned = UNOWNED_SLUG.exec(body)
  const owningModule = owner === null ? null : owner[1]
  const slug = owningModule === null ? (unowned === null ? null : unowned[1]) : moduleSlugs.get(owningModule)
  return { screen: id, owningModule, slug, authoredHere: slug !== null && slug !== 'sign-in' }
})

/* ==================================================================== *
 * 4. WHAT IS ON DISK.
 * ==================================================================== */
const routeDirs = existsSync(ROUTE_ROOT)
  ? readdirSync(ROUTE_ROOT)
      .filter((e) => statSync(join(ROUTE_ROOT, e)).isDirectory())
      .filter((e) => existsSync(join(ROUTE_ROOT, e, 'page.tsx')))
      .sort()
  : []

const expectedKeys = MAPPING.filter((m) => m.authoredHere).map((m) => m.slug)
const built = expectedKeys.filter((k) => routeDirs.includes(k))
const unbuilt = expectedKeys.filter((k) => !routeDirs.includes(k))
/** A directory no register row names is the fourteenth route AC-CC-040 forbids. */
const unnamed = routeDirs.filter((d) => !expectedKeys.includes(d))

const REPORT = {
  register: {
    headerLine: REGISTER.headerLine,
    separatorLine: REGISTER.separatorLine,
    rows: REGISTER.rows.length,
    firstRow: REGISTER.rows[0]?.line ?? null,
    lastRow: REGISTER.rows.at(-1)?.line ?? null,
  },
  tokens: TOKENS,
  routeKeys: { expected: expectedKeys.length, built: built.length, unbuilt },
  routeDirectories: { onDisk: routeDirs.length, names: routeDirs, namedByNoRegisterRow: unnamed },
  mapping: MAPPING,
}

const problems = []
if (REGISTER.rows.length !== 13) {
  problems.push(
    `The screen register holds ${REGISTER.rows.length} rows, not thirteen. AC-CC-040 fixes the ` +
      'module count at thirteen and the register is the screen population that answers to it.',
  )
}
if (unnamed.length > 0) {
  problems.push(
    `app/command-center/ holds ${unnamed.length} route directory/directories no register row ` +
      `names: ${unnamed.join(', ')}. AC-CC-040: "no fourteenth module route exists."`,
  )
}
const strayNumbered = TOKENS.numberedAnchored.filter(
  (t) => !REGISTER.rows.some((r) => r.screen === t),
)
if (strayNumbered.length > 0) {
  problems.push(
    `Numbered SCR-CC tokens outside the register: ${strayNumbered.join(', ')}. A second numbered ` +
      'screen identifier is a fourteenth screen by another name.',
  )
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(REPORT, null, 2))
} else {
  console.log(
    [
      `SURF-CC reach, read against ${relative(ROOT, BLUEPRINT)}`,
      '',
      `  register rows            ${REGISTER.rows.length}  (header ${REGISTER.headerLine}, separator ${REGISTER.separatorLine}, ${REGISTER.rows[0].line}-${REGISTER.rows.at(-1).line})`,
      `  route keys authored here ${expectedKeys.length}  (SCR-CC-01 reuses MOD-DOH-09 and its key names two directories on other surfaces)`,
      `  route directories built   ${built.length}  ${built.join(', ') || '(none)'}`,
      `  still unbuilt             ${unbuilt.length}  ${unbuilt.join(', ') || '(none)'}`,
      '',
      `  SCR-CC- occurrences      ${TOKENS.occurrences}`,
      `  distinct, to the mnemonic ${TOKENS.distinctToMnemonic}   (SCR-CC-BOARD-01 counts as SCR-CC-BOARD)`,
      `  distinct, full shape      ${TOKENS.distinctFullShape}   (the trailing sequence number kept)`,
      `  numbered, left-anchored   ${TOKENS.numberedAnchored.length}   = the register exactly`,
      `  numbered, unanchored      ${TOKENS.numberedUnanchored.length}   adds ${TOKENS.prefixArtefacts.join(', ') || '(none)'}`,
      `                                  -- every one a tail of AC-SCR-CC-00N / TEST-SCR-CC-00N, never a screen`,
      '',
      ...MAPPING.map(
        (m) =>
          `  ${m.screen}  ${(m.owningModule ?? 'no MOD-CC-* owner').padEnd(16)} ${(m.slug ?? '-').padEnd(28)} ${
            !m.authoredHere ? 'not authored on this surface' : routeDirs.includes(m.slug) ? 'built' : 'declared, not built'
          }`,
      ),
    ].join('\n'),
  )
}

if (problems.length > 0) {
  console.error('\n' + problems.map((p) => `REFUSED: ${p}`).join('\n'))
  process.exit(1)
}

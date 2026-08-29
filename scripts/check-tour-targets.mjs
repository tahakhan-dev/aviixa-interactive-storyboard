#!/usr/bin/env node
/**
 * Tour registry target gate. Closes the NAMED DEBT recorded in
 * `src/data/schemas/index.ts` (the `UNCHECKABLE_ID_FIELDS` entry for
 * `tours.steps[].action.controlId`, ~L325-336): "a build-time literal-
 * control-id registry -- a script parallel to `scripts/validate-
 * collections.mjs` that statically scrapes every
 * `data-control-id="literal-string"` JSX attribute across `app/**`/
 * `src/ui/**` ... into a `Set<string>`, then fails the build if any
 * `tours.json` ... literal string is absent from it."
 *
 * WHY THIS ISN'T A PLAIN "grep for the exact quoted attribute" SCRIPT.
 * A first, literal implementation of exactly that (regex on
 * `data-control-id="..."` only) was tried against the CURRENT tours.json
 * (11 tours, up from the 3 the NAMED DEBT comment was written against) and
 * produced 254 false failures -- not typos, but every tour step that
 * targets a control this codebase renders via ONE well-known, static,
 * non-row-dependent indirection: `data-control-id={someIdent}` where
 * `someIdent` is a local `const` (five call sites: ShiftManagementScreen,
 * PermissionsScreen, WorkerLifecycleScreen x2, DevicesScreen), a JSX prop
 * this component was HANDED (`ArchiveControl`, `ConfirmDialog`,
 * `CaptureControl`, `StepCanvas`, `Chart`, `ControlDisclosure` -- all
 * literally or template-literally supplied a `controlId="..."` /
 * `controlId={\`...\`}` prop by their caller, same file), or the ONE
 * central `controlIdFor(name) => \`field-${name}\`` helper every product
 * form field (`Form.tsx`) funnels through. None of these are role/route/
 * data-conditional the way `DataTable`'s `${idPrefix}-select-${rowId}` is
 * -- every value they need is itself authored as a literal at some call
 * site in the same file -- so they are answerable WITHOUT resolving a
 * composed id into a live-DOM row value (the thing the NAMED DEBT comment
 * says never to attempt): scrape both `data-control-id=` AND `controlId=`
 * (the one prop name this codebase's whole product-primitive layer uses
 * for exactly this hand-off) for literal AND template-literal values,
 * follow ONE local `const IDENT = ...` hop when the attribute is a bare
 * identifier, and treat any interpolation inside a template (`${...}`) as
 * an unresolved wildcard -- never as something to fill in. A pattern this
 * builds is therefore a SHAPE ("starts with `sites-search`... no: `.+-
 * search`"), never a resolved instance ("row AR-0002 exists") -- the
 * DataTable-row case from the NAMED DEBT comment still has no shape to
 * scrape from that is any narrower than "any string", so it is still,
 * correctly, left to `TourRunner` alone (see the anchor-length guard
 * below, which exists specifically to refuse a pattern that weak).
 *
 * SCOPE, STILL BY DESIGN: no VALUE is ever resolved, only recognized.
 * `${rowId}`, `${t.id}`, `${resultMessage.tone}` and similar always widen
 * to a wildcard; this script never learns what a live row id or write-
 * result tone actually is, and never could without loading seed data and
 * rendering the app, which is TourRunner's job (`src/tours/runner.ts`,
 * `src/tours/actions.ts`), not this build-time gate's. A pattern is only
 * accepted if the LITERAL text surrounding its wildcard(s) is at least
 * `MIN_PATTERN_LITERAL_CHARS` characters -- long enough that "the target
 * matches this shape" is actually evidence of something, short enough
 * that no real composed-id family in this codebase is missed. Below that
 * threshold (only `RadioGroup`'s `${bound.controlId}-${opt.value}`
 * option ids fall under it today) the pattern is discarded rather than
 * accepted -- a rejected pattern this weak would make the whole gate
 * nearly vacuous (`^.+-.+$` matches almost any string), which is worse
 * than leaving those specific ids unresolved by this static pass.
 *
 * Ceiling: catches a renamed/typo'd/removed control id whose value (or
 * whose recognizable shape) no longer appears anywhere in source, before
 * a browser ever opens. Cannot catch "exists in source but not reachable
 * for this role/route/data right now", or a wrong value that still falls
 * inside a wide-anchored pattern's wildcard -- whether that's a bad
 * SUFFIX (`^tenant-metrics-select-.+$` accepts any tenant id, real or
 * not) or, the harder case, a bad PREFIX ahead of a real suffix
 * (`^.+-search$`, from `TableToolbar`'s own `${idPrefix}-search`,
 * accepts ANY string ending in `-search`). This task found exactly that
 * second shape live: `TOUR-ORIENTATION-001` targeted
 * `"doh-02-location-search"` -- a plausible-looking id (`doh-02` is this
 * module's real §9.6 registry prefix, `registries/generated/doh/
 * module-reach.json`) that never appears anywhere in `app/**`/`src/ui/
 * **`, literal or composed; the DataTable this screen actually renders
 * derives its search control id from `slugify(caption)`
 * (`src/ui/product/DataTable.tsx`), giving `sites-search`, not a
 * module-id-prefixed name. This script's own pattern set did NOT catch
 * that miss (`"doh-02-location-search"` matches `^.+-search$` exactly as
 * well as `"sites-search"` does) -- it was found by hand, tracing the
 * real control id through source, and fixed in `tours.json` alongside
 * this script landing (see the task report). Both failure shapes stay
 * TourRunner's job permanently -- no static pattern can tell a real row
 * id, tenant id, or module prefix from a wrong one without rendering the
 * app. Owner: whoever next edits `src/tours/**` or adds a fourth seed
 * tour (same owner line as the NAMED DEBT comment this closes).
 *
 * Run with: node scripts/check-tour-targets.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TOURS_PATH = path.join(ROOT, 'src/data/collections/tours.json')
const CONTROL_ID_ROOTS = ['app', 'src/ui']

function walk(dir, test, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, test, acc)
    else if (test(entry)) acc.push(full)
  }
  return acc
}

/** Minimum total literal (non-wildcard) characters a scraped template must
 *  contribute before its pattern is trusted. See the header comment. */
const MIN_PATTERN_LITERAL_CHARS = 3

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Turns a scraped template-literal body (the text between backticks, e.g.
 *  `${idPrefix}-select-${rowId}`) into an anchored wildcard RegExp, never
 *  attempting to fill in what an interpolation resolves to. Returns null
 *  when the surrounding literal text is too thin to be useful evidence
 *  (see MIN_PATTERN_LITERAL_CHARS). */
function templateToPattern(tpl) {
  const parts = tpl.split(/\$\{[^}]*\}/)
  const literalChars = parts.reduce((n, p) => n + p.length, 0)
  if (literalChars < MIN_PATTERN_LITERAL_CHARS) return null
  return new RegExp(`^${parts.map(escapeRegExp).join('.+')}$`)
}

const literalIds = new Set()
const composedPatterns = []
const addPattern = (tpl) => {
  const re = templateToPattern(tpl)
  if (re) composedPatterns.push(re)
}

// The one attribute the DOM actually carries, and the one prop name this
// codebase's product-primitive layer (ConfirmDialog, CaptureControl,
// StepCanvas, Chart, ControlDisclosure, and every ad-hoc per-row control
// like ArchiveControl/CreateAction) uses to hand a caller's id down to it
// -- both funnel into the same `data-control-id` DOM attribute somewhere
// in the same file, per the header comment.
const ATTR_NAMES = ['data-control-id', 'controlId']

for (const dir of CONTROL_ID_ROOTS) {
  const full = path.join(ROOT, dir)
  if (!existsSync(full)) {
    console.error(`FAIL  scan root missing: ${dir}`)
    process.exit(1)
  }
  for (const f of walk(full, (name) => name.endsWith('.tsx'))) {
    const text = readFileSync(f, 'utf8')

    // Local literal/template `const IDENT = ...` declarations, for
    // resolving a bare `attr={IDENT}` one hop within the same file. Kept as
    // IDENT -> every value seen (not just the last): this codebase reuses
    // generic names like `controlId` across multiple sibling functions in
    // one file (e.g. PermissionsScreen.tsx declares it twice, once a plain
    // literal, once a template), and a bare usage can't tell which
    // function's declaration it belongs to without a real scope analysis
    // -- crediting every same-named declaration in the file is the safe
    // direction to be wrong in (only ever adds more known-good ids/shapes).
    const stringConsts = new Map()
    const templateConsts = new Map()
    const remember = (map, ident, value) => {
      if (!map.has(ident)) map.set(ident, [])
      map.get(ident).push(value)
    }
    for (const m of text.matchAll(/const\s+(\w+)\s*=\s*'([^'$]+)'/g)) remember(stringConsts, m[1], m[2])
    for (const m of text.matchAll(/const\s+(\w+)\s*=\s*"([^"$]+)"/g)) remember(stringConsts, m[1], m[2])
    for (const m of text.matchAll(/const\s+(\w+)\s*=\s*`([^`]*)`/g)) remember(templateConsts, m[1], m[2])

    for (const attr of ATTR_NAMES) {
      for (const m of text.matchAll(new RegExp(`${attr}="([^"$]+)"`, 'g'))) literalIds.add(m[1])
      for (const m of text.matchAll(new RegExp(attr + '=\\{`([^`]*)`\\}', 'g'))) addPattern(m[1])
      for (const m of text.matchAll(new RegExp(`${attr}=\\{(\\w+)\\}`, 'g'))) {
        const ident = m[1]
        for (const v of stringConsts.get(ident) ?? []) literalIds.add(v)
        for (const v of templateConsts.get(ident) ?? []) addPattern(v)
        // else: bare identifier this pass can't trace (a prop from another
        // file, a hook return value, ...) -- left unresolved, not credited.
      }
    }

    // The one central helper (`Form.tsx#controlIdFor`) every product form
    // field funnels its `data-control-id` through. Matched by name, not
    // hardcoded as the string "field-", so a rename still self-updates.
    for (const m of text.matchAll(/function\s+(\w*[Cc]ontrol[Ii]d\w*)\s*\([^)]*\)[^{]*\{\s*return\s+`([^`]*)`/g)) {
      addPattern(m[2])
    }
  }
}

if (!existsSync(TOURS_PATH)) {
  console.error(`FAIL  missing ${path.relative(ROOT, TOURS_PATH)}`)
  process.exit(1)
}
const tours = JSON.parse(readFileSync(TOURS_PATH, 'utf8'))

const isComposedInJson = (v) => typeof v === 'string' && v.includes('${')
const isKnown = (v) => literalIds.has(v) || composedPatterns.some((re) => re.test(v))

let checked = 0
let failed = 0
const fail = (tourId, stepIndex, field, value) => {
  console.error(`FAIL  ${tourId} step[${stepIndex}] ${field}: "${value}" is not a known data-control-id`)
  failed++
}

for (const tour of tours) {
  tour.steps.forEach((step, i) => {
    const candidates = []
    const a = step.action
    if (a && (a.kind === 'click' || a.kind === 'type' || a.kind === 'select')) {
      candidates.push(['action.controlId', a.controlId])
    }
    if (a && a.kind === 'assertState') {
      candidates.push(['action.check', a.check])
    }
    if (step.expectVisible !== undefined) candidates.push(['expectVisible', step.expectVisible])
    if (step.spotlight !== undefined) candidates.push(['spotlight', step.spotlight])

    for (const [field, value] of candidates) {
      if (isComposedInJson(value)) continue
      checked++
      if (!isKnown(value)) fail(tour.id, i, field, value)
    }
  })
}

if (failed) {
  console.error(
    `\n${failed} tour target(s) not found among ${literalIds.size} scraped literal control ids ` +
      `and ${composedPatterns.length} scraped composed-id shapes.`,
  )
  process.exit(1)
}
console.log(
  `ok    tour targets  ${checked} literal target(s) checked against ${literalIds.size} scraped ` +
    `literal control ids and ${composedPatterns.length} scraped composed-id shapes`,
)

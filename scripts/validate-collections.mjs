#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
// The brief's sample registers the loader as
// `register('tsx/esm', import.meta.url)` via `node:module` — that throws
// immediately on this repo's Node runtime ("tsx must be loaded with
// --import instead of --loader"; `node:module#register` no longer accepts
// the older loader-style hook `tsx/esm` exports). `tsx/esm/api` is tsx's
// own module for exactly this programmatic-registration case; it also
// resolves this repo's `@/*` tsconfig path alias, which the schema modules
// use to reuse existing `src/domain` and `src/policy` vocabularies.
import { register } from 'tsx/esm/api'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
register()
const { COLLECTIONS, RELATIONS, UNCHECKABLE_ID_FIELDS } = await import(join(root, 'src/data/schemas/index.ts'))

let failed = 0
const fail = (msg) => { console.error(`FAIL  ${msg}`); failed++ }
const loaded = {}

for (const [name, def] of Object.entries(COLLECTIONS)) {
  const path = join(root, 'src/data/collections', def.file)
  if (!existsSync(path)) { fail(`${name}: missing ${def.file}`); continue }
  let rows
  try { rows = JSON.parse(readFileSync(path, 'utf8')) }
  catch (e) { fail(`${name}: not valid JSON — ${e.message}`); continue }
  if (!Array.isArray(rows)) { fail(`${name}: top level must be an array`); continue }

  const seen = new Set()
  rows.forEach((row, i) => {
    const r = def.schema.safeParse(row)
    if (!r.success) {
      for (const issue of r.error.issues) {
        fail(`${name}[${i}] ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      }
      return
    }
    if (seen.has(row.id)) fail(`${name}[${i}]: duplicate id ${row.id}`)
    seen.add(row.id)
  })
  loaded[name] = rows
  console.log(`ok    ${name.padEnd(24)} ${String(rows.length).padStart(5)} rows`)
}

// `field` may be a nested path, `'<arrayField>[].<leafField>'` (fix round 2:
// `tours.steps[].controlId` is the one field that needs this). Walks
// `row[arrayField]` and yields one `{ value, label }` per element's leaf
// field, recursively — so an arbitrarily deep chain of `arr[].arr[].leaf`
// would work too, though nothing in this schema set needs more than one
// level today. A plain (non-nested) `field` behaves exactly as before.
function valuesAtPath(row, path, label) {
  if (row === undefined) return []
  const m = path.match(/^([^[.]+)\[\]\.(.+)$/)
  if (!m) return [{ value: row[path], label: `${label}.${path}` }]
  const [, arrKey, rest] = m
  const arr = row[arrKey]
  if (!Array.isArray(arr)) return []
  return arr.flatMap((el, i) => valuesAtPath(el, rest, `${label}.${arrKey}[${i}]`))
}

for (const rel of RELATIONS) {
  const src = loaded[rel.from], dst = loaded[rel.to]
  if (!src || !dst) continue
  const ids = new Set(dst.map((r) => r.id))
  src.forEach((row, i) => {
    for (const { value: v, label } of valuesAtPath(row, rel.field, `${rel.from}[${i}]`)) {
      if (v === undefined) continue
      const values = rel.array ? v : [v]
      for (const one of values) {
        if (one === null) { if (!rel.nullable) fail(`${label}: null not allowed`); continue }
        if (!ids.has(one)) fail(`${label}: "${one}" is not an id in ${rel.to}`)
      }
    }
  })
}

// Fix round 1 (review finding 1): a `RELATIONS` row is opt-in, so a field
// nobody remembered to register is silently unchecked rather than flagged.
// This closes that hole from the other direction — every schema field whose
// name ends in `Id`/`Ids`, AT ANY DEPTH, must be either in `RELATIONS` or on
// the explicit `UNCHECKABLE_ID_FIELDS` allowlist (with its reason, in
// index.ts), or the validator reds naming the field's full path.
//
// Fix round 2 (re-review finding: the depth-1 version of this function
// walked past `tours.steps[].controlId` — a real, existing nested field its
// own comment named as exactly this shape of gap, and still missed it).
// `fieldPaths()` now recurses into a `z.array(z.object(...))` field's
// element shape too, yielding `'<arrayField>[].<leafField>'` paths that
// `valuesAtPath()` above knows how to follow at check time. A discriminated
// union's variants are unioned the same way they always were.
function fieldPaths(schema, prefix = '') {
  const out = []
  if (schema.shape) {
    for (const [key, sub] of Object.entries(schema.shape)) {
      const path = prefix ? `${prefix}.${key}` : key
      out.push(path)
      const element = sub && sub.element // ZodArray's element schema, if `sub` is one
      if (element && (element.shape || element.options)) {
        for (const nested of fieldPaths(element)) out.push(`${path}[].${nested}`)
      }
    }
  } else if (schema.options) {
    for (const opt of schema.options) out.push(...fieldPaths(opt, prefix))
  }
  return [...new Set(out)]
}

const relationCovered = new Set(RELATIONS.map((r) => `${r.from}.${r.field}`))
const allowlisted = new Set(UNCHECKABLE_ID_FIELDS.map((r) => `${r.from}.${r.field}`))

for (const [name, def] of Object.entries(COLLECTIONS)) {
  for (const field of fieldPaths(def.schema)) {
    if (!/Ids?$/.test(field)) continue
    const key = `${name}.${field}`
    if (relationCovered.has(key) || allowlisted.has(key)) continue
    fail(`${name}.${field}: ends in Id/Ids but is not in RELATIONS or UNCHECKABLE_ID_FIELDS`)
  }
}

if (failed) { console.error(`\n${failed} problem(s)`); process.exit(1) }
console.log('\nall collections valid')

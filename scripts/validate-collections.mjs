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

// `field` is a path that may step through any mix of plain nested objects
// (`'config.ownerId'`) and array descents (`'steps[].controlId'`), to any
// depth and in any combination (`'obj.arr[].someId'`,
// `'outerArr[].innerArr[].someId'`) — fix round 3 (re-review finding: round
// 2's version only ever matched ONE `arr[].rest` segment, so a plain nested
// object was invisible to it, the exact blind spot the finding named).
// A leading segment ending in `[]` descends into that array field and
// recurses per element; otherwise it descends into that plain field and
// recurses once. Recursion stops at the first `undefined`/`null` along the
// way (an absent or nullable container has nothing beneath it to check —
// the LEAF's own `nullable` handling happens in the caller, below). A path
// with no `.`/`[]` at all behaves exactly as the original flat lookup did.
function valuesAtPath(row, path, label) {
  if (row === undefined || row === null) return []
  const m = path.match(/^([^[.]+)(\[\])?(?:\.(.+))?$/)
  if (!m) return []
  const [, key, isArray, rest] = m
  if (isArray) {
    const arr = row[key]
    if (!Array.isArray(arr)) return []
    if (rest === undefined) return arr.map((v, i) => ({ value: v, label: `${label}.${key}[${i}]` }))
    return arr.flatMap((el, i) => valuesAtPath(el, rest, `${label}.${key}[${i}]`))
  }
  if (rest === undefined) return [{ value: row[key], label: `${label}.${key}` }]
  return valuesAtPath(row[key], rest, `${label}.${key}`)
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
// Fix round 2 added array recursion (`z.array(z.object(...))`).
//
// Fix round 3 (re-review finding: round 2's recursion only ever descended
// `sub.element` — array-shaped — so a plain nested `z.object` field, e.g.
// `z.object({ config: z.object({ ownerId: z.string() }) })`, was pushed as
// one opaque path (`'config'`) and never walked into; `config.ownerId`
// never appeared. Proved on throwaway scratch schemas outside `src/data`,
// not on anything in this codebase — see the report). `unwrap()` strips
// whatever zod wrapped the field in (`.optional()`, `.nullable()`,
// `.default()`, and any chain of those) before asking what shape is
// underneath, rather than special-casing the two this project happens to
// use — the wrapper is irrelevant to the STRUCTURE being walked. A plain
// object sub-field now recurses exactly like an array element does, just
// without the `[]` marker in the path, so `'obj.arr[].someId'` and
// `'arr[].obj.someId'` both resolve, at any depth and in any combination.
// `.unwrap()` itself is not a safe generic signal: `ZodArray` also defines
// it, meaning "give me the element type" (Array<T> -> T) — a completely
// different operation from what `ZodOptional`/`ZodNullable`/`ZodDefault`
// mean by the same method name (T-or-undefined -> T). Calling it
// unconditionally on an array field silently swapped the array away and is
// what broke round 3's first draft of this fix. `_def.innerType` is the
// actual shared shape every wrapper-around-one-inner-schema type sets
// (`optional`, `nullable`, `default`, `readonly`, `catch`, and presumably
// whatever else this zod version or a later one adds in the same family) —
// arrays set `_def.element`, objects set `_def.shape`, unions set
// `_def.options`, so this signal, unlike the method's presence, only ever
// matches an actual wrapper.
function unwrap(schema) {
  while (schema && schema._def && schema._def.innerType) schema = schema._def.innerType
  return schema
}

function fieldPaths(rawSchema, prefix = '') {
  const out = []
  const schema = unwrap(rawSchema)
  if (schema.shape) {
    for (const [key, rawSub] of Object.entries(schema.shape)) {
      const path = prefix ? `${prefix}.${key}` : key
      out.push(path)
      const sub = unwrap(rawSub)
      const element = sub.element && unwrap(sub.element) // ZodArray's element schema, if `sub` is one
      if (element && (element.shape || element.options)) {
        for (const nested of fieldPaths(element)) out.push(`${path}[].${nested}`)
      } else if (sub.shape || sub.options) {
        for (const nested of fieldPaths(sub)) out.push(`${path}.${nested}`)
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

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
import { unwrap, fieldPaths, valuesAtPath } from './lib/schema-walk.mjs'

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

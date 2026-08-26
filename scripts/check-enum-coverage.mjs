#!/usr/bin/env node
// Enum-coverage sweep across the full seed database (fix round 1 of the
// 2026-08-26 runway plan Task 5 review). Proposed by the review, built here
// because this is the fourth time in this build that a schema permitted a
// case, the seed never constructed it, `validate-collections.mjs` passed
// anyway (well-formedness, never state coverage), and a required screen
// would have rendered nothing for it -- after the never-held Clearance
// (Task 3), the package failure states (Task 4), and the qualification-
// clearance pair (Task 3). Every one was caught by a person reading field
// shapes; this script is that reading, mechanised and repeatable.
//
// REPORT-ONLY, BY DESIGN. This never calls `process.exit(1)` and is not
// wired into `pnpm build`/`pnpm verify`/any per-task check. Run today,
// against a seed only six of nineteen runway tasks have populated, it would
// print mass "gaps" for every enum in `notifications`/`commands`/`events`/
// `audit`/`schedules`/`tours` for the simple reason that Tasks 6 and 15
// have not run yet -- that is not a defect, and a gate that hard-fails on
// it trains people to pad the allowlist reflexively rather than read the
// finding. Run this once, by hand, at the end of the full seed pipeline
// (after Task 6, or whichever task finishes it) -- not per-task, not
// wired into any script here, so it never blocks a task that legitimately
// hasn't populated a later collection yet.
//
// WHAT IT CANNOT DO. Deciding whether an unseeded value is a real product
// gap or a legitimate V1 exclusion took the reviewer reading five separate
// blueprint sections by hand. This script cannot make that judgment --  it
// can only count. `ALLOWLIST` below is where that judgment is recorded,
// and every entry carries a citation a reader can check, never a bare
// exception. An allowlist entry justified by "Task 6 owns this" stops
// being a correct entry the moment Task 6 ships -- re-run this after every
// later seed task lands and re-read what's still on the list.
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { register } from 'tsx/esm/api'
import { unwrap, valuesAtPath } from './lib/schema-walk.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
register()
const { COLLECTIONS } = await import(join(root, 'src/data/schemas/index.ts'))

// --- the allowlist --------------------------------------------------------
// One row per deliberately-unseeded enum value. `value: '*'` allowlists
// every value of that site at once (used only for whole collections a
// later task owns and has not run yet — never for a partial gap within a
// collection this seed already populates). Every reason names either a
// frozen-source citation proving the value is out of V1 scope, or the
// task that owns the collection and has not shipped it yet.
const ALLOWLIST = [
  // Run.source — reserved for V2 integrations, not a gap.
  { collection: 'runs', path: 'source', value: 'auto-scheduled', reason: 'Reserved for V2: "auto-scheduling is deferred and the auto-scheduled source value is reserved for it" (blueprint L68541); "reserved external fields held null at V1" (L8023).' },
  { collection: 'runs', path: 'source', value: 'erp-inbound', reason: 'Reserved for V2 integrations, same L68541/L8023 citation as auto-scheduled.' },
  { collection: 'runs', path: 'source', value: 'api-inbound', reason: 'Reserved for V2 integrations, same L68541/L8023 citation as auto-scheduled.' },
  // Evidence.mediaType — the source has not decided the permitted list yet.
  { collection: 'evidence', path: 'mediaType', value: 'video', reason: 'The permitted evidence-media list is TBD — Client Decision Required under DEC-MEDIA-001 (blueprint L71807); not a gap this seed can resolve on its own.' },
  { collection: 'evidence', path: 'mediaType', value: 'document', reason: 'Same DEC-MEDIA-001 citation as video (L71807).' },
  // Collections owned entirely by a later, not-yet-run task.
  { collection: 'tours', path: '*', value: '*', reason: 'Task 15 owns tours.json; still a single Task-1 placeholder row.' },

  // --- Task 6's ten pre-existing gate failures in Task 2/3 collections, decided individually ---
  // (docs/superpowers/plans/2026-08-26-runway.md Task 6 brief). Six were genuine gaps and are
  // now seeded (sites/areas/locations/shifts.status 'archived', workers.status 'reactivated',
  // devices.storagePressure 'critical') so they carry no entry here any more. The four below are
  // NOT gaps: each is a state the frozen source assigns to a different object, or explicitly
  // withholds from the product surface, so no row should ever carry it.
  {
    collection: 'users', path: 'status', value: 'suspended',
    reason: "OBJ-027 · User account's own lifecycle (L8351) is exactly three states -- " +
      '"provisioned, active, disabled". Suspension is the TENANT\'s lifecycle ' +
      "(soft-suspended/hard-suspended/compliance-suspended on `Tenant.lifecycle`), not the " +
      "User's own status -- confirmed the hard way in this seed's own history: fix commit " +
      "39ae3cf (\"hard suspension does not lock a worker out\") reverted two SummitGear workers " +
      "from `status: 'suspended'` back to `'active'` specifically because a hard-suspended " +
      "tenant's floor continues (L2237: 'no new runs; mandatory notifications and audit " +
      "continue') and folding the tenant's suspension into the User row misrepresented that. " +
      "No row should carry User.status: 'suspended'.",
  },
  {
    collection: 'users', path: 'status', value: 'expired',
    reason: "Same OBJ-027 citation as 'suspended' above (L8351, three states only). Nothing in " +
      "the source models the User account itself as expiring: qualifications expire " +
      "(Qualification.status, already seeded), credentials are trusted within the offline-trust " +
      "window (a device/session concept, not User.status), and a lapsed pre-activation " +
      "invitation is its own notification-shaped state sequence (L75551: 'created, eligible, " +
      "queued, sent, ... expired, superseded, ...') seeded on `notifications`, not folded onto " +
      "the eventual User row. No row should carry User.status: 'expired'.",
  },
  {
    collection: 'role-grants', path: 'role', value: 'ROOT_SUPER_ADMIN',
    reason: 'The root account is "created through the backend at platform commissioning, never ' +
      'through any user interface" (L11652, restated L14937-14940, L8345: "console users are ' +
      'created by the Root Super Admin only ... no role-escalation path except the root ' +
      'acting"). A RoleGrant row models an in-product act (`grantedBy`/`grantedAt`, an admin ' +
      "granting a role through the product); a ROOT_SUPER_ADMIN role-grant row would misrepresent " +
      'a backend-only, one-time provisioning event as an ordinary product grant. The account\'s ' +
      'own creation is still auditable (L8356: "account provisioning events including the ' +
      "backend creation of the root are audit events\") and is seeded on `audit`, where " +
      "`effectiveRole: 'ROOT_SUPER_ADMIN'` genuinely appears. No row should carry " +
      "role-grants.role: 'ROOT_SUPER_ADMIN'.",
  },
  {
    collection: 'access-sessions', path: 'kind', value: 'break-glass',
    reason: 'The frozen source uses "break-glass" as a label for two different things, neither ' +
      "of which is a distinct AccessSession row alongside 'compliance-emergency'. First: L6467/" +
      'L9687 read it as a name for the SAME mechanism already seeded as `kind: \'compliance-' +
      'emergency\'` ("the break-glass route IS the compliance-emergency path"; "the term is not ' +
      'used" in the Statement of Work itself, L6467). Second: L15617-15690 use it for root-' +
      'account credential re-provisioning, a `Recommendation — R&D` procedure that REPLACES the ' +
      'root identity rather than granting scoped tenant access, and so has no tenantId/scope to ' +
      "put in an AccessSession row at all. Under either reading, no row should carry " +
      "access-sessions.kind: 'break-glass' -- every genuine break-glass event in this seed is " +
      "correctly recorded as `kind: 'compliance-emergency'`.",
  },
]

// --- schema-side: every reachable ZodEnum, and every union's literal
// discriminant field (the `unitOrLot.kind` shape), with its declared values.
function literalValue(rawSchema) {
  const s = rawSchema && unwrap(rawSchema)
  if (!s || !s._def || s._def.type !== 'literal') return undefined
  return Array.isArray(s._def.values) ? s._def.values[0] : s._def.value
}

function enumSites(rawSchema, prefix = '') {
  const out = []
  const schema = unwrap(rawSchema)
  const type = schema && schema._def && schema._def.type
  if (type === 'object') {
    for (const [key, rawSub] of Object.entries(schema.shape)) {
      out.push(...enumSites(rawSub, prefix ? `${prefix}.${key}` : key))
    }
  } else if (type === 'array') {
    out.push(...enumSites(schema._def.element, `${prefix}[]`))
  } else if (type === 'enum') {
    out.push({ path: prefix, values: schema.options })
  } else if (type === 'union') {
    const branches = schema._def.options
    // The discriminant-literal pattern this schema layer actually uses:
    // every branch is a plain object, and one field name (conventionally
    // `kind`) is a bare `z.literal(...)` on every branch. `Capture.unitOrLot`
    // is the only in-scope instance; crosscutting.ts's `discriminatedUnion`
    // rows (Event, Schedule, Evaluation, all Task 6-owned) are the same
    // shape and are picked up the same way, generically, with no special
    // case for either.
    const literalKeys = new Set()
    for (const b of branches) {
      const bs = unwrap(b)
      if (!bs || !bs._def || bs._def.type !== 'object') continue
      for (const [k, v] of Object.entries(bs.shape)) {
        if (literalValue(v) !== undefined) literalKeys.add(k)
      }
    }
    for (const key of literalKeys) {
      const values = branches.map((b) => literalValue(unwrap(b).shape?.[key])).filter((v) => v !== undefined)
      if (values.length) out.push({ path: prefix ? `${prefix}.${key}` : key, values })
    }
    for (const b of branches) out.push(...enumSites(b, prefix))
  }
  return out
}

// --- data side: load every collection, then check each enum site's
// declared values against what the rows actually carry at that path.
const loaded = {}
for (const [name, def] of Object.entries(COLLECTIONS)) {
  const path = join(root, 'src/data/collections', def.file)
  if (!existsSync(path)) continue
  try {
    loaded[name] = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    continue
  }
}

const allowMap = new Map() // "collection.path" -> Set(values) | '*'
for (const a of ALLOWLIST) {
  const key = `${a.collection}.${a.path}`
  if (a.value === '*') { allowMap.set(key, '*'); continue }
  const existing = allowMap.get(key)
  if (existing === '*') continue
  const set = existing instanceof Set ? existing : new Set()
  set.add(a.value)
  allowMap.set(key, set)
}
const allowReason = new Map(ALLOWLIST.map((a) => [`${a.collection}.${a.path}.${a.value}`, a.reason]))
const collectionAllowlisted = new Set(
  ALLOWLIST.filter((a) => a.path === '*' && a.value === '*').map((a) => a.collection),
)

let realGaps = 0
let allowlistedGaps = 0
let sitesChecked = 0

for (const [name, def] of Object.entries(COLLECTIONS)) {
  const rows = loaded[name] ?? []
  const sites = enumSites(def.schema)
  for (const site of sites) {
    sitesChecked++
    const seen = new Set()
    rows.forEach((row, i) => {
      for (const { value } of valuesAtPath(row, site.path, `${name}[${i}]`)) {
        if (typeof value === 'string') seen.add(value)
      }
    })
    const missing = site.values.filter((v) => !seen.has(v))
    if (!missing.length) continue
    const key = `${name}.${site.path}`
    const allow = allowMap.get(key)
    if (collectionAllowlisted.has(name) || allow === '*') {
      allowlistedGaps += missing.length
      console.log(`WARN  ${name}.${site.path}: missing ${JSON.stringify(missing)} — allowlisted (${collectionAllowlisted.has(name) ? ALLOWLIST.find((a) => a.collection === name && a.path === '*').reason : 'whole site'})`)
      continue
    }
    for (const v of missing) {
      const reason = allowReason.get(`${key}.${v}`)
      if (reason) {
        allowlistedGaps++
        console.log(`WARN  ${key}: missing "${v}" — allowlisted (${reason})`)
      } else {
        realGaps++
        console.log(`FAIL  ${key}: missing "${v}" — zero rows across ${rows.length} carry this value`)
      }
    }
  }
}

console.log(
  `\n${sitesChecked} enum site(s) checked across ${Object.keys(COLLECTIONS).length} collections — `
  + `${realGaps} unallowlisted gap(s), ${allowlistedGaps} allowlisted gap(s).`,
)
console.log('Report-only: exit code is always 0. A FAIL line is the thing to act on; a WARN line is a reviewed exception.')

#!/usr/bin/env node
// Task 2 (unit-02) — deterministic, idempotent top-up of Bright Bikes'
// (`TEN-BRIGHTBIKES`) Shift seed volume, per the task brief's Step 5 (seed
// volume for the Bright Bikes tenant specifically, not the total):
// `shifts.json` held 13 rows ACROSS ALL 13 TENANTS, of which Bright Bikes
// carried only 4 (`SHIFT-BB-DAY`, `SHIFT-BB-NIGHT`, `SHIFT-BB-NG-DAY`,
// `SHIFT-BB-LS-DAY`) — well under a 10-row page size, so the primary
// `DataTable` on `ShiftManagementScreen.tsx` would never show more than one,
// partial page. Same generator shape `scripts/generate-location-seed.mjs`
// (Task 1) already established for the same reason, one collection down.
//
// IDEMPOTENT BY CONSTRUCTION, NOT BY A "HAS THIS ALREADY RUN" FLAG: every
// row this script owns carries the id segment `-EXP-` (the same
// fresh-generation marker Task 1's generator uses). Each run first strips
// every row already carrying that marker out of `shifts.json`, then
// re-appends the SAME freshly computed set — running it twice in a row
// produces byte-identical output, the determinism proof the brief's Step
// 5/8 asks for (`generate twice, compare sha256`).
//
// THE FOUR ORIGINAL BRIGHT BIKES SHIFTS ARE NEVER TOUCHED — "Bright Bikes
// cast emitted verbatim" (Task 1 brief Step 5, same rule applied here).
// This script only ever adds rows carrying its own `-EXP-` marker and only
// ever removes rows carrying that same marker; every other row, Bright
// Bikes or not, is copied through unchanged, in its original array
// position.
//
// ONE GENERATED SHIFT PER EXPANSION SITE (`SITE-BB-EXP-01`..`21`, the 21
// Sites Task 1's own generator added), bound to that Site's own primary
// Area (`AREA-BB-EXP-<nn>`) — never two Shifts on the same Site, so this
// script can never produce the very overlap `createShift`/`updateShift`
// (`repository.ts`) now refuse; that refusal is demonstrated live, through
// the screen, against real seeded neighbours, not pre-baked into the seed.
// `SITE-BB-EXP-21` (Green Bay) is archived (Task 1's generator); its one
// generated Shift is archived too, matching the existing seed's own
// precedent (`SITE-BB-LAKESIDE` archived hosting `SHIFT-BB-LS-DAY`
// archived) — every other generated Shift is active.
//
// No `Math.random()`, no `Date.now()`, no `new Date()` — every id, time and
// field below is a fixed literal or a deterministic function of a loop
// index, matching `src/data`'s own no-ambient-time-or-randomness rule.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const collectionsDir = join(root, 'src/data/collections')

const TENANT = 'TEN-BRIGHTBIKES'
const MARKER = '-EXP-'
const SITE_COUNT = 21

function load(name) {
  return JSON.parse(readFileSync(join(collectionsDir, name), 'utf8'))
}
function save(name, rows) {
  writeFileSync(join(collectionsDir, name), `${JSON.stringify(rows, null, 2)}\n`)
}
function stripGenerated(rows) {
  return rows.filter((r) => !r.id.includes(MARKER))
}
function pad2(n) {
  return String(n).padStart(2, '0')
}

/** `"HH:MM"` minus 15 minutes, same-day only (every block below starts at
 *  or after 06:00) — the same "digest fifteen minutes ahead of the shift
 *  start" spacing the original seed's own `SHIFT-BB-DAY`/`SHIFT-NF-DAY`/etc.
 *  rows already use (`"06:00"` start, `"05:45"` digest). */
function fifteenMinutesBefore(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m - 15
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const newShifts = []

for (let i = 1; i <= SITE_COUNT; i++) {
  const siteId = `SITE-BB${MARKER}${pad2(i)}`
  const areaId = `AREA-BB${MARKER}${pad2(i)}`
  const shiftId = `SHIFT-BB${MARKER}${pad2(i)}`
  // Alternates Day/Afternoon by index parity — real variety in the
  // "start-end" column beyond one repeated literal, and still never two
  // Shifts sharing a Site (one generated Shift per Site).
  const isAfternoon = i % 2 === 0
  const startTime = isAfternoon ? '14:00' : '06:00'
  const endTime = isAfternoon ? '22:00' : '14:00'
  const status = i === SITE_COUNT ? 'archived' : 'active'

  newShifts.push({
    id: shiftId,
    siteId,
    name: isAfternoon ? 'Afternoon Shift' : 'Day Shift',
    startTime,
    endTime,
    areaIds: [areaId],
    digestDeliveryTime: fifteenMinutesBefore(startTime),
    nominalProductionDateRule: 'same calendar day as shift start',
    status,
  })
}

const shifts = [...stripGenerated(load('shifts.json')), ...newShifts]
save('shifts.json', shifts)

const bbShifts = shifts.filter((s) => s.siteId.startsWith('SITE-BB-'))
console.log(`shifts: ${shifts.length} total, ${bbShifts.length} Bright Bikes`)

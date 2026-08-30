#!/usr/bin/env node
// Task 1 (unit-02) — deterministic, idempotent top-up of Bright Bikes'
// (`TEN-BRIGHTBIKES`) Site/Area/Location seed volume, per the task brief's
// Step 5: `sites.json`/`areas.json`/`locations.json` hold 14/18/43 rows
// ACROSS ALL 14 TENANTS, of which Bright Bikes carries only 3/7/21 —
// fewer than the 20-Site floor the primary DataTable's pagination needs
// three genuine pages (first, middle, last-partial) to demonstrate §8.6.1.
//
// IDEMPOTENT BY CONSTRUCTION, NOT BY A "HAS THIS ALREADY RUN" FLAG: every
// row this script owns carries the id segment `-EXP-` (a fresh-generation
// marker). Each run first strips every row already carrying that marker
// out of the three collections, then re-appends the SAME freshly computed
// set. Running it twice in a row therefore produces byte-identical files —
// the determinism proof the brief's Step 5/8 asks for — without needing a
// separate "did I already run" check that could itself drift from what the
// script actually emits.
//
// THE THREE ORIGINAL BRIGHT BIKES SITES (Riverside/Northgate/Lakeside) AND
// THEIR SEVEN AREAS/TWENTY-ONE LOCATIONS ARE NEVER TOUCHED — "Bright Bikes
// cast emitted verbatim" (brief Step 5). This script only ever adds rows
// carrying its own `-EXP-` marker and only ever removes rows carrying that
// same marker; every other row in all three files, Bright Bikes or not, is
// copied through unchanged, in its original array position.
//
// No `Math.random()`, no `Date.now()`, no `new Date()` — every id and
// field below is a fixed literal or a deterministic function of a loop
// index, matching `src/data`'s own no-ambient-time-or-randomness rule
// (this script writes into `src/data/collections/`, so it holds itself to
// the same discipline even though it runs at build/seed time, not runtime).

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const collectionsDir = join(root, 'src/data/collections')

const TENANT = 'TEN-BRIGHTBIKES'
const MARKER = '-EXP-'

function load(name) {
  return JSON.parse(readFileSync(join(collectionsDir, name), 'utf8'))
}
function save(name, rows) {
  writeFileSync(join(collectionsDir, name), `${JSON.stringify(rows, null, 2)}\n`)
}
function stripGenerated(rows) {
  return rows.filter((r) => !r.id.includes(MARKER))
}

// Twenty-one additional facility cities — plausible mid-size manufacturing/
// distribution locations, hand-authored (no further NAMED Bright Bikes
// site exists in the frozen source beyond Riverside Plant — see this
// script's header — so these are this build's own invention, not sourced).
// Timezone follows the real US zone for each state: Illinois/Wisconsin/
// Iowa are Central, Indiana (Eastern for these three cities) is not, which
// is deliberate — it gives the Site tier's timezone field genuine variety
// to demonstrate, not just the two zones the original three sites carry.
const CITIES = [
  { city: 'Rockford', state: 'IL', zip: '61101', tz: 'America/Chicago' },
  { city: 'Peoria', state: 'IL', zip: '61602', tz: 'America/Chicago' },
  { city: 'Aurora', state: 'IL', zip: '60505', tz: 'America/Chicago' },
  { city: 'Naperville', state: 'IL', zip: '60540', tz: 'America/Chicago' },
  { city: 'Joliet', state: 'IL', zip: '60431', tz: 'America/Chicago' },
  { city: 'Decatur', state: 'IL', zip: '62521', tz: 'America/Chicago' },
  { city: 'Champaign', state: 'IL', zip: '61820', tz: 'America/Chicago' },
  { city: 'Bloomington', state: 'IL', zip: '61701', tz: 'America/Chicago' },
  { city: 'Schaumburg', state: 'IL', zip: '60173', tz: 'America/Chicago' },
  { city: 'Cicero', state: 'IL', zip: '60804', tz: 'America/Chicago' },
  { city: 'Evanston', state: 'IL', zip: '60201', tz: 'America/Chicago' },
  { city: 'Waukesha', state: 'WI', zip: '53186', tz: 'America/Chicago' },
  { city: 'Kenosha', state: 'WI', zip: '53140', tz: 'America/Chicago' },
  { city: 'Racine', state: 'WI', zip: '53403', tz: 'America/Chicago' },
  { city: 'Gary', state: 'IN', zip: '46402', tz: 'America/Indiana/Indianapolis' },
  { city: 'South Bend', state: 'IN', zip: '46601', tz: 'America/Indiana/Indianapolis' },
  { city: 'Fort Wayne', state: 'IN', zip: '46802', tz: 'America/Indiana/Indianapolis' },
  { city: 'Dubuque', state: 'IA', zip: '52001', tz: 'America/Chicago' },
  { city: 'Cedar Rapids', state: 'IA', zip: '52401', tz: 'America/Chicago' },
  { city: 'Madison', state: 'WI', zip: '53703', tz: 'America/Chicago' },
  { city: 'Green Bay', state: 'WI', zip: '54301', tz: 'America/Chicago' },
]

const SITE_TYPES = [
  'Fabrication Plant',
  'Assembly Plant',
  'Distribution Center',
  'Machining Plant',
  'Components Plant',
  'Finishing Plant',
]

const AREA_NAMES = ['Production Floor', 'Fabrication Bay', 'Finishing Line', 'Staging and Shipping']

function pad2(n) {
  return String(n).padStart(2, '0')
}

const newSites = []
const newAreas = []
const newLocations = []

CITIES.forEach((c, i) => {
  const n = i + 1 // 1-indexed, 1..21
  const siteType = SITE_TYPES[i % SITE_TYPES.length]
  const siteId = `SITE-BB${MARKER}${pad2(n)}`
  const areaId = `AREA-BB${MARKER}${pad2(n)}`
  const locationId = `LOC-BB${MARKER}${pad2(n)}`
  // Site #21 (Green Bay) is deliberately archived WHILE its Area/Location
  // beneath it stay active — brief Step 5's "at least one archived Site
  // with active children (to drive Step 3's refusal)". Every other new
  // Site is active.
  const siteStatus = n === 21 ? 'archived' : 'active'

  newSites.push({
    id: siteId,
    tenantId: TENANT,
    name: `${c.city} ${siteType}`,
    address: `${100 + n} ${c.city} Industrial Pkwy, ${c.city}, ${c.state} ${c.zip}, USA`,
    contact: `${c.city.toLowerCase().replace(/\s+/g, '')}.ops@brightbikes.example`,
    timezone: c.tz,
    status: siteStatus,
  })
  newAreas.push({
    id: areaId,
    siteId,
    name: AREA_NAMES[i % AREA_NAMES.length],
    shiftIds: [],
    status: 'active',
  })
  newLocations.push({
    id: locationId,
    areaId,
    name: 'Line 1',
    requiredCertification: null,
    status: 'active',
  })

  // Site #1 (Rockford) additionally carries a SECOND Area that is itself
  // archived while ITS Location stays active — brief Step 5's "at least
  // one archived Area with active children", the Area-tier sibling of the
  // Site-tier case above.
  if (n === 1) {
    const extraAreaId = `AREA-BB${MARKER}01B`
    const extraLocationId = `LOC-BB${MARKER}01B`
    newAreas.push({
      id: extraAreaId,
      siteId,
      name: 'Legacy Fabrication Bay',
      shiftIds: [],
      status: 'archived',
    })
    newLocations.push({
      id: extraLocationId,
      areaId: extraAreaId,
      name: 'Line 1',
      requiredCertification: null,
      status: 'active',
    })
  }
})

const sites = [...stripGenerated(load('sites.json')), ...newSites]
const areas = [...stripGenerated(load('areas.json')), ...newAreas]
const locations = [...stripGenerated(load('locations.json')), ...newLocations]

save('sites.json', sites)
save('areas.json', areas)
save('locations.json', locations)

const bbSites = sites.filter((s) => s.tenantId === TENANT)
console.log(`sites: ${sites.length} total, ${bbSites.length} Bright Bikes`)
console.log(`areas: ${areas.length} total`)
console.log(`locations: ${locations.length} total`)

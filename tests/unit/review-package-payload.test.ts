import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { exportReviewPackage, importReviewPackage, PACKAGE_FORMAT_VERSION } from '@/review/package'
import { buildCensusSnapshot } from '@/review/census'
import { loadReconciliation, loadRegistry } from '@/registry/load'
import { GeneratedRegistrySchema } from '@/coverage/registry-schema'
import { REGISTRY_DESCRIPTORS } from '@/coverage/descriptors'
import { FROZEN_SOURCE_SHA256, MASTER_PROMPT_SHA256 } from '@/review/artefact-hashes'
import { CANONICAL_EPOCH_MS } from '@/domain/clock'
import { masterPromptObligation } from '../coverage/master-prompt'
import { stripComments } from '../coverage/strip-comments'

/**
 * R4-B06 — the review package now carries what master prompt §9.6 and §13.1
 * require it to carry, tested against the REAL artefacts rather than the
 * minimal fixtures in `review-package.test.ts`.
 *
 * `exportReviewPackage` and `importReviewPackage` had thirty-five test
 * references and zero references under `app/`, so both obligations were
 * unmeetable through the shipped product whatever the package type contained
 * — and what it contained was a bare `byStatus` map with neither the
 * reconciliation table nor the census in it.
 *
 * Three claims, and the round trip is the weakest of them: the payloads must
 * be the real ones, a corrupt package must quarantine naming the failing
 * entry, and an older package must be refused by VERSION rather than
 * misdiagnosed as corruption.
 */
const registries = REGISTRY_DESCRIPTORS.map((d) =>
  loadRegistry(
    GeneratedRegistrySchema,
    JSON.parse(readFileSync(`registries/generated/${d.slug}.json`, 'utf8')),
    d.slug,
  ),
)
const reconciliation = loadReconciliation(
  JSON.parse(readFileSync('registries/generated/source-reconciliation.json', 'utf8')),
).reconciliation.reconciliation_rows
const census = buildCensusSnapshot(registries)

const input = () => ({
  sourceHash: FROZEN_SOURCE_SHA256,
  promptHash: MASTER_PROMPT_SHA256,
  buildHash: 'not-wired-in-this-storyboard',
  scenarioVersion: 'not-wired-in-this-storyboard',
  scenarioSeed: 'not-wired-in-this-storyboard',
  fixtureRefs: [] as string[],
  records: [],
  decisions: [] as string[],
  bookmarks: [] as string[],
  coverageSnapshot: { takenAtLogical: CANONICAL_EPOCH_MS, byStatus: census.byStatus },
  reconciliation,
  census,
  screenshotRefs: [] as string[],
})
const expected = {
  sourceHash: FROZEN_SOURCE_SHA256,
  buildHash: 'not-wired-in-this-storyboard',
}

describe('the review package carries the real §9.6 table and §13.1 census', () => {
  it('the payload populations are the real ones, not a sample', () => {
    expect(registries.length).toBe(14)
    expect(reconciliation.length, 'reconciliation rows').toBeGreaterThanOrEqual(18)
    expect(census.totalRows, 'census rows').toBeGreaterThanOrEqual(5000)
    expect(census.registries.length).toBe(14)
    // Every registry contributes; a census built from one file would still
    // have a plausible-looking total.
    expect(census.registries.every((r) => r.rows > 0)).toBe(true)
    expect(
      census.registries.reduce((n, r) => n + r.rows, 0),
      'the per-registry rows sum to the total',
    ).toBe(census.totalRows)
  })

  it('the exported package carries both, complete', async () => {
    const pkg = await exportReviewPackage(input())
    expect(pkg.reconciliation.length).toBe(reconciliation.length)
    expect(pkg.census.totalRows).toBe(census.totalRows)
    expect(pkg.census.registries.map((r) => r.slug).sort()).toEqual(
      REGISTRY_DESCRIPTORS.map((d) => d.slug).sort(),
    )
    expect(pkg.promptHash).toBe(MASTER_PROMPT_SHA256)
    expect(pkg.sourceHash).toBe(FROZEN_SOURCE_SHA256)
  })

  it('both payloads sit inside the manifest hash scope', async () => {
    const base = input()
    const a = await exportReviewPackage(base)
    const b = await exportReviewPackage({
      ...base,
      census: { ...census, totalRows: census.totalRows + 1 },
    })
    expect(b.manifestChecksum, 'a changed census must change the checksum').not.toBe(
      a.manifestChecksum,
    )
    // Both payloads, not only the one that happened to be mutated first: a
    // reconciliation table carried on the package object but left OUT of
    // `packageFiles` would sit outside the hash scope and this is what
    // catches it.
    const c = await exportReviewPackage({
      ...base,
      reconciliation: reconciliation.slice(0, reconciliation.length - 1),
    })
    expect(c.manifestChecksum, 'a changed §9.6 table must change the checksum').not.toBe(
      a.manifestChecksum,
    )
    // And they are their own logical file, so a corrupted coverage payload is
    // distinguishable from corrupted metadata.
    expect(a.manifest.map((m) => m.path)).toContain('coverage.json')
  })

  it('round-trips: a freshly exported package imports and previews', async () => {
    const pkg = await exportReviewPackage(input())
    const outcome = await importReviewPackage(JSON.parse(JSON.stringify(pkg)), expected)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.preview.reconciliationRowCount).toBe(reconciliation.length)
    expect(outcome.preview.censusTotalRows).toBe(census.totalRows)
  })

  it('a corrupted coverage payload quarantines and names coverage.json', async () => {
    const pkg = await exportReviewPackage(input())
    const tampered = JSON.parse(JSON.stringify(pkg)) as typeof pkg & {
      census: { totalRows: number }
    }
    tampered.census.totalRows = 1
    const outcome = await importReviewPackage(tampered, expected)
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.quarantined).toBe(true)
    expect(outcome.failingEntry).toBe('coverage.json')
    expect(outcome.expected).toMatch(/^[0-9a-f]{64}$/)
    expect(outcome.actual).toMatch(/^[0-9a-f]{64}$/)
    expect(outcome.expected).not.toBe(outcome.actual)
  })

  it('a schema-version mismatch is refused BY VERSION, not misdiagnosed as corruption', async () => {
    const pkg = await exportReviewPackage(input())
    const older = { ...JSON.parse(JSON.stringify(pkg)), formatVersion: PACKAGE_FORMAT_VERSION - 1 }
    const outcome = await importReviewPackage(older, expected)
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('Unsupported package format version.')
    expect(outcome.expected).toBe(String(PACKAGE_FORMAT_VERSION))
    expect(outcome.actual).toBe(String(PACKAGE_FORMAT_VERSION - 1))
  })

  it('the census states what its denominator means rather than shipping bare counts', () => {
    expect(census.denominatorMeaning).toContain('Item-level, never registry-level')
    expect(census.denominatorMeaning).toContain('not-represented')
  })
})

/**
 * ═══════════════════════════════════════════════════════════════════════
 * R5-A08 — THE ONE OBLIGATION NOTHING ASSERTED WAS THE ONE ABOUT NOT
 * OVERSTATING A GUARANTEE.
 *
 * `tests/coverage/master-prompt.ts` declares eight obligations and seven were
 * called. The uncalled one was `checksumNotAuthenticity`: master prompt §21.1
 * requires the package checksum be labelled accidental-corruption and
 * integrity detection, NOT cryptographic authenticity, signer identity or
 * non-repudiation. The substance was already met and the review page already
 * rendered the disclaimer — so nothing was broken, and a future edit could
 * have deleted the disclaimer with nothing red. An unheld obligation is a
 * gate that cannot fail, which this build treats as worse than no gate.
 *
 * ASSERTED ON THE SOURCE WITH COMMENTS STRIPPED, not on the raw file: a
 * disclaimer commented out is a disclaimer no reader sees, and a raw
 * substring search cannot tell the two apart. `checksumNotAuthenticity` names
 * three things the label may not claim, and each is checked separately —
 * "not a signature" alone answers authenticity and leaves signer identity and
 * non-repudiation unanswered.
 * ═══════════════════════════════════════════════════════════════════════
 */
describe('R5-A08: master prompt §21.1 — the checksum is corruption detection, not a signature', () => {
  const PAGE = stripComments(readFileSync('app/review/page.tsx', 'utf8'))

  it('the obligation is verbatim in the committed prompt artefact', () => {
    const sentence = masterPromptObligation('checksumNotAuthenticity')
    expect(sentence).toContain('accidental-corruption and integrity detection')
    expect(sentence).toContain('not cryptographic authenticity, signer identity, or non-repudiation')
  })

  it('the review page labels it as corruption detection', () => {
    expect(PAGE).toContain('detects accidental corruption in transit')
  })

  it('the review page refuses all three of the claims §21.1 forbids', () => {
    // Authenticity.
    expect(PAGE, 'not cryptographic authenticity').toContain('It is not a signature')
    // Signer identity.
    expect(PAGE, 'not signer identity').toContain('says nothing about who produced the package')
    // Non-repudiation — the package's contents are not warranted by it.
    expect(PAGE, 'not non-repudiation').toContain('whether what it says is true')
  })

  it('the page never claims the checksum proves authenticity', () => {
    for (const forbidden of [/cryptographically signed/i, /proves authenticity/i, /tamper-proof/i]) {
      expect(PAGE, `forbidden claim ${forbidden}`).not.toMatch(forbidden)
    }
  })
})

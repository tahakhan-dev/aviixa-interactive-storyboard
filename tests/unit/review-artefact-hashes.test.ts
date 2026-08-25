import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import {
  FROZEN_SOURCE_PATH,
  FROZEN_SOURCE_SHA256,
  MASTER_PROMPT_PATH,
  MASTER_PROMPT_SHA256,
} from '@/review/artefact-hashes'

/**
 * R4-B13 item 1 — `promptHash` had no value anywhere in the tree except the
 * test literal `p-1`.
 *
 * A review package declares a source hash and a prompt hash so two packages
 * reviewed against different inputs can be told apart, and the prompt half
 * declared nothing, because the governing document was not an artefact at
 * all. It is one now, and both hashes live in `@/review/artefact-hashes` —
 * once each, imported by the review shell rather than pasted at a call site.
 *
 * A LITERAL HASH IS ONLY HONEST IF SOMETHING RECOMPUTES IT. The constants
 * cannot be read from disk at runtime: they are imported by a client
 * component, the browser has no filesystem, and fetching either artefact
 * would break master prompt §4.1's no-network boundary. So the check lives
 * here, where `node:fs` is available, and it is the whole justification for
 * the literals existing.
 */
describe('the two governing artefacts hash to what the build claims', () => {
  const sha = (path: string): string =>
    createHash('sha256').update(readFileSync(path)).digest('hex')

  it('the frozen blueprint matches the pinned source hash', () => {
    expect(sha(FROZEN_SOURCE_PATH)).toBe(FROZEN_SOURCE_SHA256)
  })

  it('the committed master prompt matches the pinned prompt hash', () => {
    expect(sha(MASTER_PROMPT_PATH)).toBe(MASTER_PROMPT_SHA256)
  })

  it('the two are different documents, and neither hash is a placeholder', () => {
    // `p-1` shipped as the only prompt hash in the tree for eleven slices.
    expect(FROZEN_SOURCE_SHA256).not.toBe(MASTER_PROMPT_SHA256)
    for (const hash of [FROZEN_SOURCE_SHA256, MASTER_PROMPT_SHA256]) {
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('the review shell exports a package with the real hashes, not literals of its own', () => {
    // The constants are imported rather than re-typed. A second copy pasted
    // into the page is the defect this file exists to prevent recurring.
    const page = readFileSync('app/review/page.tsx', 'utf8')
    expect(page).toContain('FROZEN_SOURCE_SHA256')
    expect(page).toContain('MASTER_PROMPT_SHA256')
    expect(page).not.toContain(FROZEN_SOURCE_SHA256)
    expect(page).not.toContain(MASTER_PROMPT_SHA256)
  })
})

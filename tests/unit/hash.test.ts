import { describe, it, expect } from 'vitest'
import { canonicalSerialize, sha256Hex, hashState } from '@/domain/hash'

describe('canonical serialisation', () => {
  it('orders object keys so hashing is stable', () => {
    expect(canonicalSerialize({ b: 1, a: 2 })).toBe(
      canonicalSerialize({ a: 2, b: 1 }),
    )
  })

  it('preserves array order, which is meaningful', () => {
    expect(canonicalSerialize([1, 2])).not.toBe(canonicalSerialize([2, 1]))
  })

  it('distinguishes undefined from absent', () => {
    expect(canonicalSerialize({ a: undefined })).not.toBe(
      canonicalSerialize({}),
    )
  })
})

describe('hashing', () => {
  it('produces a 64-character lowercase hex digest', async () => {
    const h = await sha256Hex('aviixa')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hashes equal states to equal digests regardless of key order', async () => {
    const a = await hashState({ x: 1, y: [1, 2] })
    const b = await hashState({ y: [1, 2], x: 1 })
    expect(a).toBe(b)
  })

  it('hashes different states to different digests', async () => {
    const a = await hashState({ x: 1 })
    const b = await hashState({ x: 2 })
    expect(a).not.toBe(b)
  })
})

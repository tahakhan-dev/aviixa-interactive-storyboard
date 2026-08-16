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

  it('distinguishes an undefined array element from an absent one', () => {
    // A field cleared to undefined must never collide with a field that was
    // never populated — the same guarantee the object case gives, extended
    // to arrays. Undefined has no key to anchor it, so this is the case that
    // actually silently drops without a distinct encoding.
    expect(canonicalSerialize([undefined])).not.toBe(canonicalSerialize([]))
  })

  it('distinguishes undefined from the literal string "undefined"', () => {
    expect(canonicalSerialize(undefined)).not.toBe(
      canonicalSerialize('undefined'),
    )
  })

  it('serialises -0 and 0 identically', () => {
    expect(canonicalSerialize(-0)).toBe(canonicalSerialize(0))
  })

  it('throws on a non-finite number', () => {
    expect(() => canonicalSerialize(Number.POSITIVE_INFINITY)).toThrow()
    expect(() => canonicalSerialize(Number.NaN)).toThrow()
  })

  it('throws rather than silently collapsing a Date to {}', () => {
    // Domain state must never hold a Date — time comes only from the
    // injected Clock as a number. A Date reaching the serialiser is a
    // modelling error, and two different Date instants must never collide
    // on the same hash the way they would if this fell through to `{}`.
    expect(() => canonicalSerialize(new Date(0))).toThrow()
    expect(() => canonicalSerialize(new Date(999))).toThrow()
  })

  it('throws rather than silently collapsing a Map to {}', () => {
    expect(() => canonicalSerialize(new Map([[1, 2]]))).toThrow()
  })

  it('throws rather than silently collapsing a Set to {}', () => {
    expect(() => canonicalSerialize(new Set([1, 2]))).toThrow()
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

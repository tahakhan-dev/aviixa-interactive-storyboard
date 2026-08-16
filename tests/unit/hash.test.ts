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

  // BLOCKING 1: canonicalSerialize's array branch used `.map()`, which only
  // ever visits index properties 0..length-1. A non-index own enumerable
  // property attached directly to an array (not inside any element) is
  // invisible to `.map()`, so it hashed identically to the array without it
  // -- while IndexedDB's structured clone WOULD persist that property. Two
  // live classes close this: a non-index own property, and a sparse-array
  // hole (`new Array(1)` hashes as `[]` while `.length` says 1).
  it('throws on an array carrying a non-index own enumerable property', () => {
    const smuggled = Object.assign([1, 2], { extra: 'smuggled' })
    expect(() => canonicalSerialize(smuggled)).toThrow()
  })

  it('throws on an array carrying a non-index own enumerable Date, not just an opaque prop', () => {
    // The blind spot doesn't merely hide a plain value: a Date attached at a
    // non-index array key slips the pre-check entirely (never reaches the
    // Date-throws-check because `.map()` never visits it), so a real Date
    // instance would be persisted with nothing to catch it.
    const smuggled = Object.assign([1], { when: new Date(0) })
    expect(() => canonicalSerialize(smuggled)).toThrow()
  })

  it('throws on a sparse array (a hole), which hashes identically to []', () => {
    const sparse = new Array(1)
    expect(() => canonicalSerialize(sparse)).toThrow()
  })

  it('throws on an enumerable getter at a non-index array key', () => {
    const smuggled: unknown[] & Record<string, unknown> = [1, 2] as never
    Object.defineProperty(smuggled, 'derived', { value: 'x', enumerable: true, configurable: true })
    expect(() => canonicalSerialize(smuggled)).toThrow()
  })

  // Positive case: symbol keys and non-enumerable properties on BOTH objects
  // and arrays must NOT be rejected -- structuredClone (what IndexedDB
  // actually uses) drops both silently too, so the hash and the store
  // already agree on these. Rejecting them would over-reject values
  // IndexedDB already accepts as-is.
  it('accepts symbol keys and non-enumerable properties on arrays (structuredClone drops them too, so hash and store agree)', () => {
    const arr: unknown[] = [1, 2]
    ;(arr as unknown as Record<symbol, unknown>)[Symbol('meta')] = 'ignored'
    Object.defineProperty(arr, 'hidden', { value: 'ignored', enumerable: false, configurable: true })
    expect(() => canonicalSerialize(arr)).not.toThrow()
    expect(canonicalSerialize(arr)).toBe(canonicalSerialize([1, 2]))
  })

  it('accepts symbol keys and non-enumerable properties on objects (structuredClone drops them too, so hash and store agree)', () => {
    const obj: Record<string, unknown> = { a: 1 }
    ;(obj as unknown as Record<symbol, unknown>)[Symbol('meta')] = 'ignored'
    Object.defineProperty(obj, 'hidden', { value: 'ignored', enumerable: false, configurable: true })
    expect(() => canonicalSerialize(obj)).not.toThrow()
    expect(canonicalSerialize(obj)).toBe(canonicalSerialize({ a: 1 }))
  })

  // A getter at an object key or a genuine array INDEX is read correctly by
  // both Object.entries and .map(), so it is not a live defect -- but a
  // getter that returns a Date must still throw, same as a plain Date would.
  it('reading an enumerable getter at an object key or array index is fine, but a Date it returns still throws', () => {
    const okObj = { get x() { return 1 } }
    expect(canonicalSerialize(okObj)).toBe(canonicalSerialize({ x: 1 }))
    const badObj = { get x() { return new Date(0) } }
    expect(() => canonicalSerialize(badObj)).toThrow()

    const okArr: unknown[] = []
    Object.defineProperty(okArr, 0, { get: () => 1, enumerable: true, configurable: true })
    Object.defineProperty(okArr, 'length', { value: 1 })
    expect(canonicalSerialize(okArr)).toBe(canonicalSerialize([1]))
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

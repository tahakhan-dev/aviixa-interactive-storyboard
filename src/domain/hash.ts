/**
 * Deterministic serialisation. Object keys are sorted so two structurally
 * equal states hash identically; array order is preserved because it carries
 * meaning. `undefined` is encoded as the bare token `undefined` — distinct
 * from an absent key, from `null`, and from the quoted string `"undefined"`
 * — so a cleared field never collides with a field that was never set, and
 * an `undefined` array ELEMENT (`[undefined]`) never collides with an empty
 * array (`[]`): arrays have no key to anchor a dropped element the way
 * objects do, so the token must actually appear in the output, not just at
 * object keys. This guarantee holds only for a genuinely-present element set
 * to `undefined` — a HOLE (`new Array(1)`, no own property at that index at
 * all) is the case this paragraph's reasoning does not cover, and it is
 * rejected explicitly below rather than silently hashing as `[]`.
 *
 * Only plain objects (`Object.prototype` or `null` prototype) and arrays are
 * walked. Anything else with an object typeof — `Date`, `Map`, `Set`,
 * `RegExp`, class instances — throws instead of silently serialising to
 * `{}`. Domain state carries time only as a number from the injected Clock,
 * so a `Date` reaching this function is a modelling error, not a value to
 * encode; encoding it as `{}` would make two different instants hash equal,
 * which defeats the entire point of a canonical hash. The same
 * "reject rather than silently pass through" rule applies to an array's own
 * non-index properties and to sparse holes — see the Array branch below.
 */
export function canonicalSerialize(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number in state')
    return Object.is(value, -0) ? '0' : String(value)
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    // `.map()` only ever visits index properties 0..length-1. Two classes of
    // array escape it entirely and must be rejected explicitly instead:
    //   - a sparse hole (`new Array(1)`) has no own property at that index,
    //     so `Object.keys` is shorter than `.length` -- `.map()` would have
    //     silently hashed it identically to `[]` while `.length` still says
    //     otherwise.
    //   - a non-index own enumerable property (`Object.assign([1], {x:1})`)
    //     is invisible to `.map()` but IS an own enumerable property
    //     structuredClone (what IndexedDB's put()/add() actually calls)
    //     persists -- so it would smuggle a property, or even a bare Date,
    //     past this hash entirely.
    // Symbol keys and non-enumerable properties are deliberately NOT
    // checked here (do not use Reflect.ownKeys): structuredClone drops both
    // of those silently too, so the hash and the eventual stored row
    // already agree on them -- rejecting them would over-reject values
    // IndexedDB accepts as-is.
    // Non-index keys are checked FIRST. An extra property inflates
    // keys.length past value.length, so checking length first would report
    // "sparse" for an array that has no holes at all -- sending the reader
    // hunting something that does not exist. See tests/unit/hash.test.ts's
    // "array guard names the right cause" describe block.
    const keys = Object.keys(value)
    const indexKeys: string[] = []
    for (const k of keys) {
      if (/^(0|[1-9]\d*)$/.test(k)) {
        indexKeys.push(k)
      } else {
        throw new Error(`Array carries a non-index own property "${k}": only index elements are hashed`)
      }
    }
    if (indexKeys.length !== value.length) throw new Error('Sparse array in state (a hole is not a value)')
    return `[${value.map(canonicalSerialize).join(',')}]`
  }
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) {
      throw new Error(
        `Unserialisable value of type ${value.constructor?.name ?? 'unknown'}: only plain objects and arrays are allowed in domain state`,
      )
    }
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    )
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalSerialize(v)}`)
      .join(',')}}`
  }
  throw new Error(`Unserialisable value of type ${typeof value}`)
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashState(value: unknown): Promise<string> {
  return sha256Hex(canonicalSerialize(value))
}

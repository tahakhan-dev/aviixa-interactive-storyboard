/**
 * Deterministic serialisation. Object keys are sorted so two structurally
 * equal states hash identically; array order is preserved because it carries
 * meaning. `undefined` is encoded as the bare token `undefined` — distinct
 * from an absent key, from `null`, and from the quoted string `"undefined"`
 * — so a cleared field never collides with a field that was never set, and
 * (critically) an `undefined` array element never collides with an empty
 * array: arrays have no key to anchor a dropped element the way objects do,
 * so the token must actually appear in the output, not just at object keys.
 *
 * Only plain objects (`Object.prototype` or `null` prototype) and arrays are
 * walked. Anything else with an object typeof — `Date`, `Map`, `Set`,
 * `RegExp`, class instances — throws instead of silently serialising to
 * `{}`. Domain state carries time only as a number from the injected Clock,
 * so a `Date` reaching this function is a modelling error, not a value to
 * encode; encoding it as `{}` would make two different instants hash equal,
 * which defeats the entire point of a canonical hash.
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

/**
 * Deterministic serialisation. Object keys are sorted so two structurally
 * equal states hash identically; array order is preserved because it carries
 * meaning. `undefined` is encoded distinctly from an absent key so a cleared
 * field never collides with a field that was never set.
 */
export function canonicalSerialize(value: unknown): string {
  if (value === undefined) return ''
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

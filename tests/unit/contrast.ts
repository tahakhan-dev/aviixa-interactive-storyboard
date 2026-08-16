export function toRgb(hex: string): readonly [number, number, number] {
  const h = hex.replace('#', '')
  const p = (i: number) => Number.parseInt(h.slice(i, i + 2), 16)
  return [p(0), p(2), p(4)]
}

function channelLuminance(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(rgb: readonly [number, number, number]): number {
  const [r, g, b] = rgb
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(toRgb(a))
  const lb = relativeLuminance(toRgb(b))
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Composite `fg` over `bg` at `alpha`, returning the resulting hex. */
export function compositeOver(fg: string, bg: string, alpha: number): string {
  const f = toRgb(fg)
  const b = toRgb(bg)
  const out = [0, 1, 2].map((i) => Math.round((f[i] ?? 0) * alpha + (b[i] ?? 0) * (1 - alpha)))
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

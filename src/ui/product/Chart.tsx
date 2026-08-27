'use client'

import { useId } from 'react'
import { bg, borderColor, colorVar, radiusClass, statusVar, textColor, type StatusToken } from './tokens'

/**
 * Task 12, pass criterion 2 — a chart renders no meaning by colour alone.
 * Every series is distinguished by a fill/stroke PATTERN (a distinct hatch
 * texture per series/slice, drawn as real SVG shapes inside a `<pattern>`
 * tile — not just a different `fill` colour) as well as a direct text
 * label in the legend, and lines additionally get a distinct dash style and
 * point-marker shape. This is what stays readable for a colour-blind reader
 * and under forced-colors mode (§20.3): forced-colors flattens arbitrary
 * hues to a handful of system colours, but the DIFFERENCE IN TEXTURE — solid
 * versus diagonal stripes versus dots versus a cross-hatch — survives that
 * flattening because it is a difference in which shapes are drawn, not
 * which colour they are drawn in.
 *
 * NO CHARTING LIBRARY: inline SVG, per the brief's "build the chart with
 * inline SVG rather than a charting library unless you can argue
 * otherwise" — nothing here needs animation, zoom or a scale library rich
 * enough to justify one.
 *
 * THE TABLE EQUIVALENT IS THE SAME DATA, NOT A SUMMARY OF IT: the
 * `<details>` disclosure's `<table>` is built from the exact same
 * `categories`/`series` props the SVG reads, one row per series and one
 * column per category — so the two can never show different numbers,
 * because there is only one source for both.
 *
 * A `donut` chart is one series read as slices of a whole (`series[0]`,
 * `categories` naming each slice) — passing more than one series to a
 * donut renders only the first; a caller wanting two donuts renders two
 * `Chart`s.
 */
export interface ChartSeries {
  readonly id: string
  readonly label: string
  readonly values: readonly number[]
}

export type ChartKind = 'bar' | 'line' | 'donut'

export interface ChartProps {
  readonly controlId: string
  readonly kind: ChartKind
  readonly title: string
  readonly categories: readonly string[]
  readonly series: readonly ChartSeries[]
  readonly unit?: string
}

const CHART_TONES: readonly StatusToken[] = ['info', 'ok', 'warn', 'danger', 'conflict', 'stale']
type PatternKind = 'diagonal' | 'dots' | 'cross' | 'vertical' | 'solid'
const PATTERN_KINDS: readonly PatternKind[] = ['diagonal', 'dots', 'cross', 'vertical', 'solid']
const DASH: readonly (string | undefined)[] = [undefined, '6 3', '2 3', '9 2 2 2', '1 4']
type MarkerShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross'
const MARKERS: readonly MarkerShape[] = ['circle', 'square', 'triangle', 'diamond', 'cross']

function toneFor(i: number): StatusToken {
  return CHART_TONES[i % CHART_TONES.length] ?? 'info'
}
function patternFor(i: number): PatternKind {
  return PATTERN_KINDS[i % PATTERN_KINDS.length] ?? 'solid'
}
function dashFor(i: number): string | undefined {
  return DASH[i % DASH.length]
}
function markerFor(i: number): MarkerShape {
  return MARKERS[i % MARKERS.length] ?? 'circle'
}

function PatternDef({ id, kind, tone }: { readonly id: string; readonly kind: PatternKind; readonly tone: StatusToken }) {
  const stroke = statusVar(tone)
  const tileBg = <rect width={8} height={8} style={{ fill: colorVar('surface') }} />
  switch (kind) {
    case 'solid':
      return (
        <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
          <rect width={8} height={8} style={{ fill: stroke }} />
        </pattern>
      )
    case 'diagonal':
      return (
        <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          {tileBg}
          <line x1={0} y1={0} x2={0} y2={8} style={{ stroke, strokeWidth: 4 }} />
        </pattern>
      )
    case 'dots':
      return (
        <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
          {tileBg}
          <circle cx={4} cy={4} r={2} style={{ fill: stroke }} />
        </pattern>
      )
    case 'cross':
      return (
        <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
          {tileBg}
          <line x1={0} y1={4} x2={8} y2={4} style={{ stroke, strokeWidth: 2 }} />
          <line x1={4} y1={0} x2={4} y2={8} style={{ stroke, strokeWidth: 2 }} />
        </pattern>
      )
    case 'vertical':
      return (
        <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse">
          {tileBg}
          <line x1={2} y1={0} x2={2} y2={8} style={{ stroke, strokeWidth: 3 }} />
        </pattern>
      )
  }
}

function Marker({ shape, x, y, tone }: { readonly shape: MarkerShape; readonly x: number; readonly y: number; readonly tone: StatusToken }) {
  const fill = statusVar(tone)
  const s = 4
  switch (shape) {
    case 'circle':
      return <circle cx={x} cy={y} r={s} style={{ fill }} />
    case 'square':
      return <rect x={x - s} y={y - s} width={s * 2} height={s * 2} style={{ fill }} />
    case 'triangle':
      return <polygon points={`${x},${y - s} ${x - s},${y + s} ${x + s},${y + s}`} style={{ fill }} />
    case 'diamond':
      return <polygon points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`} style={{ fill }} />
    case 'cross':
      return (
        <g style={{ stroke: fill, strokeWidth: 2 }}>
          <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
          <line x1={x - s} y1={y + s} x2={x + s} y2={y - s} />
        </g>
      )
  }
}

function polar(cx: number, cy: number, r: number, deg: number): readonly [number, number] {
  const rad = (deg * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

const WIDTH = 480
const HEIGHT = 220
const PAD = { top: 10, right: 10, bottom: 28, left: 10 }
const PLOT_W = WIDTH - PAD.left - PAD.right
const PLOT_H = HEIGHT - PAD.top - PAD.bottom

export function Chart({ controlId, kind, title, categories, series, unit }: ChartProps) {
  const rawId = useId()
  const uid = `chart-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  const allValues = series.flatMap((s) => s.values)
  const max = Math.max(1, ...allValues)

  // For bar/line, one legend entry (and one pattern) per SERIES. For donut,
  // one series is read as slices, so the legend and the patterns are per
  // CATEGORY (slice) instead — there is nothing else to distinguish.
  const legendItems =
    kind === 'donut'
      ? categories.map((label, index) => ({ key: label, label, index }))
      : series.map((s, index) => ({ key: s.id, label: s.label, index }))

  function renderBars() {
    const groupW = PLOT_W / Math.max(1, categories.length)
    const gap = 4
    const barW = (groupW - gap) / Math.max(1, series.length)
    return categories.map((category, ci) => (
      <g key={category}>
        {series.map((s, si) => {
          const value = s.values[ci] ?? 0
          const h = (value / max) * PLOT_H
          const x = PAD.left + groupW * ci + gap / 2 + barW * si
          const y = PAD.top + PLOT_H - h
          return (
            <rect
              key={s.id}
              x={x}
              y={y}
              width={Math.max(0, barW - 2)}
              height={h}
              style={{ fill: `url(#${uid}-p${si})`, stroke: colorVar('border-strong'), strokeWidth: 1 }}
            />
          )
        })}
      </g>
    ))
  }

  function renderLines() {
    const groupW = PLOT_W / Math.max(1, categories.length)
    return series.map((s, si) => {
      const points = s.values.map((value, ci) => ({
        x: PAD.left + groupW * (ci + 0.5),
        y: PAD.top + PLOT_H - (value / max) * PLOT_H,
      }))
      const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      const tone = toneFor(si)
      return (
        <g key={s.id}>
          <path d={d} fill="none" style={{ stroke: statusVar(tone), strokeWidth: 2, strokeDasharray: dashFor(si) }} />
          {points.map((p, i) => (
            <Marker key={i} shape={markerFor(si)} x={p.x} y={p.y} tone={tone} />
          ))}
        </g>
      )
    })
  }

  function renderDonut() {
    const first = series[0]
    if (!first) return null
    const cx = WIDTH / 2
    const cy = PAD.top + PLOT_H / 2
    const r = Math.min(PLOT_W, PLOT_H) / 2 - 4
    const total = first.values.reduce((a, b) => a + b, 0) || 1
    let angle = -90
    return first.values.map((value, i) => {
      const slice = (value / total) * 360
      const large = slice > 180 ? 1 : 0
      const start = angle
      const end = angle + slice
      angle = end
      const [x1, y1] = polar(cx, cy, r, start)
      const [x2, y2] = polar(cx, cy, r, end)
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
      return (
        <path
          key={categories[i] ?? i}
          d={d}
          style={{ fill: `url(#${uid}-p${i})`, stroke: colorVar('border-strong'), strokeWidth: 1 }}
        />
      )
    })
  }

  return (
    <div data-control-id={controlId} className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-4`}>
      <h3 className={`text-sm font-semibold ${textColor('ink')}`}>{title}</h3>

      <ul className="mt-2 flex flex-wrap gap-3 text-xs">
        {legendItems.map((item) => (
          <li key={item.key} className={`flex items-center gap-1.5 ${textColor('ink-muted')}`}>
            <svg width={12} height={12} aria-hidden="true">
              <rect width={12} height={12} style={{ fill: `url(#${uid}-p${item.index})` }} />
            </svg>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      <svg role="img" aria-label={`${title} chart`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full">
        <defs>
          {legendItems.map((item) => (
            <PatternDef key={item.key} id={`${uid}-p${item.index}`} kind={patternFor(item.index)} tone={toneFor(item.index)} />
          ))}
        </defs>

        {kind !== 'donut' ? (
          <line
            x1={PAD.left}
            y1={PAD.top + PLOT_H}
            x2={PAD.left + PLOT_W}
            y2={PAD.top + PLOT_H}
            style={{ stroke: colorVar('border') }}
          />
        ) : null}

        {kind === 'bar' ? renderBars() : null}
        {kind === 'line' ? renderLines() : null}
        {kind === 'donut' ? renderDonut() : null}

        {kind !== 'donut'
          ? categories.map((category, i) => {
              const groupW = PLOT_W / Math.max(1, categories.length)
              const x = PAD.left + groupW * (i + 0.5)
              return (
                <text key={category} x={x} y={HEIGHT - 6} textAnchor="middle" style={{ fill: colorVar('ink-muted'), fontSize: 10 }}>
                  {category}
                </text>
              )
            })
          : null}
      </svg>

      <details className="mt-2">
        <summary data-control-id={`${controlId}-table-toggle`} className={`cursor-pointer text-xs underline ${textColor('ink-muted')}`}>
          Show data as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <caption className="sr-only">{`${title} — table equivalent`}</caption>
            <thead>
              <tr>
                <th scope="col" className={`border ${borderColor('border')} p-1 text-left ${textColor('ink')}`}>
                  Series
                </th>
                {categories.map((category) => (
                  <th key={category} scope="col" className={`border ${borderColor('border')} p-1 text-right ${textColor('ink')}`}>
                    {category}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.id}>
                  <th scope="row" className={`border ${borderColor('border')} p-1 text-left font-medium ${textColor('ink')}`}>
                    {s.label}
                  </th>
                  {s.values.map((value, i) => (
                    <td key={i} className={`border ${borderColor('border')} p-1 text-right ${textColor('ink')}`}>
                      {unit !== undefined ? `${value} ${unit}` : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

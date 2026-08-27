'use client'

import type { ReactNode } from 'react'
import { bg, borderColor, radiusClass, statusText, textColor } from './tokens'
import { FreshnessStamp } from './FreshnessStamp'

/**
 * Task 12, pass criterion 3 (§19.4) — a stat tile never renders `0` for
 * unknown, stale or partial. This is enforced by SHAPE, not by convention:
 * `StatTileData` is a discriminated union where only the `value` variant
 * carries a number at all. There is no code path in this component that can
 * read a numeric field off an `unknown`/`stale`/`partial` payload, because
 * those variants do not have one — a caller cannot even construct a
 * "stale, but here is 0 anyway" tile; the type does not admit it.
 *
 * A dashboard reading "0 deviations" when it means "we have not heard from
 * this site in 40 minutes" is the dishonesty the freshness model exists to
 * prevent (task brief). `unknown`/`stale`/`partial` each render their own
 * word, never a digit standing in for one.
 */
export type StatTileData =
  | { readonly kind: 'value'; readonly value: number; readonly unit?: string }
  | { readonly kind: 'unknown'; readonly reason?: string }
  | { readonly kind: 'stale'; readonly asOfLabel: string }
  | { readonly kind: 'partial'; readonly reason: string }

export interface StatTileProps {
  readonly controlId: string
  readonly label: string
  readonly data: StatTileData
}

function Body({ data }: { readonly data: StatTileData }): ReactNode {
  switch (data.kind) {
    case 'value':
      return (
        <p className={`mt-1 text-2xl font-semibold ${textColor('ink')}`}>
          {data.value.toLocaleString()}
          {data.unit !== undefined ? <span className="ml-1 text-sm font-normal">{data.unit}</span> : null}
        </p>
      )
    case 'unknown':
      return (
        <>
          <p className={`mt-1 text-lg font-semibold ${statusText('offline')}`}>Unknown</p>
          {data.reason !== undefined ? (
            <p className={`mt-0.5 text-xs ${textColor('ink-muted')}`}>{data.reason}</p>
          ) : null}
        </>
      )
    case 'stale':
      return (
        <>
          <p className={`mt-1 text-lg font-semibold ${statusText('stale')}`}>Stale</p>
          <div className="mt-1">
            <FreshnessStamp asOfLabel={data.asOfLabel} stale />
          </div>
        </>
      )
    case 'partial':
      return (
        <>
          <p className={`mt-1 text-lg font-semibold ${statusText('warn')}`}>Partial</p>
          <p className={`mt-0.5 text-xs ${textColor('ink-muted')}`}>{data.reason}</p>
        </>
      )
  }
}

export function StatTile({ controlId, label, data }: StatTileProps) {
  return (
    <div
      data-control-id={controlId}
      data-state={data.kind}
      className={`${radiusClass('lg')} border ${borderColor('border')} ${bg('raised')} p-4`}
    >
      <p className={`text-xs font-medium uppercase tracking-wide ${textColor('ink-muted')}`}>{label}</p>
      <Body data={data} />
    </div>
  )
}

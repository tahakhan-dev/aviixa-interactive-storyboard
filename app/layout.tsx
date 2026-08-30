import type { Metadata } from 'next'
import { DemoChrome } from '@/ui/demo/DemoChrome'
import { ProductRuntime } from '@/ui/product/runtime'
import './globals.css'

// M2: `default` is what an untitled route (e.g. the entry page, or the
// generated not-found page) shows; `template` is what every route that DOES
// set its own `metadata.title` (the five surface pages below, sourced from
// `ROUTES[].title`) is wrapped in, so `RouteDefinition.title`'s doc comment
// ("Browser tab title") is actually true rather than aspirational.
export const metadata: Metadata = {
  title: {
    default: 'AVIIXA Interactive Storyboard',
    template: '%s · AVIIXA Interactive Storyboard',
  },
  description:
    'Client-validation storyboard for the AVIIXA platform. Simulated behaviour only; no production system is connected.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to main content
        </a>
        {/*
          Task 1 (unit-01) — `ProductRuntime` wraps BOTH `{children}` (every
          product route) and `<DemoChrome/>` so the one `boot()`ed
          repository/session is reachable from every route, not only from
          inside the reviewer's chrome. `DemoChrome` stays a SIBLING of
          `{children}` inside this wrapper, not an ancestor of it (Task 14's
          placement, preserved): `src/ui/product/**` never imports
          `src/ui/demo/**` (the boundary `pnpm check:boundary-rules`
          enforces), and `ProductRuntime` itself lives in
          `src/ui/product/runtime/`, so the wrapper is the product side
          reaching down to cover both, never the demo side reaching up.
        */}
        <ProductRuntime>
          {children}
          <DemoChrome />
        </ProductRuntime>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { DemoChrome } from '@/ui/demo/DemoChrome'
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
        {children}
        {/*
          Task 14 — mounted OUTSIDE every `AppShell`, as a sibling of
          `{children}` rather than a wrapper around it, so `DemoChrome` can
          never become an ancestor an `AppShell` render tree depends on.
          `src/ui/product/**` never imports `src/ui/demo/**` (the boundary
          `pnpm check:boundary-rules` enforces) — this placement is the
          other half of that guarantee: even the ROOT layout never nests
          product content inside chrome.
        */}
        <DemoChrome />
      </body>
    </html>
  )
}

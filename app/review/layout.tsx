import type { Metadata } from 'next'

// `app/review/page.tsx` is a client component (it holds reviewer input
// state) and cannot export `metadata` -- so without this layout, `/review/`
// silently inherits the root layout's default title
// ('AVIIXA Interactive Storyboard') instead of naming itself. Same shape as
// the app/workflows/page.tsx + WorkflowIndex.tsx split (Task 11): a thin
// Server Component carries the metadata a Client Component cannot, and
// renders its child unchanged.
//
// Deviation from the brief's own snippet: it wrote the title as
// 'Client review — AVIIXA Interactive Storyboard'. The root layout
// (app/layout.tsx) already wraps every page-level title in the template
// '%s · AVIIXA Interactive Storyboard' -- reproduced against the actual
// static export (`out/review/index.html`) before fixing: that full string
// doubles the site name into
// "Client review — AVIIXA Interactive Storyboard · AVIIXA Interactive
// Storyboard". Every other page's title (e.g. 'Coverage Dashboard' in
// app/coverage/page.tsx) is the short form; matched that here.
export const metadata: Metadata = {
  title: 'Client review',
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

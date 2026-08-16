'use client'

import { useState } from 'react'
import {
  REVIEW_STATUSES,
  createReviewRecord,
  type ReviewStatus,
  type ReviewRecord,
} from '@/review/records'
import { fixedClock } from '@/domain/clock'
import { SURFACES, type SurfaceId } from '@/domain/surfaces'
import { Button, Field, Select, Banner } from '@/ui/primitives'

// Deliberately never "Approve": the frozen source's own product review chain
// (Author -> Reviewer -> Release Authority) grants Workflow approval, Job
// approval, Quality release and production authorisation -- none of that
// vocabulary belongs to a client-review comment on this storyboard.
const STATUS_ACTION_LABEL: Record<ReviewStatus, string> = {
  'accepted-for-review': 'Accept for client review',
  'needs-change': 'Needs change',
  question: 'Question',
  comment: 'Comment',
}

export default function ReviewPage() {
  // Review-record timestamps are deliberately outside the kernel's
  // determinism constraint (see `createReviewRecord`'s doc comment in
  // `@/review/records`), so a wall-clock-seeded `fixedClock` is fine here --
  // this is never fed through `reduce` or hashed into a scenario snapshot.
  const [clock] = useState(() => fixedClock(Date.now()))
  const [reviewerLabel, setReviewerLabel] = useState('')
  const [surface, setSurface] = useState<SurfaceId>(SURFACES[0]?.id ?? 'SURF-SA')
  const [note, setNote] = useState('')
  const [records, setRecords] = useState<readonly ReviewRecord[]>([])
  const [error, setError] = useState<string | undefined>(undefined)

  function submit(status: ReviewStatus): void {
    try {
      const record = createReviewRecord(
        {
          anchorType: 'surface',
          anchorId: surface,
          surface,
          reviewerLabel: reviewerLabel.trim() === '' ? 'Unnamed reviewer' : reviewerLabel,
          status,
          comment: note,
          // This shell is not yet wired to a live scenario snapshot or
          // build pipeline (that wiring is deferred); these three fields
          // say so plainly rather than fabricate a fingerprint or hash.
          sourceFingerprint: 'not-wired-in-this-storyboard',
          scenarioVersion: 'not-wired-in-this-storyboard',
          buildHash: 'not-wired-in-this-storyboard',
        },
        clock,
      )
      setRecords((prev) => [...prev, record])
      setNote('')
      setError(undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This review note could not be recorded.')
    }
  }

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>
      <h1 className="mt-2 text-3xl font-semibold">Review</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Simulated behaviour only. This storyboard is a client-validation
        prototype, not a connected production system.
      </p>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Review records left here are storyboard metadata, kept separately
        from the product&apos;s own audit trail. Accepting a screen for
        client review only marks this storyboard page as reviewed; it is not
        a product audit and never a business-state transition.
      </p>

      {error !== undefined ? (
        <div className="mt-4">
          <Banner tone="attention" heading="This review note was not recorded" body={error} />
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <Field label="Reviewer name">
          <input
            value={reviewerLabel}
            onChange={(e) => setReviewerLabel(e.target.value)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
          />
        </Field>

        <Select
          label="Which surface this note is about"
          value={surface}
          onChange={(v) => setSurface(v as SurfaceId)}
          options={SURFACES.map((s) => ({ value: s.id, label: s.name }))}
        />

        <Field label="Note" description="A note is required for two of the four actions below.">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          {REVIEW_STATUSES.map((status) => (
            <Button
              key={status}
              variant={status === 'accepted-for-review' ? 'primary' : 'secondary'}
              onClick={() => submit(status)}
            >
              {STATUS_ACTION_LABEL[status]}
            </Button>
          ))}
        </div>
      </div>

      {records.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Notes recorded this session</h2>
          <ul className="mt-2 space-y-2 text-sm text-[var(--color-ink-muted)]">
            {records.map((r) => (
              <li key={r.id}>
                <span className="font-medium text-[var(--color-ink)]">
                  {STATUS_ACTION_LABEL[r.status]}
                </span>
                {r.comment !== '' ? ` — ${r.comment}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </main>
  )
}

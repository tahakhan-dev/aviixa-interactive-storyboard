'use client'

import { useEffect, useState } from 'react'
import {
  REVIEW_STATUSES,
  REVIEW_SEVERITIES,
  createReviewRecord,
  createReviewEvent,
  type ReviewStatus,
  type ReviewSeverity,
  type ReviewRecord,
} from '@/review/records'
import { putReviewRecord, putReviewEvent, listReviewRecords } from '@/review/store'
import {
  exportReviewPackage,
  importReviewPackage,
  MAX_PACKAGE_BYTES,
  PACKAGE_FORMAT_VERSION,
  type PackageImportPreview,
} from '@/review/package'
import { FROZEN_SOURCE_SHA256, MASTER_PROMPT_SHA256 } from '@/review/artefact-hashes'
import { bootstrapStorage } from '@/persistence/bootstrap'
import { openDatabase } from '@/persistence/schema'
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

// Fix round 1 (review, Major 1): `severity` used to be hardcoded to
// 'minor' on every submission -- a real vocabulary member with no control
// behind it, so a blocking defect was exported as 'minor' and no one could
// tell from this shell. A reviewer's own assessment of how much a comment
// matters, per `ReviewSeverity`'s doc comment in `@/review/records`.
const SEVERITY_LABEL: Record<ReviewSeverity, string> = {
  blocking: 'Blocking',
  major: 'Major',
  minor: 'Minor',
  question: 'Needs clarification',
}

/**
 * BLOCKING 4 (final review): this page used to keep every review record in
 * `useState` only and never call `putReviewRecord` -- notes vanished on
 * reload while the page told the reviewer they were "kept separately from
 * the product's own audit trail," which was false; they were kept nowhere.
 *
 * `checking` covers the one render before the effect below has resolved
 * `bootstrapStorage` -- during that window this shell does not yet know
 * whether it can save, so it says neither "saved" nor "not saved."
 */
type StorageMode =
  | { readonly kind: 'checking' }
  | { readonly kind: 'durable'; readonly db: IDBDatabase }
  | { readonly kind: 'not-durable'; readonly reason: string }

/* ────────────────────────────────────────────────────────────────────────
 * R4-B06 — A CLIENT COULD NOT PRODUCE A REVIEW PACKAGE.
 *
 * `exportReviewPackage` and `importReviewPackage` had thirty-five test
 * references and zero references under `app/`: the shipped review screen held
 * four buttons and no export or import control at all. Master prompt §21
 * lists "local export/import of a versioned review package" as a review-mode
 * element, and §9.6 and §13.1 both require publication "in the review
 * package" — so both obligations were unmeetable through the product whatever
 * the package type contained.
 *
 * MASTER PROMPT §4.1: NO NETWORK. Export is a Blob the browser hands the user
 * through an object URL; import is a file the user picks. Neither touches
 * `fetch`, `XMLHttpRequest` or any URL. The coverage payloads are pulled in
 * with a DYNAMIC import inside the click handler rather than at module scope,
 * so the fourteen generated registries land in their own lazily-loaded static
 * chunk instead of the review page's initial bundle — a same-origin read of a
 * file in the export manifest, which is the one thing §4.1 allows.
 *
 * MASTER PROMPT §21.1: IMPORT PREVIEWS, IT NEVER APPLIES. `importReviewPackage`
 * validates size, format version, shape, source and build compatibility,
 * per-entry hashes and the non-self-referential manifest checksum, in that
 * order, and quarantines on the first failure naming the failing entry with
 * its expected and actual values. This screen renders that outcome and stops:
 * nothing here writes an imported record to the store, and nothing here can
 * touch Scenario Domain State.
 * ──────────────────────────────────────────────────────────────────────── */
type PackageState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'exported'; readonly filename: string; readonly bytes: number }
  | { readonly kind: 'preview'; readonly preview: PackageImportPreview }
  | {
      readonly kind: 'quarantined'
      readonly reason: string
      readonly failingEntry: string | null
      readonly expected: string | null
      readonly actual: string | null
    }

export default function ReviewPage() {
  // Review-record timestamps are deliberately outside the kernel's
  // determinism constraint (see `createReviewRecord`'s doc comment in
  // `@/review/records`), so a wall-clock-seeded `fixedClock` is fine here --
  // this is never fed through `reduce` or hashed into a scenario snapshot.
  const [clock] = useState(() => fixedClock(Date.now()))
  const [reviewerLabel, setReviewerLabel] = useState('')
  const [surface, setSurface] = useState<SurfaceId>(SURFACES[0]?.id ?? 'SURF-SA')
  const [severity, setSeverity] = useState<ReviewSeverity>('minor')
  const [note, setNote] = useState('')
  const [records, setRecords] = useState<readonly ReviewRecord[]>([])
  const [error, setError] = useState<string | undefined>(undefined)
  const [storage, setStorage] = useState<StorageMode>({ kind: 'checking' })
  const [packageState, setPackageState] = useState<PackageState>({ kind: 'idle' })

  // Runs once, client-side only (never during the static-export prerender
  // pass, which has no `indexedDB`). Opens the SAME database the gateway
  // and every other persistence-layer consumer use, via the same
  // `bootstrapStorage` readiness gate the rest of the app is bound by --
  // this shell gets no special, unvalidated path to storage.
  useEffect(() => {
    let cancelled = false
    // Fix round 1 (review, root cause behind Major 1's test hanging): the
    // cleanup below used to only set `cancelled = true`. It had no way to
    // reach the opened `IDBDatabase` -- `db` was scoped to `init()`, not
    // this effect -- so once `storage.kind` became 'durable' the
    // connection was NEVER closed on unmount, only in the narrow race
    // where cleanup ran before the open resolved. A leaked connection
    // blocks a later `indexedDB.deleteDatabase(...)` indefinitely (proven:
    // a second component test that submits a durable-path note right
    // after this page's existing one hung past an 8s wait, and even the
    // test file's own un-awaited-then-awaited cleanup hook timed out at
    // 10s). Tracking the db in the effect's own scope lets cleanup close
    // it unconditionally.
    let openedDb: IDBDatabase | undefined

    async function init(): Promise<void> {
      const factory = typeof indexedDB === 'undefined' ? null : indexedDB
      const boot = await bootstrapStorage(factory)
      if (cancelled) return

      if (!boot.durable || factory === null) {
        setStorage({
          kind: 'not-durable',
          reason:
            boot.reason ?? 'IndexedDB is not available in this browser, so notes are not being saved.',
        })
        return
      }

      let db: IDBDatabase
      try {
        db = await openDatabase(factory)
      } catch {
        if (!cancelled) {
          setStorage({
            kind: 'not-durable',
            reason: 'The review database could not be opened, so notes are not being saved.',
          })
        }
        return
      }
      if (cancelled) {
        db.close()
        return
      }
      openedDb = db
      setStorage({ kind: 'durable', db })

      const listed = await listReviewRecords(db)
      if (!cancelled && listed.ok) setRecords(listed.records)
    }

    void init()
    return () => {
      cancelled = true
      openedDb?.close()
    }
  }, [])

  async function submit(status: ReviewStatus): Promise<void> {
    let record: ReviewRecord
    try {
      record = createReviewRecord(
        {
          anchorType: 'surface',
          anchorId: surface,
          surface,
          reviewerLabel: reviewerLabel.trim() === '' ? 'Unnamed reviewer' : reviewerLabel,
          status,
          severity,
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This review note could not be recorded.')
      return
    }

    if (storage.kind !== 'durable') {
      // Honest, not aspirational: storage is not ready, so this note is
      // shown in-session (so the reviewer sees their own input reflected)
      // but is NOT claimed to be saved anywhere.
      setError(
        storage.kind === 'checking'
          ? 'This note is not yet saved: storage is still starting up.'
          : `This note was not saved: ${storage.reason}`,
      )
      setRecords((prev) => [...prev, record])
      setNote('')
      return
    }

    const result = await putReviewRecord(storage.db, record)
    if (!result.ok) {
      setError(`This review note could not be saved: ${result.reason}`)
      return
    }
    // Major (final review): a client-review action creates a ReviewEvent,
    // not just a ReviewRecord -- gate 3 ("a client-review action creates a
    // ReviewEvent and nothing else") named an invariant nothing exercised.
    // The record write above is the authoritative save signal for the
    // reviewer; the note itself is genuinely saved either way, so it is
    // never discarded on this second write.
    //
    // Minor (final review round 2): the result of this second write used to
    // be discarded outright -- a failed event write was silently swallowed,
    // the "silent catch" pattern this codebase otherwise forbids. Set (not
    // appended) in one place, after the note is recorded, so it is not
    // immediately clobbered by a later unconditional `setError(undefined)`.
    const eventResult = await putReviewEvent(storage.db, createReviewEvent(record.id, status, clock))
    setRecords((prev) => [...prev, record])
    setNote('')
    setError(
      eventResult.ok ? undefined : `This review note was saved, but its event log entry was not: ${eventResult.reason}`,
    )
  }

  /**
   * The two coverage payloads master prompt §9.6 and §13.1 require in the
   * package, loaded only when the reviewer actually exports. Dynamic so the
   * fourteen registries are a separate static chunk rather than part of this
   * page's initial bundle.
   */
  async function coveragePayloads() {
    const [{ buildCensusSnapshot }, { loadRegistry }, { GeneratedRegistrySchema }, { REGISTRY_DESCRIPTORS }] =
      await Promise.all([
        import('@/review/census'),
        import('@/registry/load'),
        import('@/coverage/registry-schema'),
        import('@/coverage/descriptors'),
      ])
    const reconciliationRaw = (await import('../../registries/generated/source-reconciliation.json')).default
    const { loadReconciliation } = await import('@/registry/load')
    const rawBySlug: Record<string, unknown> = {
      modules: (await import('../../registries/generated/modules.json')).default,
      features: (await import('../../registries/generated/features.json')).default,
      'sub-features': (await import('../../registries/generated/sub-features.json')).default,
      functions: (await import('../../registries/generated/functions.json')).default,
      workflows: (await import('../../registries/generated/workflows.json')).default,
      'business-use-cases': (await import('../../registries/generated/business-use-cases.json')).default,
      'business-objects': (await import('../../registries/generated/business-objects.json')).default,
      events: (await import('../../registries/generated/events.json')).default,
      commands: (await import('../../registries/generated/commands.json')).default,
      notifications: (await import('../../registries/generated/notifications.json')).default,
      'offline-scenarios': (await import('../../registries/generated/offline-scenarios.json')).default,
      'ai-storyboards': (await import('../../registries/generated/ai-storyboards.json')).default,
      'scheduled-work': (await import('../../registries/generated/scheduled-work.json')).default,
      'actionable-controls': (await import('../../registries/generated/actionable-controls.json')).default,
    }
    // Keyed off REGISTRY_DESCRIPTORS rather than off the object above, so a
    // fifteenth registry throws here instead of silently exporting thirteen.
    const registries = REGISTRY_DESCRIPTORS.map((d) => {
      const raw = rawBySlug[d.slug]
      if (raw === undefined) {
        throw new Error(
          `No generated registry is bundled for "${d.slug}", so the census in this package ` +
            'would be missing an inventory the master prompt requires. Refusing to export a ' +
            'partial census rather than exporting one that looks complete.',
        )
      }
      return loadRegistry(GeneratedRegistrySchema, raw, `generated registry "${d.slug}"`)
    })
    return {
      reconciliation: loadReconciliation(reconciliationRaw).reconciliation.reconciliation_rows,
      census: buildCensusSnapshot(registries),
    }
  }

  async function exportPackage(): Promise<void> {
    setPackageState({ kind: 'idle' })
    try {
      const { reconciliation, census } = await coveragePayloads()
      const pkg = await exportReviewPackage({
        sourceHash: FROZEN_SOURCE_SHA256,
        promptHash: MASTER_PROMPT_SHA256,
        buildHash: 'not-wired-in-this-storyboard',
        scenarioVersion: 'not-wired-in-this-storyboard',
        scenarioSeed: 'not-wired-in-this-storyboard',
        fixtureRefs: [],
        records,
        decisions: [],
        bookmarks: [],
        coverageSnapshot: { takenAtLogical: clock.now(), byStatus: census.byStatus },
        reconciliation,
        census,
        screenshotRefs: [],
      })
      const text = JSON.stringify(pkg, null, 2)
      const filename = `aviixa-review-package-v${PACKAGE_FORMAT_VERSION}.json`
      // A local Blob handed to the browser. No network, no server, no upload.
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
      setPackageState({
        kind: 'exported',
        filename,
        bytes: new TextEncoder().encode(text).length,
      })
    } catch (e) {
      setPackageState({
        kind: 'quarantined',
        reason: e instanceof Error ? e.message : 'The review package could not be exported.',
        failingEntry: null,
        expected: null,
        actual: null,
      })
    }
  }

  async function importPackage(file: File): Promise<void> {
    setPackageState({ kind: 'idle' })
    let raw: unknown
    try {
      raw = JSON.parse(await file.text())
    } catch {
      setPackageState({
        kind: 'quarantined',
        reason: `"${file.name}" is not valid JSON, so it is not a review package. The original bytes are untouched.`,
        failingEntry: file.name,
        expected: 'a JSON review package',
        actual: 'unparseable bytes',
      })
      return
    }
    const outcome = await importReviewPackage(raw, {
      sourceHash: FROZEN_SOURCE_SHA256,
      buildHash: 'not-wired-in-this-storyboard',
    })
    if (outcome.ok) {
      setPackageState({ kind: 'preview', preview: outcome.preview })
      return
    }
    setPackageState({
      kind: 'quarantined',
      reason: outcome.reason,
      failingEntry: outcome.failingEntry,
      expected: outcome.expected,
      actual: outcome.actual,
    })
  }

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-[var(--color-ink-subtle)]">AVIIXA</p>
      <h1 className="mt-2 text-3xl font-semibold">Review</h1>
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Simulated behaviour only. This storyboard is a client-validation
        prototype, not a connected production system.
      </p>
      {/*
        This sentence is true regardless of storage state: a review record
        is storyboard metadata, never a product audit record, whether or
        not it happens to be saved anywhere. The DURABILITY claim -- whether
        it is actually saved -- is the part that must depend on real storage
        state (BLOCKING 4, final review), so it is a separate paragraph below.
      */}
      <p className="mt-4 max-w-prose text-[var(--color-ink-muted)]">
        Review records left here are storyboard metadata, kept separately
        from the product&apos;s own audit trail. Accepting a screen for
        client review only marks this storyboard page as reviewed; it is not
        a product audit and never a business-state transition.
      </p>
      {storage.kind === 'durable' ? (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          These notes are saved to this browser&apos;s local storage.
        </p>
      ) : storage.kind === 'checking' ? (
        <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
          Checking whether this browser can save these notes durably…
        </p>
      ) : (
        <div className="mt-4">
          <Banner
            tone="attention"
            heading="These notes are not being saved"
            body={`${storage.reason} Notes typed below will be shown for this session only and will not survive a reload.`}
          />
        </div>
      )}

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

        <Select
          label="Severity — how much this matters to you as the reviewer"
          value={severity}
          onChange={(v) => setSeverity(v as ReviewSeverity)}
          options={REVIEW_SEVERITIES.map((s) => ({ value: s, label: SEVERITY_LABEL[s] }))}
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
              onClick={() => void submit(status)}
            >
              {STATUS_ACTION_LABEL[status]}
            </Button>
          ))}
        </div>
      </div>

      {/* R4-B06: the export/import pair master prompt §21 requires. */}
      <div className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h2 className="text-xl font-semibold">Review package</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          The exported package — not this browser&rsquo;s storage — is the portable client-review
          record. It carries the notes below, the frozen-source hash, the master-prompt hash, the
          master prompt section 9.6 reconciliation table and the section 13.1 item census, plus a
          manifest recording each payload&rsquo;s byte length and SHA-256.{' '}
          <strong>
            That checksum detects accidental corruption in transit — a truncated download, a bad
            copy-paste. It is not a signature:
          </strong>{' '}
          it says nothing about who produced the package, or whether what it says is true. Export
          writes a file this browser hands you and import reads a file you pick; neither uses the
          network, and importing never changes any product or scenario state.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => void exportPackage()}>
            Export review package
          </Button>
          <Field
            label="Import a review package"
            description={`A JSON package of up to ${MAX_PACKAGE_BYTES} bytes. It is validated and previewed; nothing is merged.`}
          >
            <input
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file !== undefined) void importPackage(file)
              }}
              className="text-sm text-[var(--color-ink)]"
            />
          </Field>
        </div>

        {packageState.kind === 'exported' ? (
          <div className="mt-4">
            <Banner
              tone="ok"
              heading="Review package exported"
              body={`${packageState.filename}, ${packageState.bytes} bytes, format version ${PACKAGE_FORMAT_VERSION}. Your browser has saved it wherever it saves downloads. Nothing was sent anywhere.`}
            />
          </div>
        ) : null}

        {packageState.kind === 'preview' ? (
          <div className="mt-4">
            <Banner
              tone="ok"
              heading="Package validated — this is a preview, nothing has been merged"
              body={`${packageState.preview.recordCount} review records, ${packageState.preview.reconciliationRowCount} reconciliation rows and a census of ${packageState.preview.censusTotalRows} items, exported against source hash ${packageState.preview.sourceHash} and build ${packageState.preview.buildHash}, scenario version ${packageState.preview.scenarioVersion}. This storyboard previews an import and stops there: merging an imported package into a review workspace is not wired in this build, so nothing below has changed and neither has any product or scenario state.`}
            />
          </div>
        ) : null}

        {packageState.kind === 'quarantined' ? (
          <div className="mt-4">
            <Banner
              tone="attention"
              heading="Package quarantined — the original bytes are untouched"
              body={
                `${packageState.reason}` +
                (packageState.failingEntry === null ? '' : ` Failing entry: ${packageState.failingEntry}.`) +
                (packageState.expected === null ? '' : ` Expected: ${packageState.expected}.`) +
                (packageState.actual === null ? '' : ` Actual: ${packageState.actual}.`)
              }
            />
          </div>
        ) : null}
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

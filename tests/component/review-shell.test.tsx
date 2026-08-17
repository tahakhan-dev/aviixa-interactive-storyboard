import 'fake-indexeddb/auto'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReviewPage from '../../app/review/page'
import { openDatabase } from '@/persistence/schema'

describe('review shell', () => {
  it('labels its accept action for client review, never as an approval', () => {
    render(<ReviewPage />)
    expect(screen.getByRole('button', { name: /accept for client review/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^approve$/i })).toBeNull()
  })

  it('uses no product-approval language anywhere on the page', () => {
    const { container } = render(<ReviewPage />)
    const t = (container.textContent ?? '').toLowerCase()
    for (const forbidden of ['workflow approval', 'job approval', 'quality release', 'production authorisation']) {
      expect(t, forbidden).not.toContain(forbidden)
    }
  })

  it('states that review records are storyboard metadata, not product audit', () => {
    const { container } = render(<ReviewPage />)
    expect((container.textContent ?? '').toLowerCase()).toMatch(/not.*(product )?audit|storyboard metadata/)
  })

  // Minor (final review): this used to check only three of the four
  // statuses ('needs change', 'question', 'comment') while claiming to
  // check all four -- exactly the "test that passed while the property it
  // named was false" pattern this project has repeatedly found. Adds the
  // fourth ('accept for client review').
  it('offers all four review statuses', () => {
    render(<ReviewPage />)
    for (const s of ['accept for client review', 'needs change', 'question', 'comment']) {
      expect(screen.getByText(new RegExp(s, 'i')), s).toBeDefined()
    }
  })

  it('has exactly one level-1 heading and a main landmark', () => {
    render(<ReviewPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('main')).toBeDefined()
  })

  // BLOCKING 4 (final review): the shell used to keep records in useState
  // only and never call `putReviewRecord` -- notes vanished on reload while
  // the page told the reviewer they were "kept separately from the
  // product's own audit trail." Proven against the real database (fake-
  // indexeddb, same contract as the browser's): after submitting a note and
  // letting the durable-storage path settle, the review store must actually
  // contain it.
  it('writes a submitted note to the real review database', async () => {
    const user = userEvent.setup()
    render(<ReviewPage />)
    await user.type(screen.getByLabelText(/reviewer name/i), 'A Reviewer')
    await user.type(screen.getByLabelText(/^note$/i), 'Looks good.')
    await user.click(screen.getByRole('button', { name: /^comment$/i }))

    await waitFor(async () => {
      const db = await openDatabase(indexedDB)
      const rows: unknown[] = await new Promise((res) => {
        const r = db.transaction('reviewRecords', 'readonly').objectStore('reviewRecords').getAll()
        r.onsuccess = () => res(r.result)
      })
      db.close()
      expect(rows.length).toBeGreaterThan(0)
    })
  })

  // Fix round 1 (review, Major 1): `severity` used to be hardcoded to
  // 'minor' on every submission, with no control anywhere in the form --
  // three lines under this file's own "say so plainly rather than
  // fabricate" comment. A blocking defect exported as 'minor', inside the
  // manifest hash scope. Proven end to end against the real database: a
  // reviewer who picks "Blocking" and submits gets a stored record whose
  // `severity` actually says so.
  it('records the severity the reviewer actually picked, not a hardcoded value', async () => {
    const user = userEvent.setup()
    render(<ReviewPage />)
    await user.selectOptions(screen.getByLabelText(/severity/i), 'blocking')
    await user.type(screen.getByLabelText(/reviewer name/i), 'A Reviewer')
    await user.type(screen.getByLabelText(/^note$/i), 'This breaks the whole run.')
    await user.click(screen.getByRole('button', { name: /needs change/i }))

    await waitFor(async () => {
      const db = await openDatabase(indexedDB)
      const rows: unknown[] = await new Promise((res) => {
        const r = db.transaction('reviewRecords', 'readonly').objectStore('reviewRecords').getAll()
        r.onsuccess = () => res(r.result)
      })
      db.close()
      expect(rows.some((row) => (row as { severity?: string }).severity === 'blocking')).toBe(true)
    })
  })

  // Major (final review): createReviewEvent had no caller outside a unit
  // test -- gate 3's name ("a client-review action creates a ReviewEvent
  // and nothing else") asserted a positive that never happened. Proven
  // end to end against the real database, same pattern as the record-write
  // test above.
  it('writes a ReviewEvent alongside the review record on submit', async () => {
    const user = userEvent.setup()
    render(<ReviewPage />)
    await user.type(screen.getByLabelText(/reviewer name/i), 'A Reviewer')
    await user.type(screen.getByLabelText(/^note$/i), 'Looks good.')
    await user.click(screen.getByRole('button', { name: /^comment$/i }))

    await waitFor(async () => {
      const db = await openDatabase(indexedDB)
      const events: unknown[] = await new Promise((res) => {
        const r = db.transaction('reviewEvents', 'readonly').objectStore('reviewEvents').getAll()
        r.onsuccess = () => res(r.result)
      })
      db.close()
      expect(events.length).toBeGreaterThan(0)
      expect((events[0] as { kind?: string }).kind).toBe('comment')
    })
  })

  it('never claims durability the storage state does not provide', async () => {
    const original = globalThis.indexedDB
    // @ts-expect-error -- simulating an environment with no IndexedDB at all.
    delete globalThis.indexedDB
    try {
      render(<ReviewPage />)
      await waitFor(() => {
        const t = (document.body.textContent ?? '').toLowerCase()
        expect(t).toMatch(/not (being )?saved|not saved|no.*indexeddb|not available/)
      })
    } finally {
      globalThis.indexedDB = original
    }
  })
})

afterEach(async () => {
  // fake-indexeddb persists databases across tests in the same module
  // registry by name; each test above that writes should not see a prior
  // test's rows. Deleting the database is the cheapest reliable reset.
  //
  // Fix round 1: this used to fire `deleteDatabase` without awaiting its
  // result. `deleteDatabase` blocks behind any open connection, and (before
  // this round's fix to `page.tsx`'s effect cleanup, below) a test that
  // reached the durable path left its connection open on unmount forever --
  // reproduced by adding a second DB-writing test right after the existing
  // one: even this hook timed out at 10s waiting on a delete that could
  // never unblock. `page.tsx` now closes its connection on unmount
  // unconditionally, so this delete settles quickly again; awaiting it here
  // too keeps each test starting from an actually-clean database rather
  // than a probably-clean one, regardless of what future tests in this file
  // do with the connection.
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('aviixa-storyboard')
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
})

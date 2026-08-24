import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import * as studioVocab from '@/studio/vocab'
import * as stu12Versions from '@/studio/modules/stu-12/versions'
import { JOB_ADOPTION_STATES, SUBMISSION_STATES, VERSION_BUMP_CLASSES } from '@/studio/vocab'
import { OPEN_DECISIONS, decisionRecord } from '@/disclosure/decisions'
import { STU_MODULES, reachByStudioMatrix, stuModuleById } from '@/studio/modules'
import { STU_SEAMS, stuSeamById } from '@/studio/seams'
import { PUBLISH_CHECKS, publishCheckById } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  registerPublishChecks,
  evaluatePublish,
  type PublishCheckImplementation,
  type PublishCheckRegister,
} from '@/studio/publish/register'
import { journeyStates, journeyStateAfterStep } from '@/studio/journey/fixture'
import { JOURNEY_STEPS } from '@/studio/journey/effects'
import { COMMAND_STATE_PHRASES } from '@/studio/state/adoption'
import { screenRendersState } from '@/studio/state/screen-states'
import {
  STU_12_MATRIX,
  STU_12_CAPABILITY_IDS,
  STU_12_CROSS_SURFACE,
  STU_12_SOURCE_ROW_COUNT,
  JOB_OWNER_COLUMN_CELLS,
  versionRow,
  type StudioVersionCapabilityId,
} from '@/studio/modules/stu-12/matrix'
import {
  VERSION_CHANGE_KINDS,
  changeKind,
  notifiedChangeKinds,
  screenLevelDiff,
  seededVersionDiffEngine,
  versionDiffUnavailable,
  type VersionDiffEngine,
} from '@/studio/modules/stu-12/diff'
import {
  ADOPTION_STATES,
  EXPORT_SECTIONS,
  ROLLBACK_DISCLOSURE,
  VERSION_ACT_IDS,
  VERSION_REFUSAL_CODES,
  VERSION_STATES,
  VERSION_TRANSITIONS,
  VERSION_TRANSITION_IDS,
  transitionIsDrawn,
  adoptionState,
  applyVersionAct,
  archive,
  decideAdoption,
  deleteVersion,
  editInPlace,
  exportVersion,
  hideVersion,
  mintedNumbers,
  nextVersionNumber,
  publish,
  reconcileVersionNumbers,
  rollback,
  swapPinnedPackage,
  unarchive,
  pendingSubmission,
  visibleVersions,
  type JobAdoption,
  type PinnedRun,
  type PublishSubmission,
  type VersionAuditEntry,
  type VersionContext,
  type VersionRegister,
  type VersionTransitionId,
  type VersionOrigin,
} from '@/studio/modules/stu-12/versions'
import {
  FIXTURE_AS_OF,
  FIXTURE_REGISTER,
  RELEASED_SUBMISSION,
  CHECK_SCENARIO_IDS,
  SEEDED_VIEWERS,
  SIBLING_CHECK_SCENARIOS,
  contextFor,
  registerFor,
} from '../../app/studio/versions/fixtures'
import { VersionsScreen } from '../../app/studio/versions/VersionsScreen'

/**
 * `MOD-STU-12` — versioning and publication. Section §5.12, card L33418-L33602.
 *
 * FOR EVERY TEST NAME, THE SINGLE CHANGE THAT WOULD MAKE IT FAIL is written
 * above it as `FAILS IF:`. A test whose only failure mode is "the code is
 * deleted" is not a gate, and this build has shipped four of those.
 */

/**
 * The rendered page, with the five entities `renderToStaticMarkup` escapes
 * decoded back. Without this an assertion on any source sentence carrying a
 * quotation mark — which most of the seam contracts do — compares against
 * `&quot;` and passes or fails for the wrong reason.
 */
const html = () =>
  renderToStaticMarkup(createElement(VersionsScreen))
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/** A file's lines with its comment lines dropped — prose about a rule is not
 *  the rule, and a scan that counts both cannot tell them apart. */
const codeLines = (file: string): readonly string[] =>
  readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trimStart()
      return !trimmed.startsWith('*') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')
    })

/** The one no-active-Jobs indicator shape the archival gate reads. */
const NO_ACTIVE_JOBS = { determinable: true, activeJobs: [] } as const

// ===========================================================================
// STEP 1 — the source row count.
// ===========================================================================

describe('the permission matrix — L33456-L33469', () => {
  // FAILS IF: a data row is dropped from the transcription, or row 6 stops
  // being carried as a cross-surface statement and vanishes instead.
  it('carries all twelve source data rows — eleven controls plus one cross-surface statement', () => {
    expect(STU_12_SOURCE_ROW_COUNT).toBe(12)
    expect(STU_12_MATRIX).toHaveLength(11)
    expect(STU_12_CROSS_SURFACE).toHaveLength(1)
    expect(STU_12_MATRIX.length + STU_12_CROSS_SURFACE.length).toBe(STU_12_SOURCE_ROW_COUNT)
    // R22: the rebase is a Delivery Operations Hub act and never a Studio
    // control, so it is not a row anything on this screen can ask for.
    expect(STU_12_CAPABILITY_IDS as readonly string[]).not.toContain('rebase-a-scheduled-run')
    expect(STU_12_CROSS_SURFACE[0]?.id).toBe('rebase-a-scheduled-run')
    expect(STU_12_CROSS_SURFACE[0]?.heldOn).toBe('SURF-DOH')
  })

  // FAILS IF: the matrix is keyed on RoleId (five) rather than
  // StudioPersonaColumn (eight) — the two Supervisor columns, the Plant
  // Manager persona and GRANT-STU-IMPL cannot be expressed by a role.
  it('answers all eight persona columns on every row, and keys on the column', () => {
    for (const row of STU_12_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual(
        [
          'implementation-team',
          'plant-manager-persona',
          'quality-manager',
          'read-only-auditor',
          'supervisor-with-authoring-grant',
          'supervisor-without-grant',
          'tenant-admin',
          'worker',
        ].sort(),
      )
      for (const cell of Object.values(row.cells)) {
        expect(cell.note.trim()).not.toBe('')
        // Per-cell, never per-row: written on every cell so that "no tier
        // gate" and "nobody wrote a tier gate" cannot read the same.
        expect(cell.requiredTiers).toBeNull()
        expect(cell.requiredGrant).toBeNull()
      }
    }
  })

  // FAILS IF: row 12 gains one non-prohibited cell in any of the seven source
  // columns. That row IS the pinning guarantee stated as a matrix row.
  it('refuses swapping an in-flight pin in every one of the seven source columns', () => {
    const row = versionRow('swap-pinned-package-in-flight')
    for (const cell of Object.values(row.cells)) {
      expect(cell.outcome).toBe('explicitlyProhibited')
    }
    expect(JOB_OWNER_COLUMN_CELLS['swap-pinned-package-in-flight'].kind).toBe('explicitlyProhibited')
    // The ONLY row whose Job Owner cell refuses rather than reading
    // "Not applicable" — ten of the other eleven read Not applicable.
    const notApplicable = Object.values(JOB_OWNER_COLUMN_CELLS).filter(
      (c) => c.kind === 'notApplicable',
    )
    expect(notApplicable).toHaveLength(10)
  })

  // FAILS IF: row 11's `Read-only` is mapped mechanically to a disabled
  // control. The token carries a rendering instruction INSIDE it — "may
  // generate the read-only export" — and mapping it to disabled removes an
  // export the source grants.
  it('lets Read-only personas generate the export, because the token says so', () => {
    const row = versionRow('export-a-version')
    for (const column of ['supervisor-without-grant', 'tenant-admin', 'plant-manager-persona'] as const) {
      expect(row.cells[column].outcome).toBe('readOnly')
      expect(row.cells[column].note).toContain('may generate the read-only export')
    }
    expect(row.cells['read-only-auditor'].openDecision).toBe('DEC-AUDSTU-001')
  })

  // FAILS IF: a persona that holds nothing on any screen row is nevertheless
  // offered the module route, or the Read-only Auditor's open decision is
  // resolved in either direction.
  it('derives module reach from its own screen rows only', () => {
    const reach = reachByStudioMatrix(STU_12_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach.worker).toBe('withheld')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['supervisor-without-grant']).toBe('offered')
  })
})

// ===========================================================================
// STEP 2 — the field-value permission.
// ===========================================================================

/** A Job whose owner field names `ownerId`. The field, never a role. */
function job(jobId: string, ownerId: string): JobAdoption {
  return {
    jobId,
    ownerId,
    onVersion: 'v2.1.0',
    decision: null,
    notifiedAt: '2026-06-21T09:00:00.000Z',
    decidedAt: null,
    windowHours: 8,
  }
}

describe('adoption keys to the Job Owner FIELD, not to a role', () => {
  // FAILS IF: `decideAdoption` reads the persona column alone and ignores
  // `job.ownerId` — the Quality Manager who happens to own the Job is then
  // refused, which is the defect this row exists to pin.
  it('permits adoption by the Job Owner FIELD, not by role', () => {
    const qmNotOwner = decideAdoption(
      FIXTURE_REGISTER,
      job('JOB-REDBIKE', 'IDN-OTHER'),
      'adopt',
      contextFor('quality-manager'),
    )
    const qmOwner = decideAdoption(
      FIXTURE_REGISTER,
      job('JOB-REDBIKE', SEEDED_VIEWERS['quality-manager'].identity.identityId),
      'adopt',
      contextFor('quality-manager'),
    )
    expect(qmNotOwner.ok).toBe(false)
    expect(qmNotOwner.ok === false && qmNotOwner.refusal.outcome).toBe('explicitlyProhibited')
    expect(qmOwner.ok).toBe(true)
  })

  // FAILS IF: the "unless also the Job Owner" rider is hung on the ROW rather
  // than on the CELL. Four of the five tenant-role cells carry it verbatim;
  // the Read-only Auditor's and the Worker's do not, and a row-level rider
  // would hand both of them a decision the source withholds.
  it('carries the Job-Owner rider per cell, on four columns and not on the other four', () => {
    const row = versionRow('decide-adoption')
    const withRider = Object.entries(row.cells)
      .filter(([, cell]) => cell.unlessJobOwner)
      .map(([column]) => column)
      .sort()
    expect(withRider).toEqual(
      [
        'plant-manager-persona',
        'quality-manager',
        'supervisor-with-authoring-grant',
        'supervisor-without-grant',
        'tenant-admin',
      ].sort(),
    )
    expect(row.cells['read-only-auditor'].unlessJobOwner).toBe(false)
    expect(row.cells.worker.unlessJobOwner).toBe(false)
    // The four riders quote the source cell verbatim; the two without one say
    // so in their own words rather than going quiet, which is what stops a
    // blank difference reading as an oversight.
    for (const column of [
      'quality-manager',
      'supervisor-with-authoring-grant',
      'supervisor-without-grant',
      'tenant-admin',
    ] as const) {
      expect(row.cells[column].note).toBe('Explicitly prohibited unless also the Job Owner')
    }
    // The Plant Manager mirrors the without-grant cell and says so, rather
    // than being silently aliased — so it carries the rider plus its reason.
    expect(row.cells['plant-manager-persona'].note).toContain(
      'Explicitly prohibited unless also the Job Owner',
    )
    expect(row.cells['plant-manager-persona'].note).toContain('DEC-ROLE-001')
    for (const column of ['read-only-auditor', 'worker'] as const) {
      expect(row.cells[column].note.startsWith('Explicitly prohibited unless')).toBe(false)
      expect(row.cells[column].note).toContain('carries no')
    }
  })

  // FAILS IF: a Worker or Read-only Auditor who is named on the owner field is
  // let through. Their source cells carry no rider, and the build carries the
  // source rather than smoothing it.
  it('still refuses the two columns whose cells carry no rider, owner field or not', () => {
    for (const persona of ['worker', 'read-only-auditor'] as const) {
      const owned = job('JOB-REDBIKE', SEEDED_VIEWERS[persona].identity.identityId)
      const outcome = decideAdoption(FIXTURE_REGISTER, owned, 'adopt', contextFor(persona))
      expect(outcome.ok).toBe(false)
    }
  })

  // FAILS IF: the adoption decision writes without an audit entry, or writes
  // one that does not name the field the permission keyed on.
  it('records the adoption decision through the audit path, naming the owner field', () => {
    const written: VersionAuditEntry[] = []
    const context = contextFor('quality-manager', {
      audit: (e: VersionAuditEntry) => (written.push(e), { ok: true as const }),
    })
    const owned = job('JOB-REDBIKE', SEEDED_VIEWERS['quality-manager'].identity.identityId)
    const outcome = decideAdoption(FIXTURE_REGISTER, owned, 'defer', context)
    expect(outcome.ok).toBe(true)
    expect(written).toHaveLength(1)
    expect(written[0]?.act).toBe('decide-adoption')
    expect(written[0]?.detail).toContain('JOB-REDBIKE')
    expect(written[0]?.detail).toContain(SEEDED_VIEWERS['quality-manager'].identity.identityId)
    if (outcome.ok) {
      const row = outcome.register.adoption.find((a) => a.jobId === 'JOB-REDBIKE')
      expect(row?.decision).toBe('defer')
    }
  })
})

// ===========================================================================
// STEP 3 — the two vocabularies stay apart (D5).
// ===========================================================================

describe('D5 — Superseded is the version state, Outdated is the Job adoption state', () => {
  // FAILS IF: OBJ-037's collapse is adopted and `Outdated` is put on the
  // version, which loses the distinction between a newer version existing and
  // this Job's update window lapsing. The two are separately notified (L33569).
  it('keeps Superseded on the version and Outdated on the Job adoption', () => {
    expect(VERSION_STATES).toEqual(['Published', 'Superseded', 'Archived'])
    expect(ADOPTION_STATES).toEqual(['Notified', 'Decided-adopt', 'Decided-defer', 'Outdated'])
    expect(VERSION_STATES).not.toContain('Outdated')
    expect(ADOPTION_STATES).not.toContain('Superseded')
  })

  // FAILS IF: a second adoption-state list is declared here instead of the
  // canon's being re-exported. Two lists are how two lists drift.
  it('re-exports the canon rather than declaring a second adoption vocabulary', () => {
    expect(ADOPTION_STATES).toBe(JOB_ADOPTION_STATES)
  })

  // FAILS IF: `Outdated` becomes a stored field. It is derived from the window
  // and the caller's `asOf`, so it cannot go stale against the decision.
  it('derives Outdated from the update window rather than storing it', () => {
    const notified = job('JOB-REDBIKE', 'IDN-OWNER')
    expect(adoptionState(notified, '2026-06-21T12:00:00.000Z')).toBe('Notified')
    expect(adoptionState(notified, '2026-06-21T18:00:00.000Z')).toBe('Outdated')
    const decided: JobAdoption = { ...notified, decision: 'adopt', decidedAt: '2026-06-21T10:00:00.000Z' }
    // A decided Job never lapses: the window runs only while nobody decided.
    expect(adoptionState(decided, '2026-06-30T00:00:00.000Z')).toBe('Decided-adopt')
  })

  // FAILS IF: D5's disclosure stops rendering both readings, or the screen
  // starts presenting one as the source's answer.
  it('discloses D5 with both readings and neither settled', () => {
    const d5 = decisionRecord('D5')
    expect(d5.readings).toHaveLength(2)
    const page = html()
    for (const reading of d5.readings) expect(page).toContain(reading.locator)
    expect(page).toContain('A client-delegated choice under APP-012')
  })
})

// ===========================================================================
// STEP 4 — rollback refusals, and BOTH identifiers.
// ===========================================================================

describe('the rollback question — refused acts and two identifiers', () => {
  const published = FIXTURE_REGISTER.versions[0]!

  // FAILS IF: any of the four named refusals becomes reachable. L53706 —
  // "Deleting or hiding a published version is refused; prior versions are
  // retained in full. Rolling back by editing a published version in place is
  // refused. Skipping the chain for a rollback is refused."
  it('refuses to delete, hide, edit-in-place or chain-skip a published version', () => {
    expect(deleteVersion(published).ok).toBe(false)
    expect(hideVersion(published).ok).toBe(false)
    expect(editInPlace(published).ok).toBe(false)
    expect(rollback(published, { skipChain: true }).ok).toBe(false)
    for (const refusal of [
      deleteVersion(published),
      hideVersion(published),
      editInPlace(published),
      rollback(published, { skipChain: true }),
    ]) {
      expect(refusal.ok).toBe(false)
      if (!refusal.ok) {
        expect(refusal.reason.trim()).not.toBe('')
        expect(refusal.sourceRefs.length).toBeGreaterThan(0)
      }
    }
  })

  // FAILS IF: rollback is modelled as an un-publish rather than as a forward
  // act. L53703 — the previous content goes through the chain again and comes
  // out as a NEW, HIGHER version number.
  it('rolls back forward, through the chain, as a new higher version number', () => {
    const forward = rollback(published, { skipChain: false })
    expect(forward.ok).toBe(true)
    if (forward.ok) {
      expect(forward.unpublished).toBe(false)
      expect(forward.reEntersChain).toBe(true)
      expect(forward.basedOn).toBe(published.number)
    }
    // The bad version stays readable and stays in force until superseded.
    expect(published.state).toBe('Published')
  })

  // FAILS IF: only one identifier renders, or one is presented as settling the
  // question. `DEC-WFROLL-001` (chapter 28, L53350) and `DEC-VERROLL-001`
  // (chapter 7, L8623) ask the same question with NO cross-reference.
  it('renders BOTH rollback identifiers and neither as settled', () => {
    const page = html()
    expect(page).toMatch(/DEC-WFROLL-001/)
    expect(page).toMatch(/DEC-VERROLL-001/)
    const d7 = decisionRecord('DEC-WFROLL-001')
    expect(d7.decisionRef).toBe('DEC-WFROLL-001')
    expect(d7.alias).toBe('DEC-VERROLL-001')
    // BOTH locator sets pinned. Removing either reading turns this red.
    expect(d7.readings).toHaveLength(2)
    for (const reading of d7.readings) expect(page).toContain(reading.locator)
    expect(page).toContain('None is this build')
  })

  // FAILS IF: the behavioural refusals get folded into the open decision and
  // rendered as "undecided". The QUESTION is open; the BEHAVIOUR is not.
  it('keeps the open question apart from the settled behaviour', () => {
    expect(ROLLBACK_DISCLOSURE.openQuestion).toContain('withdrawn')
    expect(ROLLBACK_DISCLOSURE.settledBehaviour.length).toBeGreaterThanOrEqual(4)
    const page = html()
    for (const settled of ROLLBACK_DISCLOSURE.settledBehaviour) expect(page).toContain(settled.statement)
  })
})

// ===========================================================================
// STEP 5 — no number re-used, and none minted on an audit failure.
// ===========================================================================

/** A publish context whose audit write refuses. */
function failingAudit() {
  return contextFor('quality-manager', {
    audit: () => ({ ok: false, reason: 'the audit store did not commit this entry' }),
  })
}

describe('the audit path — after domain refusals, before mutation', () => {
  const allPass = registerFor('all-pass')

  // FAILS IF: the mutation is applied before the audit write. The success leg
  // is asserted first and deliberately: it proves the write mutates four
  // observable things, so the failure leg is not demonstrating the contract
  // somewhere it costs nothing.
  it('mints a version, stamps publishedAt and writes adoption rows when the audit commits', () => {
    const before = mintedNumbers(FIXTURE_REGISTER)
    const result = publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, contextFor('quality-manager'), allPass)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(mintedNumbers(result.register)).not.toEqual(before)
    expect(mintedNumbers(result.register)).toContain('v2.2.0')
    const minted = result.register.versions.find((v) => v.number === 'v2.2.0')
    expect(minted?.publishedAt).toBe(FIXTURE_AS_OF)
    expect(result.register.adoption.length).toBeGreaterThan(FIXTURE_REGISTER.adoption.length)
    expect(pendingSubmission(result.register)).toBeNull()
  })

  // FAILS IF: the audit write moves after the mutation, or a failed audit write
  // is allowed to proceed. L33519 — "Where the publication transaction fails,
  // no version number is minted."
  it('mints no version number when the audit write fails', () => {
    const before = mintedNumbers(FIXTURE_REGISTER)
    const beforeAdoption = FIXTURE_REGISTER.adoption
    const r = publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, failingAudit(), allPass)
    expect(r.ok).toBe(false)
    expect(mintedNumbers(FIXTURE_REGISTER)).toEqual(before)
    expect(FIXTURE_REGISTER.adoption).toBe(beforeAdoption)
    if (!r.ok) {
      expect(r.refusal.code).toBe('not-recorded')
      expect(r.register).toBe(FIXTURE_REGISTER)
      expect(mintedNumbers(r.register)).toEqual(before)
      expect(r.register.versions.every((v) => v.number !== 'v2.2.0')).toBe(true)
    }
    expect(pendingSubmission(FIXTURE_REGISTER)).toEqual({
      submissionId: 'SUB-BB-0002',
      state: 'Released',
    })
  })

  // FAILS IF: a second audit call site appears. Slice 4 shipped an audit path
  // wired to one write handler of four; the answer is one mutator that every
  // wrapper routes through, and the count is the evidence.
  it('has exactly one committing audit call site and one refusal call site', () => {
    const source = codeLines('src/studio/modules/stu-12/versions.ts').join('\n')
    expect(source.match(/context\.audit\(/g) ?? []).toHaveLength(2)
    expect(VERSION_ACT_IDS).toEqual(['publish', 'decide-adoption', 'archive', 'unarchive', 'export'])
  })

  // FAILS IF: any of the five writes stops routing through `applyVersionAct`.
  // The audit-failure contract must hold on every one, not on the cheapest.
  it('refuses every one of the five writes when the audit cannot be written', () => {
    const ctx = failingAudit()
    const owned = job('JOB-REDBIKE', SEEDED_VIEWERS['quality-manager'].identity.identityId)
    const archived = archive(FIXTURE_REGISTER, 'v2.0.0', NO_ACTIVE_JOBS, ctx)
    expect(publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, ctx, allPass).ok).toBe(false)
    expect(decideAdoption(FIXTURE_REGISTER, owned, 'adopt', ctx).ok).toBe(false)
    expect(archived.ok).toBe(false)
    expect(unarchive(FIXTURE_REGISTER, 'v2.0.1', 'a clerical mistake', ctx).ok).toBe(false)
    expect(exportVersion(FIXTURE_REGISTER, 'v2.1.0', () => ({ ok: true, text: 'x' }), ctx).ok).toBe(false)
    // And each one names the failure rather than reporting a domain refusal.
    if (!archived.ok) expect(archived.refusal.code).toBe('not-recorded')
  })

  // FAILS IF: a version number can be re-used. L33579 — "a version number is
  // never re-used", which is the whole point of reconciling against audit.
  it('refuses to mint a number the register has already held', () => {
    // v2.0.1 is already in the fixture history, archived. The diff carries a
    // patch-class change so the classification passes and the NUMBER is the
    // only thing left to refuse on.
    const reused = publish(
      FIXTURE_REGISTER,
      {
        ...RELEASED_SUBMISSION,
        bump: 'PATCH',
        basedOn: 'v2.0.0',
        diff: seededVersionDiffEngine('PATCH'),
      },
      contextFor('quality-manager'),
      allPass,
    )
    expect(reused.ok).toBe(false)
    if (!reused.ok) expect(reused.refusal.code).toBe('version-number-reused')
  })

  // FAILS IF: reconciliation stops reporting a gap, or reports one that is not
  // there. L33579 — "any gap is reported".
  it('reports gaps and re-use when minted numbers are reconciled against audit', () => {
    const clean = reconcileVersionNumbers(['v2.0.0', 'v2.1.0'], ['v2.0.0', 'v2.1.0'])
    expect(clean.gaps).toEqual([])
    expect(clean.reused).toEqual([])
    const gappy = reconcileVersionNumbers(['v2.0.0', 'v2.1.0', 'v2.1.0'], ['v2.0.0'])
    expect(gappy.gaps).toEqual(['v2.1.0'])
    expect(gappy.reused).toEqual(['v2.1.0'])
  })

  // FAILS IF: the semantic bump rule is inverted or the prefix is dropped.
  it('mints the next number from the bump classification', () => {
    expect(nextVersionNumber('v2.1.0', 'PATCH')).toBe('v2.1.1')
    expect(nextVersionNumber('v2.1.0', 'MINOR')).toBe('v2.2.0')
    expect(nextVersionNumber('v2.1.0', 'MAJOR')).toBe('v3.0.0')
    expect(VERSION_BUMP_CLASSES).toEqual(['PATCH', 'MINOR', 'MAJOR'])
  })
})

// ===========================================================================
// A GATE THAT CAN BE BYPASSED IS NOT A GATE.
// ===========================================================================

describe('publication cannot proceed past a failed check', () => {
  // FAILS IF: `publish` gains a waiver, a force, an override or an
  // acknowledgement argument, or a second entry point that returns warnings.
  it('models no way to publish past a failed check', () => {
    const bypass = /\b(force|override|bypass|waive|acknowledge|ignore|skip)\b\s*[:(=?]/i
    for (const file of [
      'src/studio/modules/stu-12/versions.ts',
      'app/studio/versions/VersionsScreen.tsx',
    ]) {
      expect(codeLines(file).filter((line) => bypass.test(line))).toEqual([])
    }
  })

  // FAILS IF: a blocked evaluation stops blocking publication — the whole of
  // FB-STU-09 (L31453): "Nothing published; prior version remains in force."
  it('blocks publication on a failed check and names which check and why', () => {
    const failing = registerFor('one-fails')
    const before = mintedNumbers(FIXTURE_REGISTER)
    const result = publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, contextFor('quality-manager'), failing)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.refusal.code).toBe('publish-checks-blocked')
      expect(result.refusal.blockers).toHaveLength(1)
      const blocker = result.refusal.blockers[0]!
      expect(blocker.checkId).toBe('locale-completeness')
      expect(blocker.blockingElement.trim()).not.toBe('')
      expect(blocker.refuses).toBe(publishCheckById('locale-completeness').refuses)
      expect(result.refusal.reason).toContain('locale-completeness')
    }
    expect(mintedNumbers(FIXTURE_REGISTER)).toEqual(before)
  })

  // FAILS IF: `cannot-run` or "no implementation registered" is treated as a
  // pass. All three fail-closed routes must block, not one.
  it('blocks on all three fail-closed routes, not only the one that refused', () => {
    for (const scenario of ['one-fails', 'one-cannot-run', 'ten-unregistered'] as const) {
      const result = publish(
        FIXTURE_REGISTER,
        RELEASED_SUBMISSION,
        contextFor('quality-manager'),
        registerFor(scenario),
      )
      expect({ scenario, ok: result.ok }).toEqual({ scenario, ok: false })
      if (!result.ok) expect(result.refusal.blockers.length).toBeGreaterThan(0)
    }
    // And the pass case really does pass, so the assertion above is not
    // satisfied by a gate that blocks everything.
    expect(
      publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, contextFor('quality-manager'), registerFor('all-pass'))
        .ok,
    ).toBe(true)
  })

  // FAILS IF: an unregistered check is quietly skipped. Today only
  // `chain-staffable` has an owner that has shipped, so the LIVE register is
  // ten short and publication is refused — and the screen says which ten.
  it('refuses on the live register, naming every check no module has implemented', () => {
    const live = SIBLING_CHECK_SCENARIOS['ten-unregistered']
    const evaluation = evaluatePublish(live, { staffing: RELEASED_SUBMISSION.staffing, author: 'IDN-SAM' })
    expect(evaluation.blocked).toBe(true)
    expect(evaluation.blockers).toHaveLength(10)
    expect(evaluation.passed).toEqual(['chain-staffable'])
    for (const blocker of evaluation.blockers) {
      expect(blocker.kind).toBe('cannot-run')
      expect(blocker.blockingElement).toContain('no implementation is registered')
    }
    expect(PUBLISH_CHECKS).toHaveLength(11)
  })

  // FAILS IF: the storyboard's stand-ins are registered under a module the
  // check does not name as an owner. C4 stays enforced even for a fixture.
  it('registers every stand-in under the module the check itself names', () => {
    const register = createPublishCheckRegister<{ readonly ok: boolean }>()
    const notAnOwner: PublishCheckImplementation<{ readonly ok: boolean }> = {
      checkId: 'locale-completeness',
      implementedBy: 'MOD-STU-12',
      run: () => ({ outcome: 'passed' }),
    }
    const refused = registerPublishChecks(register, notAnOwner)
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.failure).toBe('not-an-owner')
    for (const scenario of CHECK_SCENARIO_IDS) {
      for (const [id, implementation] of SIBLING_CHECK_SCENARIOS[scenario].implementations) {
        expect(publishCheckById(id).ownerModules).toContain(implementation.implementedBy)
      }
    }
  })
})

// ===========================================================================
// THE VERSION STATE MACHINE — every refused transition, not only the taken ones.
// ===========================================================================

describe('the version state machine — all 16 origin x transition pairs', () => {
  const ORIGINS: readonly VersionOrigin[] = ['no-version', 'Published', 'Superseded', 'Archived']

  // FAILS IF: an edge is added to or removed from the table. Five pairs are
  // permitted and eleven are refused, and BOTH counts are asserted so a table
  // that permitted everything and a table that permitted nothing both go red.
  it('permits five origin/transition pairs and refuses the other eleven', () => {
    const permitted: string[] = []
    const refused: string[] = []
    for (const origin of ORIGINS) {
      for (const id of VERSION_TRANSITION_IDS) {
        ;(transitionIsDrawn(id, origin) ? permitted : refused).push(`${origin}/${id}`)
      }
    }
    expect(permitted.length + refused.length).toBe(16)
    expect(permitted.sort()).toEqual(
      [
        'no-version/mint',
        'Published/supersede',
        'Published/archive',
        'Superseded/archive',
        'Archived/unarchive',
      ].sort(),
    )
    expect(refused).toHaveLength(11)
    expect(VERSION_TRANSITIONS).toHaveLength(4)
  })

  // FAILS IF: the wrappers stop consulting the table — an archived version
  // could then be archived again, or a minted version re-minted.
  it('refuses a transition the table does not draw from the origin', () => {
    const archivedRegister = FIXTURE_REGISTER
    const again = archive(archivedRegister, 'v2.0.1', NO_ACTIVE_JOBS, contextFor('quality-manager'))
    expect(again.ok).toBe(false)
    if (!again.ok) expect(again.refusal.code).toBe('wrong-state')
  })

  // FAILS IF: archival is performed on an assumption when the no-active-Jobs
  // indicator cannot be computed. L33505 — "archival is blocked rather than
  // performed on an assumption."
  it('blocks archival when the no-active-Jobs indicator cannot be computed', () => {
    const blocked = archive(
      FIXTURE_REGISTER,
      'v2.0.0',
      { determinable: false, reason: 'the Delivery Operations Hub linkage did not answer' },
      contextFor('quality-manager'),
    )
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.refusal.code).toBe('indicator-uncomputable')
      expect(blocked.refusal.reason).toContain('did not answer')
    }
  })

  // FAILS IF: archival with active Jobs stops naming them. TEST-STU-112 —
  // "confirm refusal and the named Jobs."
  it('refuses archival while active Jobs exist, and names them', () => {
    const refused = archive(
      FIXTURE_REGISTER,
      'v2.0.0',
      { determinable: true, activeJobs: ['JOB-REDBIKE', 'JOB-BLUEBIKE'] },
      contextFor('quality-manager'),
    )
    expect(refused.ok).toBe(false)
    if (!refused.ok) {
      expect(refused.refusal.code).toBe('active-jobs-exist')
      expect(refused.refusal.reason).toContain('JOB-REDBIKE')
      expect(refused.refusal.reason).toContain('JOB-BLUEBIKE')
    }
  })

  // FAILS IF: archival becomes an automatic consequence of Job archival, or a
  // persona other than the Quality Manager can take it (L33505, row 10).
  it('archives only for the Quality Manager, never automatically', () => {
    const ok = archive(FIXTURE_REGISTER, 'v2.0.0', NO_ACTIVE_JOBS, contextFor('quality-manager'))
    expect(ok.ok).toBe(true)
    for (const persona of ['supervisor-with-authoring-grant', 'tenant-admin', 'worker'] as const) {
      expect(archive(FIXTURE_REGISTER, 'v2.0.0', NO_ACTIVE_JOBS, contextFor(persona)).ok).toBe(false)
    }
  })

  // FAILS IF: `DEC-ARCH-001` is implemented silently. Option (a) is this
  // build's client-delegated pick, and un-archival requires an audited reason.
  it('un-archives under DEC-ARCH-001 option (a), with a reason that is required', () => {
    const noReason = unarchive(FIXTURE_REGISTER, 'v2.0.1', '   ', contextFor('quality-manager'))
    expect(noReason.ok).toBe(false)
    if (!noReason.ok) expect(noReason.refusal.code).toBe('reason-required')
    const withReason = unarchive(
      FIXTURE_REGISTER,
      'v2.0.1',
      'archived in error during the June clean-up',
      contextFor('quality-manager'),
    )
    expect(withReason.ok).toBe(true)
    if (withReason.ok) {
      const restored = withReason.register.versions.find((v) => v.number === 'v2.0.1')
      // Derived, never stored: a later version exists, so it returns Superseded.
      expect(restored?.state).toBe('Superseded')
    }
  })

  // FAILS IF: DEC-ARCH-001 leaves the shared decision canon, or this module
  // mints a local copy of it again — two renderings of one decision. The
  // landing already happened: this test used to assert the canon had NO record
  // and that the local `DEC_ARCH_001` const carried it; it now asserts the
  // opposite half and keeps the no-local-copy half.
  it('discloses DEC-ARCH-001 from the shared canon and keeps no local copy', () => {
    expect(OPEN_DECISIONS.map((d): string | null => d.decisionRef)).toContain('DEC-ARCH-001')
    const record = decisionRecord('DEC-ARCH-001')
    expect(record.decisionRef).toBe('DEC-ARCH-001')
    expect(record.readings).toHaveLength(3)
    for (const r of record.readings) expect(r.locator).toContain('L33443')
    expect(record.adopted).toMatch(/option \(a\)/i)
    // THE NO-LOCAL-COPY HALF. `MOD-STU-12` exports nothing named for this
    // decision, so a second record added here goes red on arrival.
    expect(Object.keys(stu12Versions).filter((k) => /ARCH_001|DEC_/i.test(k))).toEqual([])
    const page = html()
    expect(page).toContain('DEC-ARCH-001')
    for (const r of record.readings) expect(page).toContain(r.text)
    expect(page).toContain(record.adopted)
  })
})

// ===========================================================================
// PINNING — active work stays on the version it was approved against.
// ===========================================================================

describe('the pinning guarantee', () => {
  // FAILS IF: a publication rebases an in-flight run. `AC-STU-108` (L33586) —
  // "An in-flight Run's pinned package is never swapped by any publication."
  // The criterion's own line, not L33517: that is step 7 of the publication
  // sequence ("In-flight Runs continue on their pinned versions regardless"),
  // which states the same rule in different words and carries neither the
  // identifier nor the quote above.
  it('leaves every in-flight run on the version it started, across a publication', () => {
    const before = FIXTURE_REGISTER.runs.map((r: PinnedRun) => `${r.runId}@${r.pinnedVersion}`)
    const result = publish(
      FIXTURE_REGISTER,
      RELEASED_SUBMISSION,
      contextFor('quality-manager'),
      registerFor('all-pass'),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.register.runs.map((r: PinnedRun) => `${r.runId}@${r.pinnedVersion}`)).toEqual(before)
    // And the in-flight run is genuinely on the PRIOR version, so the
    // assertion is not satisfied by every run already being on the new one.
    const inFlight = result.register.runs.filter((r) => r.inFlight)
    expect(inFlight.length).toBeGreaterThan(0)
    expect(inFlight.every((r) => r.pinnedVersion !== 'v2.2.0')).toBe(true)
  })

  // FAILS IF: the pinning citation drifts back off the criterion's own line.
  // `versions.ts` rule 2 quotes `AC-STU-108` verbatim; it cited L33517 for
  // those words, which is publication step 7 and carries neither the
  // identifier nor the quote. Checked against the frozen bytes rather than
  // asserted, because nothing in tests/coverage/ convicts this citation form:
  // both `locator-fidelity` and `citation-graph` stayed green with the wrong
  // line planted back in a sibling file.
  it('cites AC-STU-108 at the line that carries it', () => {
    const LINES = readFileSync('../AVIIXA_Production_Product_Blueprint.md', 'utf8').split('\n')
    const srcLine = (n: number): string => LINES[n - 1] ?? ''
    const QUOTE = "An in-flight Run's pinned package is never swapped by any publication."
    expect(srcLine(33586)).toContain('`AC-STU-108`')
    expect(srcLine(33586)).toContain(QUOTE)
    // The identifier occurs on exactly one line, so no section/row reading
    // makes another line a legitimate anchor for these words.
    expect(LINES.filter((l) => l.includes('`AC-STU-108`'))).toHaveLength(1)
    // L33517 is the sequence step that states the same rule in other words.
    expect(srcLine(33517)).toContain('In-flight Runs continue on their pinned versions regardless')
    expect(srcLine(33517)).not.toContain('AC-STU-108')
    const versions = readFileSync('src/studio/modules/stu-12/versions.ts', 'utf8')
    expect(versions).toContain('`AC-STU-108` (L33586)')
    expect(versions).not.toContain('L33517 / `AC-STU-108`')
  })

  // FAILS IF: `swapPinnedPackage` becomes reachable for anyone. Row 12 is the
  // only row where all seven source columns read Explicitly prohibited.
  it('refuses to swap the pinned package of an in-flight Run, for every role and agent', () => {
    const run = FIXTURE_REGISTER.runs.find((r) => r.inFlight)!
    const refusal = swapPinnedPackage(run, 'v2.2.0')
    expect(refusal.ok).toBe(false)
    if (!refusal.ok) {
      expect(refusal.reason).toContain('finishes on the workflow version it started')
      expect(refusal.sourceRefs).toContain('FUNC-STU-12-02-C-1 L33496')
    }
  })

  // FAILS IF: a patch publication starts requiring a Job Owner decision, or a
  // notified-class publication starts distributing without one (AC-STU-107).
  it('auto-adopts a patch and requires a decision on a notified class', () => {
    const patch = publish(
      FIXTURE_REGISTER,
      { ...RELEASED_SUBMISSION, bump: 'PATCH', diff: seededVersionDiffEngine('PATCH') },
      contextFor('quality-manager'),
      registerFor('all-pass'),
    )
    expect(patch.ok).toBe(true)
    if (patch.ok) {
      expect(patch.register.adoption).toEqual(FIXTURE_REGISTER.adoption)
      expect(patch.register.versions.find((v) => v.number === 'v2.1.1')?.autoAdopts).toBe(true)
    }
    const minor = publish(
      FIXTURE_REGISTER,
      RELEASED_SUBMISSION,
      contextFor('quality-manager'),
      registerFor('all-pass'),
    )
    if (minor.ok) {
      const added = minor.register.adoption.filter((a) => a.onVersion === 'v2.1.0')
      expect(added.length).toBeGreaterThan(0)
      expect(added.every((a) => a.decision === null)).toBe(true)
      expect(minor.register.versions.find((v) => v.number === 'v2.2.0')?.autoAdopts).toBe(false)
    }
  })

  // FAILS IF: a version becomes distributable at publication. D21 / L68465 —
  // "Versioned and Distributable are different states, so a version can exist
  // in history without ever having been safe to run."
  it('publishes a version that is not yet distributable', () => {
    const result = publish(
      FIXTURE_REGISTER,
      RELEASED_SUBMISSION,
      contextFor('quality-manager'),
      registerFor('all-pass'),
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      const minted = result.register.versions.find((v) => v.number === 'v2.2.0')
      expect(minted?.state).toBe('Published')
      expect(minted?.distributable).toBe(false)
    }
    // Task 5's journey agrees at step 17, which is the pin that fails if that
    // fixture ever collapses the two.
    const fold = journeyStates(JOURNEY_STEPS)
    expect(fold.ok).toBe(true)
    if (fold.ok) {
      const afterPublish = journeyStateAfterStep(fold.states, 17)
      expect(afterPublish.ok).toBe(true)
      if (afterPublish.ok) {
        expect(afterPublish.state.versions.some((v) => v.distributable === false)).toBe(true)
      }
    }
  })
})

// ===========================================================================
// THE DIFF ENGINE — C6, implemented here and injected at this route.
// ===========================================================================

describe('the diff engine', () => {
  // FAILS IF: the default engine becomes available. An unwired engine must
  // HOLD the submission, not advance it (L33486).
  it('holds rather than advances where the diff engine is unavailable', () => {
    expect(versionDiffUnavailable.diff('v2.1.0', 'v2.2.0').available).toBe(false)
    const held = publish(
      FIXTURE_REGISTER,
      { ...RELEASED_SUBMISSION, diff: versionDiffUnavailable },
      contextFor('quality-manager'),
      registerFor('all-pass'),
    )
    expect(held.ok).toBe(false)
    if (!held.ok) {
      expect(held.refusal.code).toBe('diff-unavailable')
      expect(held.refusal.reason).toContain('held')
    }
  })

  // FAILS IF: a change to limits, gates, timing, severity mappings, sequence or
  // screen count can be published as a PATCH. AC-STU-106.
  it('returns a mis-classified patch against the diff', () => {
    const misclassified = publish(
      FIXTURE_REGISTER,
      { ...RELEASED_SUBMISSION, bump: 'PATCH' },
      contextFor('quality-manager'),
      registerFor('all-pass'),
    )
    expect(misclassified.ok).toBe(false)
    if (!misclassified.ok) {
      expect(misclassified.refusal.code).toBe('misclassified-patch')
      expect(misclassified.refusal.reason).toContain('severity-mapping')
    }
  })

  // FAILS IF: a notified change kind is reclassified as non-notified, which is
  // exactly how a behaviour change reaches the floor without a decision.
  it('classifies the seven notified change kinds and the six that are not', () => {
    expect(VERSION_CHANGE_KINDS).toHaveLength(13)
    expect(notifiedChangeKinds().map((k) => k.id).sort()).toEqual(
      [
        'gates',
        'restructuring',
        'screens-added-or-removed',
        'sequence',
        'severity-mapping',
        'specification-limits',
        'timing',
      ].sort(),
    )
    expect(changeKind('typographical').notified).toBe(false)
    expect(changeKind('lane-b-approved-value').notified).toBe(false)
    expect(changeKind('restructuring').notified).toBe(true)
    expect(changeKind('restructuring').marksMajor).toBe(true)
  })

  // FAILS IF: the screen-level diff stops carrying before/after values, which
  // is the Reviewer's and Release Authority's evidence (L33438).
  it('compares two versions at screen level with before and after values', () => {
    const result = screenLevelDiff(seededVersionDiffEngine('MINOR'), 'v2.1.0', 'v2.2.0')
    expect(result.available).toBe(true)
    if (result.available) {
      expect(result.changedScreens.length).toBeGreaterThan(0)
      for (const screen of result.changedScreens) {
        expect(screen.fields.length).toBeGreaterThan(0)
        for (const field of screen.fields) {
          expect(field.before).not.toBe(field.after)
        }
      }
      // The source's own worked example, L33548: eight changed screens.
      expect(result.changedScreens).toHaveLength(8)
    }
  })
})

// ===========================================================================
// THE EXPORT — complete or failed, never partial.
// ===========================================================================

describe('the portable-document-format export', () => {
  // FAILS IF: a partial export is produced. L33507 — "a partially rendered
  // specification document is worse than none."
  it('fails whole with the reason stated rather than producing a partial document', () => {
    const failing = exportVersion(
      FIXTURE_REGISTER,
      'v2.1.0',
      (section) =>
        section === 'qualification-requirements'
          ? { ok: false, reason: 'the qualification requirement register did not answer' }
          : { ok: true, text: `${section} rendered` },
      contextFor('quality-manager'),
    )
    expect(failing.ok).toBe(false)
    if (!failing.ok) {
      expect(failing.refusal.code).toBe('export-incomplete')
      expect(failing.refusal.reason).toContain('qualification-requirements')
      expect(failing.refusal.reason).toContain('did not answer')
      expect(failing.register.exports).toHaveLength(0)
    }
  })

  // FAILS IF: an export omits the version number, publication date or approval
  // log — the three things that let a circulating document be traced back
  // (L33575, AC-STU-111).
  it('carries the version number, publication date and approval log', () => {
    const ok = exportVersion(
      FIXTURE_REGISTER,
      'v2.1.0',
      (section) => ({ ok: true, text: `${section} rendered` }),
      contextFor('quality-manager'),
    )
    expect(ok.ok).toBe(true)
    if (ok.ok) {
      expect(ok.document.versionNumber).toBe('v2.1.0')
      expect(ok.document.publishedAt).not.toBe('')
      expect(ok.document.approvalLog.length).toBeGreaterThan(0)
      expect(ok.document.readOnly).toBe(true)
      // The six section names are written out rather than compared against
      // EXPORT_SECTIONS: comparing the render to the constant it was built
      // from moves BOTH sides together, so dropping a section would have left
      // this green. Found by planting exactly that.
      expect(ok.document.sections.map((s) => s.section)).toEqual([
        'header',
        'screen-configuration',
        'instruction-blocks',
        'difficulty-levels',
        'qualification-requirements',
        'approval-log',
      ])
      expect(EXPORT_SECTIONS).toHaveLength(6)
      expect(ok.register.exports).toHaveLength(1)
    }
  })
})

// ===========================================================================
// SCOPE, READS, AND WHAT THE SCREEN NEVER SAYS.
// ===========================================================================

describe('the screen', () => {
  // FAILS IF: scope moves into what the screen DRAWS. A version belonging to
  // another workspace must not reach the render at all.
  it('enforces scope in what it reads, not in what it draws', () => {
    const visible = visibleVersions(FIXTURE_REGISTER, contextFor('quality-manager'))
    expect(visible.length).toBeGreaterThan(0)
    expect(visible.every((v) => v.tenant === FIXTURE_REGISTER.tenant)).toBe(true)
    // The Worker's cell is Explicitly prohibited on every read row, so the
    // read returns nothing rather than returning rows the render then hides.
    expect(visibleVersions(FIXTURE_REGISTER, contextFor('worker'))).toEqual([])
    const page = html()
    for (const version of FIXTURE_REGISTER.versions) {
      if (version.tenant !== FIXTURE_REGISTER.tenant) expect(page).not.toContain(version.number)
    }
  })

  // FAILS IF: any view claims a device is on the version. AC-STU-112 /
  // AC-STU-023 — adoption is reported per device with explicit command states.
  it('never says live on the floor, and renders the command state per device', () => {
    const page = html()
    for (const phrase of ['live on the floor', 'in force on', 'already on the tablet', 'fully adopted']) {
      expect(page.toLowerCase()).not.toContain(phrase)
    }
    expect(page).toContain(COMMAND_STATE_PHRASES.delivered)
    // A device whose command state cannot be determined renders as unknown
    // with the last known state and its timestamp, never as adopted (L33579).
    expect(page).toContain('unknown; last known')
  })

  // FAILS IF: the annotation becomes a route key, or the module's route is
  // keyed on a screen number rather than on the slug (D1).
  it('wraps the Studio shell and annotates rather than routes on the screen id', () => {
    const module = stuModuleById(STU_MODULES, 'MOD-STU-12')
    expect(module.slug).toBe('versions')
    const page = html()
    expect(page).toContain('annotation, never a route key')
    expect(page).toContain('SCR-STU-12')
    expect(page).not.toContain('/studio/SCR-STU-12')
  })

  // FAILS IF: a screen state this surface applies here stops rendering, or one
  // it does not apply starts. STATE-09 queued applies here at publication.
  it('renders the screen states this surface applies to SCR-STU-12', () => {
    expect(screenRendersState('SCR-STU-12', 'STATE-04')).toBe(true)
    // Departure 2 of 4 names SCR-STU-04 and SCR-STU-11 only, so queued does
    // NOT apply here and the screen must not claim it does.
    expect(screenRendersState('SCR-STU-12', 'STATE-09')).toBe(false)
    expect(screenRendersState('SCR-STU-12', 'STATE-07')).toBe(false)
    expect(html()).toContain('STATE-04')
  })

  // FAILS IF: the two seams this module consumes stop being declared, or the
  // seam registry loses a row this screen points at.
  it('declares both cross-slice seams rather than stubbing them', () => {
    for (const id of ['job-and-run-linkage-counts', 'job-owner-and-adoption-decision'] as const) {
      const seam = stuSeamById(STU_SEAMS, id)
      expect(seam.consumingModules).toContain('MOD-STU-12')
      expect(html()).toContain(seam.contract)
    }
    // Linkage unavailable renders as unavailable with a timestamp, never as
    // zero, because zero is a business answer and this is the absence of one.
    expect(html()).toContain('Linkage unavailable')
  })

  // FAILS IF: the four Workflow authoring statuses leave the shared canon, or
  // this module's retired NEEDS_CONTEXT note comes back, OR this module ever
  // mints its own copy of them. Both halves, because a shared vocabulary
  // duplicated across modules is only ever found at a whole-branch review.
  //
  // HALF ONE — the canon carries the set, once. Before the hoist this half
  // read `not.toContain('WORKFLOW_STATUSES')` and named the NEEDS_CONTEXT note
  // that stood in its place; the hoist landed, so it now names the canon.
  // HALF TWO is unchanged and must stay that way: it is what goes red if a
  // local copy is ever minted here, and it is not derived from half one.
  it('reads the Workflow authoring statuses from the canon and mints no copy of them', () => {
    expect(Object.keys(studioVocab)).toContain('WORKFLOW_STATUSES')
    expect([...studioVocab.WORKFLOW_STATUSES]).toEqual([
      'Draft',
      'In Review',
      'Published',
      'Archived',
    ])
    expect(Object.keys(studioVocab)).not.toContain('WORKFLOW_AUTHORING_STATES')
    expect(Object.keys(stu12Versions).filter((k) => /WORKFLOW/i.test(k))).toEqual([])
    const source = readFileSync('src/studio/modules/stu-12/versions.ts', 'utf8')
    expect(source).not.toContain('NEEDS_CONTEXT')
    // The observable publication moves is the pending submission, typed in the
    // vocabulary task 3 already owns.
    expect(SUBMISSION_STATES as readonly string[]).toContain(
      pendingSubmission(FIXTURE_REGISTER)?.state ?? '',
    )
  })

  // FAILS IF: a control is invented that the source names no cell for, or a
  // refusal code is added without a matrix row or a stated source line.
  it('draws no control the matrix has no row for', () => {
    const drawn = [...html().matchAll(/data-control="([^"]+)"/g)].map((m) => m[1]!)
    expect(drawn.length).toBeGreaterThan(0)
    for (const control of drawn) {
      expect(STU_12_CAPABILITY_IDS as readonly string[]).toContain(control)
    }
    expect(VERSION_REFUSAL_CODES).toHaveLength(14)
  })
})

// ===========================================================================
// DETERMINISM.
// ===========================================================================

describe('determinism', () => {
  // FAILS IF: a clock or a random source is read anywhere in this module. Every
  // timestamp is the caller's `at`.
  it('reads no clock and no random source', () => {
    for (const file of [
      'src/studio/modules/stu-12/versions.ts',
      'src/studio/modules/stu-12/diff.ts',
      'src/studio/modules/stu-12/matrix.ts',
      'app/studio/versions/fixtures.ts',
      'app/studio/versions/VersionsScreen.tsx',
    ]) {
      const source = readFileSync(file, 'utf8')
      expect({ file, hit: /Date\.now|Math\.random|new Date\(/.test(source) }).toEqual({
        file,
        hit: false,
      })
    }
  })

  // FAILS IF: publication starts depending on anything but its inputs.
  it('publishes to the same register twice', () => {
    const once = publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, contextFor('quality-manager'), registerFor('all-pass'))
    const twice = publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, contextFor('quality-manager'), registerFor('all-pass'))
    expect(once.ok && twice.ok && once.register).toEqual(twice.ok && twice.register)
  })

  // FAILS IF: `applyVersionAct` mutates the register it is handed. A caller
  // holding an earlier register must keep exactly what it was given.
  it('never mutates the register it is handed', () => {
    const snapshot = JSON.stringify(FIXTURE_REGISTER)
    publish(FIXTURE_REGISTER, RELEASED_SUBMISSION, contextFor('quality-manager'), registerFor('all-pass'))
    archive(FIXTURE_REGISTER, 'v2.0.0', NO_ACTIVE_JOBS, contextFor('quality-manager'))
    expect(JSON.stringify(FIXTURE_REGISTER)).toBe(snapshot)
  })

  // FAILS IF: the act plan stops being routed through the one mutator — the
  // exported entry point is the thing every wrapper is built on.
  it('exposes one mutator that every wrapper is built on', () => {
    expect(typeof applyVersionAct).toBe('function')
    const plan = {
      act: 'export' as const,
      detail: 'a plan built by hand',
      mutate: (register: VersionRegister) => register,
      versionNumber: null,
    }
    const written: VersionAuditEntry[] = []
    const outcome = applyVersionAct(
      FIXTURE_REGISTER,
      plan,
      contextFor('quality-manager', {
        audit: (e: VersionAuditEntry) => (written.push(e), { ok: true as const }),
      }),
    )
    expect(outcome.ok).toBe(true)
    expect(written).toHaveLength(1)
  })
})

// A compile-time pin rather than a runtime one: the two unions this module
// publishes are consumed by name elsewhere in the test file above, and this
// keeps the imports honest if either is renamed.
const _pins: readonly [StudioVersionCapabilityId, VersionTransitionId, PublishSubmission['bump'], VersionContext['at'], PublishCheckRegister<unknown>['implementations'] | null, VersionDiffEngine['ownedBy']] = [
  'publish-a-version',
  'mint',
  'MINOR',
  FIXTURE_AS_OF,
  null,
  'MOD-STU-12',
]
void _pins

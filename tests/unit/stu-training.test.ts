import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { isForeignProbe } from '../probe-paths'
import { TrainingLibraryScreen } from '../../app/studio/training-library/TrainingLibraryScreen'
import { STUDIO_PERSONA_COLUMNS } from '@/studio/access/evaluate'
import { reachByStudioMatrix, STU_MODULES, stuModuleById } from '@/studio/modules'
import { stuSeamById, STU_SEAMS } from '@/studio/seams'
import { STU_SCREENS, stuScreensForModule } from '@/studio/screens'
import { studioDecision } from '@/studio/disclosure/decisions'
import {
  APPROVAL_CONSUMER_CONTRACTS,
  APPROVAL_TRANSITIONS,
  type ApprovalTransitionId,
} from '@/studio/modules/stu-11/chain'
import { LOCALES, WORKFLOW_STATUSES, type WorkflowStatus } from '@/studio/vocab'
import {
  STU_08_CROSS_SURFACE,
  STU_08_MATRIX,
  STU_08_ROW_IDS,
  STU_08_SOURCE_ROW_COUNT,
  stu08Row,
} from '@/studio/modules/stu-08/matrix'
import * as trainingModule from '@/studio/modules/stu-08/training'
import * as matrixModule from '@/studio/modules/stu-08/matrix'
import {
  AUDITED_TRAINING_ACTS,
  SEEDED_TRAINING_REGISTER,
  STORAGE_ENTITLEMENT_GAP,
  TRAINING_BANNER,
  TRAINING_ITEM_OBJECT,
  TRAINING_PACKAGE_EXCLUSION,
  remainingStorageMb,
  trainingItemIds,
  trainingService,
  type TrainingAuditEntry,
  type TrainingRegister,
} from '@/studio/modules/stu-08/training'
import {
  itemsReadableBy,
  stu08Scenario,
  trainingControls,
  uploadStatement,
} from '@/studio/modules/stu-08/rendering'

/**
 * `MOD-STU-08` — the Training Library. Frozen source §5.8, card
 * L32786-L32937, permission table L32815-L32825 (**nine** data rows).
 *
 * The rules this file exists to hold, each with its planted defect recorded
 * in the task report:
 *
 * 1. ROWS 7 AND 8 ARE FRONTLINE CONSEQUENCES, NEVER STUDIO CONTROLS
 *    (L32823-L32824, convention L31515). Row 8's `Unavailable` is the
 *    *withheld-in-this-condition* sense, and the condition is named.
 * 2. NO PRACTICE MODE IS DESIGNED, PROPOSED OR IMPLIED (L32800, L32802) —
 *    not as a control, not as a disabled control, not as a sentence.
 * 3. TRAINING CONTENT IS EXCLUDED FROM THE OFFLINE WORK PACKAGE (L32798,
 *    L32849, `AC-STU-080` L32922), and the exclusion is enforced HERE by
 *    the module holding no reference to a package at all.
 * 4. VIEWING PRODUCES NO PRODUCTION RECORD (L32799, `AC-STU-081` L32923):
 *    no run telemetry, no qualification, and reading writes nothing.
 * 5. THE SAME CHAIN AND THE SAME PERMANENT HISTORY (L32796, `AC-STU-082`
 *    L32924) — `MOD-STU-11`'s chain reused, never a second one.
 */

const STU_08_DIR = join(process.cwd(), 'src', 'studio', 'modules', 'stu-08')
const ROUTE_DIR = join(process.cwd(), 'app', 'studio', 'training-library')
const APP_DIR = join(process.cwd(), 'app')
const SRC_STUDIO_DIR = join(process.cwd(), 'src', 'studio')

/**
 * A CONCURRENT process's scratch probe is skipped, and this walk is one of
 * the two that needed it most: it covers all of `src/studio`, which is
 * exactly where `tests/component/stu-shell.test.tsx` plants
 * `.zz-probe-stu-reach-<pid>` and deletes it again the moment its own
 * assertion finishes. Listing it and then reading it fails a correct build on
 * a race, not on a finding. `tests/probe-paths.ts` carries the full account.
 *
 * No `own` argument: this file plants nothing, so it should see no probe.
 */
function filesUnder(dir: string, match: RegExp, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isForeignProbe(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) filesUnder(full, match, acc)
    else if (match.test(entry.name)) acc.push(full)
  }
  return acc
}

function corpusOf(dirs: readonly string[]): string {
  return dirs
    .flatMap((dir) => filesUnder(dir, /\.tsx?$/))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
}

/** The seeded register, and a sink that records what the module writes. */
function sink(): { entries: TrainingAuditEntry[]; write: (e: TrainingAuditEntry) => 'committed' } {
  const entries: TrainingAuditEntry[] = []
  return {
    entries,
    write: (e) => {
      entries.push(e)
      return 'committed'
    },
  }
}

const FAILING_SINK = () => 'failed' as const

const QM = 'IDN-BB-ELENA'
const GRANT_HOLDER = 'IDN-BB-SAM'

/* ==================================================================== *
 * STEP 1 — the source's own table, L32815-L32825. NINE data rows.
 * ==================================================================== */

describe('the permission matrix is the source table at L32815-L32825', () => {
  it('carries all nine source rows across the matrix and the cross-surface register', () => {
    expect(STU_08_SOURCE_ROW_COUNT).toBe(9)
    expect(STU_08_MATRIX.length + STU_08_CROSS_SURFACE.length).toBe(STU_08_SOURCE_ROW_COUNT)
    expect(STU_08_MATRIX.length).toBe(7)
    expect(STU_08_CROSS_SURFACE.length).toBe(2)
  })

  it('transcribes the seven Studio rows in the source’s own order and wording', () => {
    expect(STU_08_MATRIX.map((row) => row.capability)).toEqual([
      'Author and upload Training Library content',
      'Submit content into the approval chain',
      'Review a submission',
      'Release and publish',
      'Archive content',
      'Read published training content in the Studio',
      'Have viewing count as execution or as a qualification',
    ])
    expect([...STU_08_ROW_IDS]).toEqual(STU_08_MATRIX.map((row) => row.id))
  })

  it('answers all eight persona columns on every row — no blank cells (L10238)', () => {
    for (const row of STU_08_MATRIX) {
      expect(Object.keys(row.cells).sort()).toEqual([...STUDIO_PERSONA_COLUMNS].sort())
      for (const column of STUDIO_PERSONA_COLUMNS) {
        expect(row.cells[column].note.trim()).not.toBe('')
        expect(row.derivation).toHaveProperty(column)
      }
    }
  })

  it('carries the source’s own cell wording where a cell states a reason', () => {
    expect(stu08Row('release-and-publish').cells['quality-manager'].note).toBe(
      'Allowed with conditions — Release Authority by tenant default, not on own submission',
    )
    expect(
      stu08Row('release-and-publish').cells['supervisor-with-authoring-grant'].note,
    ).toBe('Explicitly prohibited — cannot approve or release')
    expect(stu08Row('review-a-submission').cells['quality-manager'].note).toBe(
      'Allowed with conditions — not on own submission',
    )
    expect(
      stu08Row('read-published-training-content-in-the-studio').cells.worker.note,
    ).toBe(
      'Explicitly prohibited — workers view it through the Frontline Training Library Viewer',
    )
    expect(
      stu08Row('read-published-training-content-in-the-studio').cells['read-only-auditor']
        .openDecision,
    ).toBe('DEC-AUDSTU-001')
  })

  it('declares no `routedTo` at all — the absence IS the answer, MOD-STU-06 style', () => {
    // The surface renders a refusal DISABLED only where a cell's own words
    // point the reader at another row OF THIS MATRIX that the evaluator says
    // this same persona may act on. No cell of this card does, so the field is
    // not written: a map of eight nulls per row that no fold reads is a
    // declaration nothing consults, and that is the shape of defect this slice
    // has now shipped twice. Slice 5 gate 17 holds the cross-module version.
    //
    // FAILS IF: the field is declared again on this card without a fold that
    // reads it.
    for (const row of STU_08_MATRIX) {
      expect(Object.hasOwn(row, 'routedTo'), row.id).toBe(false)
    }
    void STUDIO_PERSONA_COLUMNS
  })

  /**
   * MIRRORS `matrixIn` IN `scripts/build-stu-module-reach.mjs`, which finds a
   * module's matrix as the ONE exported array whose every row carries
   * `surface`. Task 16 shipped a row promoted into a second such array and the
   * generator would then have failed with a MISLEADING error rather than a
   * true one — so the shape the generator keys on is asserted here rather than
   * left to be discovered at build time.
   */
  it('exports exactly one generator-readable matrix, and the cross-surface rows are not it', () => {
    const surfaceArrays = (mod: Record<string, unknown>) =>
      Object.entries(mod)
        .filter(
          ([, value]) =>
            Array.isArray(value) &&
            value.length > 0 &&
            value.every((row) => row !== null && typeof row === 'object' && 'surface' in row),
        )
        .map(([name]) => name)

    expect(surfaceArrays(matrixModule)).toEqual(['STU_08_MATRIX'])
    expect(surfaceArrays(trainingModule)).toEqual([])
    // The cross-surface rows carry `heldOn`, never `surface` — a second
    // surface-carrying array in this file would make the generator read
    // neither.
    for (const row of STU_08_CROSS_SURFACE) {
      expect(row).not.toHaveProperty('surface')
      expect(row.heldOn).toBe('SURF-FL')
    }
  })

  it('derives the reach of this module from its own screen rows', () => {
    const reach = reachByStudioMatrix(STU_08_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach.worker).toBe('withheld')
    expect(reach['read-only-auditor']).toBe('client-decision-open')
    expect(reach['quality-manager']).toBe('offered')
    expect(reach['supervisor-without-grant']).toBe('offered')
    expect(reach['tenant-admin']).toBe('offered')
  })
})

/* ==================================================================== *
 * STEP 2 — rows 7 and 8 are Frontline consequences, never Studio controls.
 * ==================================================================== */

describe('rows 7 and 8 render as cross-surface statements, not as controls (L31515)', () => {
  it('carries both rows verbatim, with the Worker as the only non-Not-applicable cell', () => {
    expect(STU_08_CROSS_SURFACE.map((row) => row.capability)).toEqual([
      'View published content on the device',
      'View published content on the device while offline',
    ])
    for (const row of STU_08_CROSS_SURFACE) {
      expect(row.heldOn).toBe('SURF-FL')
      expect(row.renders).toBe('cross-surface-statement')
      // Five of the six cells read `Not applicable`; the Worker's does not.
      const notApplicable = row.cells.filter((c) => c.text.startsWith('Not applicable'))
      expect(notApplicable).toHaveLength(5)
      expect(row.cells).toHaveLength(6)
      expect(row.cells[5]?.column).toBe('Worker')
      expect(row.cells[5]?.text.startsWith('Not applicable')).toBe(false)
    }
  })

  it('row 7 states the Worker’s route and row 8 states the condition, both verbatim', () => {
    expect(STU_08_CROSS_SURFACE[0]?.cells[5]?.text).toBe(
      'Allowed with conditions — online only, through the Frontline Training Library Viewer',
    )
    expect(STU_08_CROSS_SURFACE[1]?.cells[5]?.text).toBe(
      'Unavailable — delivery is online-only and content is excluded from the offline work package',
    )
  })

  /**
   * The brief's own assertion, in this build's shape: row 8's `Unavailable`
   * is sense A — the capability exists and is withheld BY A NAMED CONDITION
   * — and it is a statement about the device, not a Studio state.
   */
  it('row 8’s Unavailable is sense A, the condition named, never a Studio state', () => {
    const row8 = STU_08_CROSS_SURFACE[1]
    expect(row8?.unavailableSense).toBe('withheld-in-this-condition')
    expect(row8?.condition).toMatch(/online-only/i)
    // Row 7 carries no `Unavailable` cell at all, so it has no sense to state.
    expect(STU_08_CROSS_SURFACE[0]?.unavailableSense).toBeNull()
  })

  it('offers no control for either row, to any persona', () => {
    const crossSurfaceIds = STU_08_CROSS_SURFACE.map((row) => row.id as string)
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const ids = trainingControls(stu08Scenario({ persona })).map((c) => c.id as string)
      for (const id of crossSurfaceIds) expect(ids).not.toContain(id)
      // A positive control: the list is never empty, so the assertion above
      // cannot pass because nothing was produced.
      expect(ids).toHaveLength(6)
    }
  })

  it('draws no device-view control anywhere under app/, and states the Frontline route', () => {
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    expect(html).toContain('Frontline Training Library Viewer')
    // No control, disabled or otherwise, for either device row.
    expect(html).not.toMatch(/<button[^>]*>\s*View on (the )?device/i)
    expect(html).not.toMatch(/View on (the )?device while offline/i)

    // The positive control is the SCREEN, not the banner text: the banner
    // lives in the module (`TRAINING_BANNER`) so the screen carries no second
    // wording of it, which is why scanning `app/` for its words finds nothing.
    const corpus = corpusOf([APP_DIR])
    expect(corpus).toContain('TrainingLibraryScreen')
    expect(corpus).toContain('cross-surface-')
    expect(corpus).not.toMatch(/onClick=\{[^}]*viewOnDevice/i)
    expect(corpus).not.toMatch(/label:\s*'View published content on the device/i)
  })
})

/* ==================================================================== *
 * STEP 3 — no practice mode is designed, proposed or implied (L32802).
 * ==================================================================== */

describe('no practice mode exists anywhere on this build (L32800, L32802, AC-STU-084)', () => {
  /**
   * Rule five verbatim from L32800, held HERE rather than in the tree — the
   * corpus scan below forbids the phrase in `app/` and `src/studio/`, and a
   * copy of it in either would fail the very gate it exists to prove.
   */
  const RULE_FIVE =
    '**Practice mode** — rehearsing a Workflow without producing a production record — ' +
    '**is cut from scope.** If it resurfaces, it is handled as a change request, not an ' +
    'assumed feature.'

  const PRACTICE_MODE = /practice[-\s]mode|rehears(e|ing|al)|dry[-\s]run|trial run/i

  it('the pattern really does match the source’s own rule-five wording', () => {
    // Without this the corpus assertion below is a gate that can never fail:
    // a pattern matching nothing passes on correct code and on a shipped
    // practice mode alike.
    expect(RULE_FIVE).toMatch(PRACTICE_MODE)
    expect('Practice mode').toMatch(PRACTICE_MODE)
    expect('rehearse a Workflow').toMatch(PRACTICE_MODE)
    expect('dry run').toMatch(PRACTICE_MODE)
  })

  it('names no practice mode, in a control, a disabled control, or a sentence', () => {
    const corpus = corpusOf([APP_DIR, SRC_STUDIO_DIR])
    expect(corpus.length).toBeGreaterThan(0)
    // Two positive controls, so the assertion cannot pass on an empty scan.
    expect(corpus).toContain('TRAINING_BANNER')
    expect(corpus).toContain('MOD-STU-08')

    expect(corpus).not.toMatch(PRACTICE_MODE)
  })

  it('offers no control the matrix does not carry — the list IS the source’s rows', () => {
    const ids = trainingControls(stu08Scenario()).map((c) => c.id as string)
    for (const id of ids) expect(STU_08_ROW_IDS as readonly string[]).toContain(id)
  })
})

/* ==================================================================== *
 * STEP 4 — the exclusion holds from this side, BY OMISSION.
 * ==================================================================== */

describe('training content is excluded from the offline work package (AC-STU-080)', () => {
  it('names the guarantee, its acceptance criterion, and the integrity consequence', () => {
    expect(TRAINING_PACKAGE_EXCLUSION.acceptanceCriterion).toBe('AC-STU-080')
    expect(TRAINING_PACKAGE_EXCLUSION.sourceRefs).toContain('L32922')
    expect(TRAINING_PACKAGE_EXCLUSION.enforcedBy).toBe('omission')
    expect(TRAINING_PACKAGE_EXCLUSION.statement).toMatch(/quarantin/i)
  })

  /**
   * THE OMISSION, ASSERTED AS AN OMISSION. Task 12's publish never
   * references the run register, so it cannot rebase pinned work; this
   * module never references a package, a manifest or `MOD-STU-14`, so it
   * cannot put a training item into one. A guard can be deleted by a later
   * refactor together with its test; an absent reference cannot.
   *
   * Keyed on the SHAPE of the import, never on one spelling: any import
   * from a package or manifest module fails this, however it is named.
   */
  it('holds no reference to any package or manifest module, anywhere', () => {
    const files = [...filesUnder(STU_08_DIR, /\.tsx?$/), ...filesUnder(ROUTE_DIR, /\.tsx?$/)]
    expect(files.length).toBeGreaterThan(0)

    const IMPORTS = /^[ \t]*(?:import|export)\b[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/gm
    const PACKAGING = /stu-14|\bpackage\b|manifest|work-package/i

    // The pattern really does match what it forbids.
    expect("import { manifest } from '@/studio/modules/stu-14/package'").toMatch(PACKAGING)

    const offending: string[] = []
    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').matchAll(IMPORTS)) {
        const specifier = match[1] ?? ''
        if (PACKAGING.test(specifier)) offending.push(`${file} -> ${specifier}`)
      }
    }
    expect(offending).toEqual([])
  })

  it('exposes the item identifiers the package integrity check reads, and nothing that writes one', () => {
    const ids = trainingItemIds(SEEDED_TRAINING_REGISTER)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)

    const writers = Object.keys(trainingModule).filter((key) =>
      /includeIn|addTo|attachTo|packageDefinition|buildPackage|manifest/i.test(key),
    )
    expect(writers).toEqual([])
    // A positive control: the module really is loaded and really does export.
    expect(Object.keys(trainingModule)).toContain('SEEDED_TRAINING_REGISTER')
  })

  it('states the exclusion on the screen, in the source’s own banner words', () => {
    expect(TRAINING_BANNER).toBe(
      'Training content is delivered online only. It is excluded from offline work packages, ' +
        'generates no production record, and never substitutes for a qualification.',
    )
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    expect(html).toContain(TRAINING_BANNER)
  })
})

/* ==================================================================== *
 * STEP 5 — viewing is neither execution nor a qualification (AC-STU-081).
 * ==================================================================== */

describe('consuming training content produces no production record (L32799)', () => {
  it('audits exactly the five acts L32912 names, and viewing is not one of them', () => {
    expect([...AUDITED_TRAINING_ACTS]).toEqual([
      'upload',
      'submission',
      'review outcome',
      'release',
      'archival',
    ])
    // WORD BOUNDARIES, and they are the fix for a defect in this assertion's
    // first form: `review outcome` contains the substring "view", so an
    // unanchored pattern reported the source's own audited act as a viewing
    // act. The pattern must forbid VIEWING as an act, not the letters.
    const VIEWING = /\bview(ing|ed|s)?\b|\bwatch(ing|ed)?\b|\bconsum\w*\b|\bcompletion\b/i
    expect('viewing').toMatch(VIEWING)
    expect('review outcome').not.toMatch(VIEWING)
    for (const act of AUDITED_TRAINING_ACTS) {
      expect(act).not.toMatch(VIEWING)
    }
  })

  /**
   * The EFFECT, not the absence of a function. Every persona reads the
   * library; the register is byte-identical afterwards and the audit sink is
   * empty. Viewing is not execution, so there is nothing to record.
   */
  it('reading the library writes nothing — no register change, no audit entry', () => {
    const before = JSON.stringify(SEEDED_TRAINING_REGISTER)
    const log = sink()
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      itemsReadableBy(stu08Scenario({ persona }), SEEDED_TRAINING_REGISTER)
    }
    expect(JSON.stringify(SEEDED_TRAINING_REGISTER)).toBe(before)
    expect(log.entries).toEqual([])
  })

  it('carries no telemetry field and no qualification field on a training item', () => {
    const item = SEEDED_TRAINING_REGISTER.items[0]
    expect(item).toBeDefined()
    const fields = Object.keys(item ?? {})
    expect(fields.filter((f) => /telemetry|qualification|certificat|completion/i.test(f))).toEqual(
      [],
    )
    // A positive control: the fields SB-STU-11 asks for really are there.
    expect(fields).toEqual(
      expect.arrayContaining(['title', 'authoredLocales', 'version', 'status', 'lastPublishedAt']),
    )
  })

  it('states on screen that viewing is neither execution nor a qualification', () => {
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    expect(html).toContain('never substitutes for a qualification')
    expect(html).toMatch(/Delivery Operations Hub/)
  })
})

/* ==================================================================== *
 * STEP 6 — the SAME approval chain, reused (AC-STU-082).
 * ==================================================================== */

describe('training content passes MOD-STU-11’s chain, never a second one', () => {
  it('is one of the chain’s registered consumers, with all three stages', () => {
    const contract = APPROVAL_CONSUMER_CONTRACTS.find((c) => c.id === 'training-library')
    expect(contract).toBeDefined()
    expect(contract?.ownerModule).toBe('MOD-STU-08')
    expect(contract?.stages).toEqual(['author', 'reviewer', 'release-authority'])
    expect(contract?.additionalGates).toEqual([])
  })

  it('declares no chain of its own — the module holds no second transition table', () => {
    const exported: readonly string[] = [
      ...Object.keys(matrixModule),
      ...Object.keys(trainingModule),
    ]
    const localChains = exported.filter((name) =>
      /TRANSITION|CHAIN_STATES|APPROVAL_STAGES|REFUSAL_CODES/i.test(name),
    )
    expect(localChains).toEqual([])
  })

  /**
   * FOUND BY PLANTING, AND REPORTED: unstaging row 4 (`stage: null`) left the
   * whole suite GREEN, because separation of duties is enforced by
   * `MOD-STU-11`'s own row inside the chain, not by this module's copy of the
   * stage. The field was therefore documentation nothing checked — and a
   * matrix row whose stage drifts from the transition that performs it is a
   * matrix that describes a chain it no longer matches. This pins the three
   * staged rows against `MOD-STU-11`'s own transition table, so the field is
   * checked rather than decorative.
   */
  it('stages its three chain rows exactly as MOD-STU-11’s transitions stage them', () => {
    const stageOf = (id: ApprovalTransitionId) =>
      APPROVAL_TRANSITIONS.find((t) => t.id === id)?.stage
    expect(stu08Row('submit-content-into-the-approval-chain').stage).toBe(stageOf('submit'))
    expect(stu08Row('review-a-submission').stage).toBe(stageOf('advance'))
    expect(stu08Row('release-and-publish').stage).toBe(stageOf('release'))
    // Authoring happens BEFORE a submission exists, so it occupies no stage —
    // marking it `author` would arm distinctness against a submission that has
    // not been made.
    expect(stu08Row('author-and-upload-training-content').stage).toBeNull()
    expect(stu08Row('archive-content').stage).toBeNull()
    // A positive control: the transitions really do carry stages.
    expect(stageOf('release')).toBe('release-authority')
  })

  it('refuses release on the Author’s own submission, and audits the refusal (TEST-STU-087)', () => {
    const log = sink()
    const submitted = trainingService.submit(SEEDED_TRAINING_REGISTER, 'TRN-001', QM, log.write)
    expect(submitted.outcome).toBe('applied')
    if (submitted.outcome !== 'applied') throw new Error(submitted.reason)
    const advanced = trainingService.advance(
      submitted.register,
      'TRN-001',
      GRANT_HOLDER,
      log.write,
    )
    expect(advanced.outcome).toBe('applied')
    if (advanced.outcome !== 'applied') throw new Error(advanced.reason)

    // The Author is the Quality Manager, who is also the Release Authority by
    // tenant default. Separation of duties is what refuses, by identity.
    const own = trainingService.release(advanced.register, 'TRN-001', QM, log.write)
    expect(own.outcome).toBe('refused')
    if (own.outcome !== 'refused') throw new Error('release on own submission was permitted')
    expect(own.reason).toMatch(/already occupies the Author stage on this submission/i)
    expect(own.reason).toMatch(/one person cannot occupy two stages/i)
    // Checked by IDENTITY, never by role (L33389) — the whole point of the row.
    expect(own.reason).toContain(QM)
    expect(itemById(own.register, 'TRN-001').status).toBe('In Review')
    // The refusal is on the permanent record.
    expect(log.entries.some((e) => e.outcome === 'refused')).toBe(true)
  })

  it('publishes when a distinct Release Authority releases it (TEST-STU-086)', () => {
    const log = sink()
    const published = publishThrough(SEEDED_TRAINING_REGISTER, log.write)
    const item = itemById(published, 'TRN-001')
    expect(item.status).toBe('Published')
    expect(item.version).not.toBeNull()
    expect(item.lastPublishedAt).not.toBeNull()
    expect([...item.authoredLocales]).toEqual([...LOCALES])
    expect(log.entries.map((e) => e.act)).toEqual(['submission', 'review outcome', 'release'])
  })

  it('mirrors the Workflow lifecycle rather than minting a second one (L32835)', () => {
    const statuses = SEEDED_TRAINING_REGISTER.items.map((i) => i.status)
    for (const status of statuses) {
      expect(WORKFLOW_STATUSES as readonly WorkflowStatus[]).toContain(status)
    }
    const localCopies = Object.entries(trainingModule)
      .filter(
        ([, value]) =>
          Array.isArray(value) &&
          value.length === 4 &&
          (value as readonly unknown[]).every((v) => typeof v === 'string') &&
          (value as readonly string[]).includes('In Review'),
      )
      .map(([name]) => name)
    expect(localCopies).toEqual([])
  })
})

/* ==================================================================== *
 * STEP 7 — the audit path, on publish AND on archive.
 * ==================================================================== */

describe('the audit commits with the state change, or neither happens (L32912)', () => {
  it('holds the item at In Review when the release audit write fails', () => {
    const log = sink()
    const submitted = trainingService.submit(SEEDED_TRAINING_REGISTER, 'TRN-001', QM, log.write)
    if (submitted.outcome !== 'applied') throw new Error(submitted.reason)
    const advanced = trainingService.advance(
      submitted.register,
      'TRN-001',
      GRANT_HOLDER,
      log.write,
    )
    if (advanced.outcome !== 'applied') throw new Error(advanced.reason)
    expect(itemById(advanced.register, 'TRN-001').status).toBe('In Review')

    // The publish runs first and would otherwise succeed; the audit is what
    // fails. The item must stay exactly where it was.
    const released = trainingService.release(
      advanced.register,
      'TRN-001',
      'IDN-BB-RELEASE',
      FAILING_SINK,
    )
    expect(released.outcome).toBe('refused')
    expect(itemById(released.register, 'TRN-001').status).toBe('In Review')
    expect(itemById(released.register, 'TRN-001').version).toBeNull()
  })

  it('holds the item Published when the archive audit write fails', () => {
    const log = sink()
    const published = publishThrough(SEEDED_TRAINING_REGISTER, log.write)
    expect(itemById(published, 'TRN-001').status).toBe('Published')

    const archived = trainingService.archive(published, 'TRN-001', QM, FAILING_SINK)
    expect(archived.outcome).toBe('refused')
    if (archived.outcome !== 'refused') throw new Error('the archival was applied unaudited')
    expect(archived.reason).toMatch(/record|audit/i)
    expect(itemById(archived.register, 'TRN-001').status).toBe('Published')
  })

  it('archives with the audit entry when the sink commits, and keeps the history', () => {
    const log = sink()
    const published = publishThrough(SEEDED_TRAINING_REGISTER, log.write)
    const archived = trainingService.archive(published, 'TRN-001', QM, log.write)
    expect(archived.outcome).toBe('applied')
    expect(itemById(archived.register, 'TRN-001').status).toBe('Archived')
    // L32865 — an archived item remains permanently readable in history.
    expect(itemById(archived.register, 'TRN-001').approvalLog.length).toBeGreaterThan(0)
    expect(log.entries.map((e) => e.act)).toContain('archival')
  })

  it('refuses archival to every persona but the Quality Manager (L32821)', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const control = trainingControls(stu08Scenario({ persona })).find(
        (c) => c.id === 'archive-content',
      )
      expect(control).toBeDefined()
      if (persona === 'quality-manager') expect(control?.affordance.kind).toBe('enabled')
      else expect(control?.affordance.kind).not.toBe('enabled')
    }
  })
})

/* ==================================================================== *
 * SB-STU-11 — the storyboard the source describes (L32887).
 * ==================================================================== */

describe('SB-STU-11 renders what the source asks for', () => {
  it('lists title, language coverage, version, status and last published date', () => {
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    for (const header of [
      'Title',
      'Language coverage',
      'Version',
      'Status',
      'Last published',
    ]) {
      expect(html).toContain(header)
    }
    const item = SEEDED_TRAINING_REGISTER.items[0]
    expect(html).toContain(item?.title ?? '(no seeded item)')
  })

  it('states the entitlement and the remaining storage on the upload control', () => {
    const statement = uploadStatement(SEEDED_TRAINING_REGISTER)
    expect(statement).toContain(String(SEEDED_TRAINING_REGISTER.entitlement.ceilingMb))
    expect(statement).toContain(String(remainingStorageMb(SEEDED_TRAINING_REGISTER.entitlement)))
    expect(remainingStorageMb(SEEDED_TRAINING_REGISTER.entitlement)).toBe(
      SEEDED_TRAINING_REGISTER.entitlement.ceilingMb -
        SEEDED_TRAINING_REGISTER.entitlement.usedMb,
    )
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    expect(html).toContain(statement)
  })

  it('refuses an upload past the ceiling, naming the entitlement (L32865)', () => {
    const full: TrainingRegister = {
      ...SEEDED_TRAINING_REGISTER,
      entitlement: { ...SEEDED_TRAINING_REGISTER.entitlement, usedMb: 4_096 },
    }
    const log = sink()
    const refused = trainingService.upload(full, 'Orientation, part two', 240, QM, log.write)
    expect(refused.outcome).toBe('refused')
    if (refused.outcome !== 'refused') throw new Error('upload past the ceiling was permitted')
    expect(refused.reason).toContain(String(full.entitlement.ceilingMb))
    expect(refused.register.items.length).toBe(full.items.length)
    // Platform-side, and the screen says so rather than offering a control.
    expect(refused.reason).toMatch(/platform-side/i)
  })

  it('shows each item’s approval log', () => {
    const log = sink()
    const published = publishThrough(SEEDED_TRAINING_REGISTER, log.write)
    expect(itemById(published, 'TRN-001').approvalLog.map((e) => e.transition)).toEqual([
      'submit',
      'advance',
      'release',
    ])
  })

  it('renders the Frontline seam rather than faking the viewer', () => {
    const seam = stuSeamById(STU_SEAMS, 'frontline-training-library-viewer')
    expect(seam.consumingModules).toContain('MOD-STU-08')
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    expect(html).toContain(seam.contract)
  })

  it('declares the platform-side storage seam as a gap rather than inventing one', () => {
    expect(STORAGE_ENTITLEMENT_GAP.registeredSeam).toBeNull()
    expect(STORAGE_ENTITLEMENT_GAP.sourceRefs).toContain('L32798')
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    expect(html).toContain(STORAGE_ENTITLEMENT_GAP.screenNote)
  })
})

/* ==================================================================== *
 * Scope is enforced in what the screen READS.
 * ==================================================================== */

describe('read scope is applied at the read, never at the draw', () => {
  it('gives a read-only persona published items only, and names what is withheld', () => {
    const log = sink()
    const register = publishThrough(SEEDED_TRAINING_REGISTER, log.write)
    const draftAdded = trainingService.upload(
      register,
      'Paint bay orientation',
      120,
      QM,
      log.write,
    )
    if (draftAdded.outcome !== 'applied') throw new Error(draftAdded.reason)

    const full = itemsReadableBy(stu08Scenario({ persona: 'quality-manager' }), draftAdded.register)
    expect(full.items.map((i) => i.status)).toContain('Draft')
    expect(full.withheldCount).toBe(0)
    expect(full.withheldReason).toBeNull()

    const readOnly = itemsReadableBy(
      stu08Scenario({ persona: 'supervisor-without-grant' }),
      draftAdded.register,
    )
    expect(readOnly.items.map((i) => i.status)).not.toContain('Draft')
    expect(readOnly.withheldCount).toBeGreaterThan(0)
    expect(readOnly.withheldReason).not.toBeNull()
  })

  it('reads nothing at all for a persona the row refuses', () => {
    const worker = itemsReadableBy(stu08Scenario({ persona: 'worker' }), SEEDED_TRAINING_REGISTER)
    expect(worker.items).toEqual([])
    expect(worker.withheldReason).toMatch(/Frontline Training Library Viewer/)
  })
})

/* ==================================================================== *
 * The spine — one route, one module, one object.
 * ==================================================================== */

describe('the module, the screen and the object are the registry’s own', () => {
  it('is keyed on the module slug, and the route exists', () => {
    const module = stuModuleById(STU_MODULES, 'MOD-STU-08')
    expect(module.slug).toBe('training-library')
    expect(readdirSync(ROUTE_DIR)).toContain('page.tsx')
  })

  it('annotates SCR-STU-09 and mints no screen id of its own', () => {
    const screens = stuScreensForModule(STU_SCREENS, 'MOD-STU-08')
    expect(screens.map((s) => s.id)).toEqual(['SCR-STU-09'])
    const corpus = corpusOf([STU_08_DIR, ROUTE_DIR])
    expect(corpus).not.toMatch(/SCR-STU-\d{3}/)
  })

  /**
   * FAILS IF: the screen goes back to wording either decision itself, or
   * renders a record without its alternatives. Every assertion is read OFF
   * THE RECORD, so a rewording follows instead of going stale.
   */
  it('discloses DEC-AUDSTU-001 and the object scheme through the one component', () => {
    const html = renderToStaticMarkup(createElement(TrainingLibraryScreen))
    for (const id of ['D3', 'D11'] as const) {
      const record = studioDecision(id)
      expect(html).toContain(record.question)
      for (const reading of record.readings) expect(html).toContain(reading.text)
      expect(html).toContain(record.adopted)
    }
    expect(html).toContain('client-delegated choice')
    expect(html).toContain('APP-012')
    // AND NO SECOND WORDING: the screen must not hand-render either tension.
    const screen = readFileSync(join(ROUTE_DIR, 'TrainingLibraryScreen.tsx'), 'utf8')
    expect(screen).toContain('<DecisionDisclosure id="D3" />')
    expect(screen).toContain('<DecisionDisclosure id="D11" />')
    expect(studioDecision('D3').decisionRef).toBe('DEC-AUDSTU-001')
  })

  it('carries OBJ-044 and OBJ-STU-TRAINING as one object under two identifiers (D11)', () => {
    expect(TRAINING_ITEM_OBJECT.numericId).toBe('OBJ-044')
    expect(TRAINING_ITEM_OBJECT.mnemonic).toBe('OBJ-STU-TRAINING')
    expect(TRAINING_ITEM_OBJECT.numericRef).toBe('L8741')
    expect(TRAINING_ITEM_OBJECT.mnemonicRef).toBe('L32833')
  })
})

/* ==================================================================== *
 * Helpers used above. Declared last so the cases read first.
 * ==================================================================== */

function itemById(register: TrainingRegister, id: string) {
  const found = register.items.find((i) => i.id === id)
  if (found === undefined) throw new Error(`No training item "${id}" in the register.`)
  return found
}

/** Author submits, a distinct Reviewer advances, a distinct Release Authority releases. */
function publishThrough(
  register: TrainingRegister,
  write: (e: TrainingAuditEntry) => 'committed' | 'failed',
): TrainingRegister {
  const submitted = trainingService.submit(register, 'TRN-001', QM, write)
  if (submitted.outcome !== 'applied') throw new Error(submitted.reason)
  const advanced = trainingService.advance(submitted.register, 'TRN-001', GRANT_HOLDER, write)
  if (advanced.outcome !== 'applied') throw new Error(advanced.reason)
  const released = trainingService.release(advanced.register, 'TRN-001', 'IDN-BB-RELEASE', write)
  if (released.outcome !== 'applied') throw new Error(released.reason)
  return released.register
}

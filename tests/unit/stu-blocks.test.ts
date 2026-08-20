import { describe, it, expect } from 'vitest'

import {
  BLOCK_STATES,
  SCOPE_NOTICE,
  PROPAGATION_NOTICE,
  SEEDED_BLOCK_REGISTER,
  BOLT_SCREEN_IDS,
  WF_TORQUE,
  WF_INSPECTION,
  applyingScreens,
  blockIn,
  blockState,
  blocksVisibleIn,
  composeSection1,
  coverageState,
  deleteRefusal,
  scopeOf,
  submissionReport,
  suggestsLivePropagation,
  unusedBlocks,
  type BlockRegister,
  type WorkflowBlockScope,
} from '@/studio/modules/stu-06/blocks'
import {
  applyBlockToScreen,
  createBlock,
  deleteBlock,
  editBlock,
  removeBlockFromScreen,
  type BlockAuditEntry,
  type BlockAuditWrite,
} from '@/studio/modules/stu-06/writes'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { STUDIO_PERSONA_COLUMNS, type StudioPersonaColumn } from '@/studio/access/evaluate'
import { STU_MODULES, reachByStudioMatrix, stuModuleById } from '@/studio/modules'
import { STU_SCREENS, stuScreensForModule } from '@/studio/screens'
import { publishCheckById } from '@/studio/publish/checks'
import {
  createPublishCheckRegister,
  evaluatePublish,
  registerPublishChecks,
  registeredOwners,
} from '@/studio/publish/register'
import {
  LIBRARY_IDS,
  POINTER_SLOTS,
  SEEDED_LIBRARY_REGISTER,
  itemById,
  itemsInLibrary,
} from '@/studio/modules/stu-07/libraries'
import { ContentLibrariesView } from '@/studio/modules/stu-07/ContentLibrariesView'
import { scenario as libraryScenario } from '@/studio/modules/stu-07/rendering'

import {
  STU_06_CAPABILITY_IDS,
  STU_06_MATRIX,
  stu06Row,
  type Stu06CapabilityId,
} from '@/studio/modules/stu-06/matrix'
import { blockReferencePublishCheck } from '@/studio/modules/stu-06/blocks'
import {
  blockControls,
  decisionForRow,
  readableBlocks,
  scenario,
  type Stu06Scenario,
} from '@/studio/modules/stu-06/rendering'
import { BlockEditorView } from '@/studio/modules/stu-06/BlockEditorView'
import { InstructionBlocksScreen } from '../../app/studio/instruction-blocks/InstructionBlocksScreen'

/* ==================================================================== *
 * FIXTURES.
 *
 * DEFECT SHAPE 11 — a baseline chosen so the failure cannot appear. Every
 * fixture sits on the PERMITTING side of every boundary it is not
 * exercising: the audit sink accepts, the Workflow is in Draft, the block
 * exists, the screens exist. Each refusal test is therefore paired with the
 * same call one field away, asserted to succeed, so a refusal arriving for
 * the wrong reason cannot certify a guard.
 * ==================================================================== */

const ACTOR = { identityId: 'IDN-BB-SAM', displayName: 'Sam Okonkwo' }

const TORQUE_BLOCK = 'BLK-WF-BB-TORQUE-bolt-torque-procedure'

function acceptingSink(): { write: BlockAuditWrite; entries: BlockAuditEntry[] } {
  const entries: BlockAuditEntry[] = []
  return {
    entries,
    write: (entry) => {
      entries.push(entry)
      return { ok: true }
    },
  }
}

const FAILING_SINK: BlockAuditWrite = () => ({
  ok: false,
  reason: 'the tenant audit log did not accept the entry',
})

function scope(register: BlockRegister, workflowId: string): WorkflowBlockScope {
  const found = scopeOf(register, workflowId)
  if (found === undefined) throw new Error(`fixture: no scope for ${workflowId}`)
  return found
}

/** Every screen's rendered Section 1, in one comparable shape. */
function allCompositions(register: BlockRegister, workflowId: string): readonly string[] {
  const s = scope(register, workflowId)
  return s.screens.map((screen) => composeSection1(s, screen.id, 'English', 'standard').join(' | '))
}

/* ==================================================================== *
 * STEP 1 — the module's own states and its two frozen notices.
 * ==================================================================== */

describe('MOD-STU-06 states and notices', () => {
  it('carries the three states L32473 names and no fourth', () => {
    expect(BLOCK_STATES).toEqual([
      'Draft',
      'Applied to one or more screens',
      'Published within a version',
    ])
  })

  it('states the scoping rule in SB-STU-09’s own words (L32523)', () => {
    expect(SCOPE_NOTICE).toBe(
      'Blocks belong to this Workflow only. They are not Content Library items and cannot be used in another Workflow.',
    )
  })
})

/* ==================================================================== *
 * STEP 2 — R11. THE RECORD IS KEYED BY WORKFLOW, AND THE CROSS-WORKFLOW
 * REFUSAL IS AT THE SERVICE LAYER (L32486 the function, L32550 the words).
 * ==================================================================== */

describe('R11 — a block is not a library item', () => {
  it('keys the register by Workflow, so a cross-Workflow read has nowhere to come from', () => {
    expect(Object.keys(SEEDED_BLOCK_REGISTER).sort()).toEqual([WF_INSPECTION, WF_TORQUE].sort())
    // Not a global block table with a workflow field somebody remembers to
    // filter on: the ONLY way to reach a block is through its Workflow's key.
    expect(blocksVisibleIn(SEEDED_BLOCK_REGISTER, WF_TORQUE).length).toBeGreaterThan(0)
    expect(blocksVisibleIn(SEEDED_BLOCK_REGISTER, WF_INSPECTION)).toEqual([])
  })

  it('carries workflowId on the block record itself', () => {
    const made = createBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_INSPECTION,
      title: 'Torque safety',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(made.ok).toBe(true)
    expect(made.block).not.toBeNull()
    expect(Object.keys(made.block ?? {})).toContain('workflowId')
    expect(made.block?.workflowId).toBe(WF_INSPECTION)
  })

  it('refuses a cross-Workflow block reference at the service layer, both directions', () => {
    const sink = acceptingSink()

    // Direction 1 — the block's own Workflow, a screen belonging to another.
    const foreignScreen = applyBlockToScreen({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: TORQUE_BLOCK,
      screenId: 'SCR-INSPECT-01',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    expect(foreignScreen.ok).toBe(false)
    expect(foreignScreen.register).toBe(SEEDED_BLOCK_REGISTER)
    expect(foreignScreen.message).toContain('scoped to a single Workflow')

    // Direction 2 — another Workflow's scope, this Workflow's block.
    const foreignBlock = applyBlockToScreen({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_INSPECTION,
      blockId: TORQUE_BLOCK,
      screenId: 'SCR-INSPECT-01',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    expect(foreignBlock.ok).toBe(false)
    expect(foreignBlock.register).toBe(SEEDED_BLOCK_REGISTER)

    // NOT MERELY HIDDEN IN A PICKER. Nothing changed, and the other
    // Workflow still sees no block at all.
    expect(blocksVisibleIn(foreignBlock.register, WF_INSPECTION)).toEqual([])
    expect(blockIn(SEEDED_BLOCK_REGISTER, WF_INSPECTION, TORQUE_BLOCK)).toBeUndefined()

    // A refused action is not an action: no audit entry for either attempt.
    expect(sink.entries).toEqual([])

    // The same call one field away SUCCEEDS, so the refusals above cannot be
    // certified by a guard that refuses everything.
    const ok = applyBlockToScreen({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: TORQUE_BLOCK,
      screenId: 'SCR-TORQUE-11',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    expect(ok.ok).toBe(true)
  })
})

/* ==================================================================== *
 * STEP 3 — THE AUDIT SHAPE (L32548). EIGHT CHANGED SCREENS, NOT ONE
 * CHANGED BLOCK.
 * ==================================================================== */

describe('the screen-level diff a reviewer sees', () => {
  it('surfaces a block edit as one diff entry per affected screen', () => {
    const applied = applyingScreens(scope(SEEDED_BLOCK_REGISTER, WF_TORQUE), TORQUE_BLOCK)
    expect(applied).toHaveLength(8)

    const edited = editBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: TORQUE_BLOCK,
      locale: 'English',
      level: 'standard',
      text: 'Torque to 45 Nm in the revised star sequence.',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })

    expect(edited.ok).toBe(true)
    expect(edited.diffEntries).toHaveLength(8)
    expect(edited.diffEntries.map((e) => e.screenId).sort()).toEqual([...BOLT_SCREEN_IDS].sort())
    // Each entry is THAT SCREEN'S own composition, before and after — which
    // is what makes eight entries eight changed screens rather than one
    // changed block copied eight times.
    expect(new Set(edited.diffEntries.map((e) => e.after)).size).toBe(8)
    for (const entry of edited.diffEntries) {
      expect(entry.before).not.toBe(entry.after)
      expect(entry.screenName).not.toBe('')
    }
  })

  it('reports a creation as zero changed screens and an application as one', () => {
    const sink = acceptingSink()
    const made = createBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      title: 'Calibration note',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    expect(made.ok).toBe(true)
    expect(made.diffEntries).toEqual([])

    const applied = applyBlockToScreen({
      register: made.register,
      workflowId: WF_TORQUE,
      blockId: made.block?.id ?? '',
      screenId: 'SCR-TORQUE-03',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    expect(applied.ok).toBe(true)
    expect(applied.diffEntries.map((e) => e.screenId)).toEqual(['SCR-TORQUE-03'])
  })
})

/* ==================================================================== *
 * STEP 4 — PROPAGATION HONESTY (L32480, L32500, AC-STU-070 L32562).
 * ==================================================================== */

describe('propagation honesty', () => {
  it('can detect a live-propagation claim, so the absence assertions below are not vacuous', () => {
    expect(suggestsLivePropagation('This change takes effect immediately on the floor.')).toBe(true)
    expect(suggestsLivePropagation('The change takes effect now on the floor.')).toBe(true)
    expect(suggestsLivePropagation('Every applying screen updates live on the device.')).toBe(true)
    expect(suggestsLivePropagation(PROPAGATION_NOTICE)).toBe(false)
  })

  it('states that a block edit reaches the floor only through a new published version', () => {
    expect(PROPAGATION_NOTICE).toMatch(/new published version and its adoption/i)
    expect(PROPAGATION_NOTICE).toMatch(/no propagation occurs to a pinned package/i)
  })

  it('lands an edit made after publication in a new draft, and says so', () => {
    const published = editBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: TORQUE_BLOCK,
      locale: 'English',
      level: 'standard',
      text: 'Torque to 45 Nm.',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(published.ok).toBe(true)
    expect(published.message).toMatch(/new published version and its adoption/i)
    expect(suggestsLivePropagation(published.message)).toBe(false)
    // The edited block is back in Draft: the prior published version is what
    // is still in force on the floor.
    const next = blockIn(published.register, WF_TORQUE, TORQUE_BLOCK)
    expect(next?.publishedInVersion).toBeNull()
  })

  it('has no access to a run register at all, so it cannot rebase work in flight', () => {
    // The rule the code cannot reach around. Every write in this module takes
    // a BlockRegister and returns a BlockRegister; none of them is handed a
    // pinned package, a run, or a version, so no propagation to a pinned
    // package is expressible here.
    const keys = Object.keys(scope(SEEDED_BLOCK_REGISTER, WF_TORQUE))
    expect(keys).not.toContain('runs')
    expect(keys).not.toContain('versions')
    expect(keys).not.toContain('packages')
    expect(keys).toContain('blocks')
  })
})

/* ==================================================================== *
 * STEP 5 — THE ORPHAN IS REPORTED, NEVER BLOCKING; THE DELETE CONTROL
 * NAMES THE SCREENS.
 * ==================================================================== */

describe('an orphaned block', () => {
  it('is Draft, and is reported at submission rather than blocking it', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    const orphans = unusedBlocks(s)
    expect(orphans).toHaveLength(1)
    expect(orphans[0]?.title).toBe('Retired hoist advisory')
    expect(blockState(orphans[0]!)).toBe('Draft')

    const report = submissionReport(s)
    // REPORTED, NOT BLOCKING — and the two are asserted separately, because
    // a report that also blocked would still name the block.
    expect(report.blocksSubmission).toBe(false)
    expect(report.unusedBlockTitles).toEqual(['Retired hoist advisory'])
    expect(report.message).toMatch(/unused block/i)
  })

  it('reports nothing where every block applies to a screen', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    const cleaned: WorkflowBlockScope = {
      ...s,
      blocks: s.blocks.filter((b) => b.appliesToScreenIds.length > 0),
    }
    expect(unusedBlocks(cleaned)).toEqual([])
    expect(submissionReport(cleaned).unusedBlockTitles).toEqual([])
    expect(submissionReport(cleaned).blocksSubmission).toBe(false)
  })
})

describe('the delete control', () => {
  it('is disabled while applying screens exist, with EVERY screen named', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    const names = applyingScreens(s, TORQUE_BLOCK).map((screen) => screen.name)
    expect(names).toHaveLength(8)

    const reason = deleteRefusal(s, TORQUE_BLOCK)
    expect(reason).not.toBeNull()
    // NAMED, NOT COUNTED. Each of the eight, individually.
    for (const name of names) expect(reason).toContain(name)
    expect(reason).not.toMatch(/\b8 screens\b(?![^.]*Bolt)/)
  })

  it('refuses the write too, so the rule is not only in the view', () => {
    const refused = deleteBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: TORQUE_BLOCK,
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(refused.ok).toBe(false)
    expect(refused.register).toBe(SEEDED_BLOCK_REGISTER)
    expect(refused.namedScreens).toHaveLength(8)
  })

  it('permits deleting an orphaned Draft block, which is the paired success', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    const orphan = unusedBlocks(s)[0]!
    expect(deleteRefusal(s, orphan.id)).toBeNull()
    const gone = deleteBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: orphan.id,
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(gone.ok).toBe(true)
    expect(blockIn(gone.register, WF_TORQUE, orphan.id)).toBeUndefined()
  })

  it('refuses to delete a block published within a version, reconciling OBJ-039 with §5.6', () => {
    // OBJ-039 (L8651) states "archived with the workflow; no deletion";
    // SB-STU-09 (L32523) states a delete control disabled while applying
    // screens exist. Both are true if the control governs a DRAFT block and
    // OBJ-039 governs one published within a version.
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    // Isolated: the applying-screen rule is removed so the published rule is
    // the only thing that can refuse. A refusal proven only on a block that
    // ALSO has applying screens proves nothing about this rule.
    const detached: BlockRegister = {
      [WF_TORQUE]: { ...s, blocks: s.blocks.map((b) => ({ ...b, appliesToScreenIds: [] })) },
    }
    const published = scope(detached, WF_TORQUE).blocks.find((b) => b.publishedInVersion !== null)
    expect(published).toBeDefined()
    expect(applyingScreens(scope(detached, WF_TORQUE), published!.id)).toEqual([])

    const refused = deleteBlock({
      register: detached,
      workflowId: WF_TORQUE,
      blockId: published!.id,
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(refused.ok).toBe(false)
    expect(refused.message).toMatch(/published within a version/i)
    expect(refused.register).toBe(detached)
  })
})

/* ==================================================================== *
 * STEP 7 — THE AUDIT PATH, AND WHAT A FAILED AUDIT LEAVES BEHIND.
 * ==================================================================== */

describe('the one audit path', () => {
  it('appends one entry per write, naming identity and action', () => {
    const sink = acceptingSink()
    const made = createBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      title: 'Hoist check',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    const applied = applyBlockToScreen({
      register: made.register,
      workflowId: WF_TORQUE,
      blockId: made.block?.id ?? '',
      screenId: 'SCR-TORQUE-03',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    const edited = editBlock({
      register: applied.register,
      workflowId: WF_TORQUE,
      blockId: made.block?.id ?? '',
      locale: 'English',
      level: 'standard',
      text: 'Check the hoist.',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    const removed = removeBlockFromScreen({
      register: edited.register,
      workflowId: WF_TORQUE,
      blockId: made.block?.id ?? '',
      screenId: 'SCR-TORQUE-03',
      actor: ACTOR,
      writeAudit: sink.write,
    })
    expect([made.ok, applied.ok, edited.ok, removed.ok]).toEqual([true, true, true, true])
    expect(sink.entries.map((e) => e.action)).toEqual(['create', 'apply', 'edit', 'remove'])
    for (const entry of sink.entries) {
      expect(entry.actorIdentityId).toBe('IDN-BB-SAM')
      expect(entry.workflowId).toBe(WF_TORQUE)
    }
    // Removing the block left the screen-specific note intact (L32489).
    const screen = scope(removed.register, WF_TORQUE).screens.find((s) => s.id === 'SCR-TORQUE-03')
    expect(screen?.note).not.toBe('')
  })

  it('fails the edit with the audit, leaving EVERY applying screen unchanged', () => {
    const before = allCompositions(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    expect(before).toHaveLength(9)

    const failed = editBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: TORQUE_BLOCK,
      locale: 'English',
      level: 'standard',
      text: 'A revision nobody should ever see.',
      actor: ACTOR,
      writeAudit: FAILING_SINK,
    })
    expect(failed.ok).toBe(false)
    expect(failed.register).toBe(SEEDED_BLOCK_REGISTER)
    expect(allCompositions(failed.register, WF_TORQUE)).toEqual(before)
    for (const composition of allCompositions(failed.register, WF_TORQUE)) {
      expect(composition).not.toContain('A revision nobody should ever see.')
    }

    // The paired success on the accepting sink, so "unchanged" is not what
    // this module does to every edit.
    const ok = editBlock({
      register: SEEDED_BLOCK_REGISTER,
      workflowId: WF_TORQUE,
      blockId: TORQUE_BLOCK,
      locale: 'English',
      level: 'standard',
      text: 'A revision nobody should ever see.',
      actor: ACTOR,
      writeAudit: acceptingSink().write,
    })
    expect(ok.ok).toBe(true)
    expect(allCompositions(ok.register, WF_TORQUE)).not.toEqual(before)
  })
})

/* ==================================================================== *
 * SECTION 1 COMPOSITION — BLOCK CONTENT FIRST, THE SCREEN NOTE SECOND
 * (AC-STU-068, L32560).
 * ==================================================================== */

describe('Section 1 composition', () => {
  it('renders block content first and the screen-specific note second, in every locale and level', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    for (const locale of ['English', 'Spanish'] as const) {
      for (const level of ['simple', 'standard', 'expanded'] as const) {
        const parts = composeSection1(s, 'SCR-TORQUE-03', locale, level)
        expect(parts.length).toBeGreaterThan(1)
        expect(parts[0]).toMatch(/torque/i)
        expect(parts[parts.length - 1]).toBe('Bolt A front-left')
      }
    }
  })

  it('renders the screen note alone where no block applies', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    expect(composeSection1(s, 'SCR-TORQUE-11', 'English', 'standard')).toEqual(['Preparation'])
  })

  it('reports the locale and difficulty coverage state of every block', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    const complete = coverageState(s.blocks[0]!, s.declaredLocales)
    expect(complete.complete).toBe(true)
    expect(complete.missing).toEqual([])

    const orphan = unusedBlocks(s)[0]!
    const incomplete = coverageState(orphan, s.declaredLocales)
    expect(incomplete.complete).toBe(false)
    expect(incomplete.missing.length).toBeGreaterThan(0)
  })
})

/* ==================================================================== *
 * WAVE B — THE MATRIX, THE PUBLISH CHECK, THE RENDERING, AND THE SCREEN.
 * ==================================================================== */


/* ==================================================================== *
 * STEP 1 — THE MATRIX, READ AT L32456-L32463. SIX DATA ROWS.
 * ==================================================================== */

describe('the MOD-STU-06 permission matrix', () => {
  it('carries the card’s six data rows and no seventh', () => {
    expect(STU_06_MATRIX).toHaveLength(6)
    expect(STU_06_CAPABILITY_IDS).toHaveLength(6)
    expect(STU_06_MATRIX.map((row) => row.capability)).toEqual([
      'Create a block within a Workflow',
      'Apply a block to a screen',
      'Edit a block, propagating to every applying screen',
      'Remove a block from a screen',
      'Reuse a block in another Workflow',
      'Read a block on published content',
    ])
  })

  it('answers all EIGHT persona columns on every row, with no blank cell', () => {
    expect(STUDIO_PERSONA_COLUMNS).toHaveLength(8)
    for (const row of STU_06_MATRIX) {
      for (const column of STUDIO_PERSONA_COLUMNS) {
        const cell = row.cells[column]
        expect(cell, `${row.id}/${column}`).toBeDefined()
        expect(cell.outcome, `${row.id}/${column}`).not.toBe('')
        expect(cell.note.trim(), `${row.id}/${column}`).not.toBe('')
      }
    }
  })

  it('writes a derivation for each of the two columns the card does not head, and only those', () => {
    const headed: readonly StudioPersonaColumn[] = [
      'quality-manager',
      'supervisor-with-authoring-grant',
      'supervisor-without-grant',
      'tenant-admin',
      'read-only-auditor',
      'worker',
    ]
    for (const row of STU_06_MATRIX) {
      for (const column of headed) expect(row.derivation[column], `${row.id}/${column}`).toBeNull()
      expect(row.derivation['plant-manager-persona'], row.id).not.toBeNull()
      expect(row.derivation['implementation-team'], row.id).not.toBeNull()
    }
  })

  it('transcribes the grant-holder’s row-1 cell in the card’s own words', () => {
    expect(stu06Row('create-a-block-within-a-workflow').cells['supervisor-with-authoring-grant'].note)
      .toBe('Allowed — create and apply Shared Instruction Blocks')
  })

  it('refuses row 5 in every one of the eight columns, the Quality Manager included', () => {
    const row = stu06Row('reuse-a-block-in-another-workflow')
    for (const column of STUDIO_PERSONA_COLUMNS) {
      expect(row.cells[column].outcome, column).toBe('explicitlyProhibited')
    }
    expect(row.cells['quality-manager'].note).toBe(
      'Explicitly prohibited — blocks are scoped to a single Workflow',
    )
  })

  it('keeps the one Worker cell that explains itself, and it is a cross-surface statement', () => {
    const row = stu06Row('read-a-block-on-published-content')
    expect(row.cells.worker.note).toBe(
      'Explicitly prohibited — workers meet the rendered result on the device, not the block',
    )
    // The only Worker cell on this surface carrying an explanation: the other
    // five say the bare token.
    const explained = STU_06_MATRIX.filter((r) => r.cells.worker.note !== 'Explicitly prohibited')
    expect(explained.map((r) => r.id)).toEqual(['read-a-block-on-published-content'])
  })

  it('leaves DEC-AUDSTU-001 unanswered on the Read-only Auditor’s read cell', () => {
    const cell = stu06Row('read-a-block-on-published-content').cells['read-only-auditor']
    expect(cell.outcome).toBe('clientDecisionRequired')
    expect(cell.openDecision).toBe('DEC-AUDSTU-001')
  })

  it('derives module reach from the matrix, and the Worker is withheld', () => {
    const reach = reachByStudioMatrix(STU_06_MATRIX, (row, persona) => row.cells[persona].outcome)
    expect(reach).toEqual({
      'quality-manager': 'offered',
      'supervisor-with-authoring-grant': 'offered',
      'supervisor-without-grant': 'offered',
      'plant-manager-persona': 'offered',
      'tenant-admin': 'offered',
      'read-only-auditor': 'client-decision-open',
      worker: 'withheld',
      'implementation-team': 'offered',
    })
  })

  it('returns a refusing row rather than throwing for an unregistered id', () => {
    const missing = stu06Row('not-a-capability' as Stu06CapabilityId)
    for (const column of STUDIO_PERSONA_COLUMNS) {
      expect(missing.cells[column].outcome).toBe('explicitlyProhibited')
    }
  })
})

/* ==================================================================== *
 * STEP 6 — THE BLOCK-REFERENCE ELEMENT OF PUBLISH CHECK 7.
 * ==================================================================== */

describe('publish check 7 — the block-reference element', () => {
  it('is registered by MOD-STU-06, which check 7 names as a co-owner', () => {
    expect(publishCheckById('library-pointer').ownerModules).toContain('MOD-STU-06')
    const result = registerPublishChecks(createPublishCheckRegister(), blockReferencePublishCheck)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(registeredOwners(result.register).get('library-pointer')).toBe('MOD-STU-06')
  })

  it('passes a scope whose every application resolves, and BLOCKS one that does not', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    expect(blockReferencePublishCheck.run({ scope: s })).toEqual({ outcome: 'passed' })

    // The screen was removed from the canvas; the block still applies to it.
    const dangling: WorkflowBlockScope = {
      ...s,
      screens: s.screens.filter((screen) => screen.id !== 'SCR-TORQUE-05'),
    }
    const verdict = blockReferencePublishCheck.run({ scope: dangling })
    expect(verdict.outcome).toBe('blocked')
    if (verdict.outcome !== 'blocked') return
    // NAMES the screen AND the block title, which is what the check's own
    // `namesElement` asks for.
    expect(verdict.blockingElement).toContain('SCR-TORQUE-05')
    expect(verdict.blockingElement).toContain('Bolt Torque Procedure')
  })

  it('refuses publication through the real evaluator, not only in isolation', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    const registered = registerPublishChecks(createPublishCheckRegister(), blockReferencePublishCheck)
    expect(registered.ok).toBe(true)
    if (!registered.ok) return
    const dangling: WorkflowBlockScope = {
      ...s,
      screens: s.screens.filter((screen) => screen.id !== 'SCR-TORQUE-05'),
    }
    const evaluation = evaluatePublish(registered.register, { scope: dangling })
    expect(evaluation.blocked).toBe(true)
    const mine = evaluation.blockers.find((b) => b.checkId === 'library-pointer')
    expect(mine?.kind).toBe('failed')
    expect(mine?.blockingElement).toContain('Bolt Torque Procedure')
  })
})

/* ==================================================================== *
 * AC-STU-066 — A BLOCK APPEARS NOWHERE IN THE CONTENT LIBRARIES.
 * ==================================================================== */

describe('AC-STU-066 — blocks are not Content Library items', () => {
  it('is not reachable through MOD-STU-07 by id, in any of its three libraries', () => {
    const blockIds = blocksVisibleIn(SEEDED_BLOCK_REGISTER, WF_TORQUE).map((b) => b.id)
    expect(blockIds.length).toBeGreaterThan(0)
    expect(LIBRARY_IDS).toHaveLength(3)
    for (const id of blockIds) expect(itemById(SEEDED_LIBRARY_REGISTER, id)).toBeUndefined()
    for (const library of LIBRARY_IDS) {
      const items = itemsInLibrary(SEEDED_LIBRARY_REGISTER, library)
      expect(items.length, library).toBeGreaterThan(0)
      for (const id of blockIds) expect(items.map((i) => i.id), library).not.toContain(id)
    }
    // No screen pointer slot names a block either: a screen holds a pointer
    // at a LIBRARY item, and a block is applied rather than pointed at.
    expect([...POINTER_SLOTS].join(' ')).not.toMatch(/block/i)
  })

  it('does not render a block title on any Content Libraries tab, though the block editor does', () => {
    const title = 'Bolt Torque Procedure'
    // POSITIVE CONTROL FIRST. The same string IS found where it belongs, so
    // the three absences below cannot be satisfied by a typo.
    expect(editorMarkup()).toContain(title)
    for (const library of LIBRARY_IDS) {
      const html = renderToStaticMarkup(
        createElement(ContentLibrariesView, {
          scenario: libraryScenario(),
          activeTab: library,
          register: SEEDED_LIBRARY_REGISTER,
        }),
      )
      expect(html.length, library).toBeGreaterThan(500)
      expect(html, library).not.toContain(title)
    }
  })
})

/* ==================================================================== *
 * THE RENDERING RULE — ONE ACCESS CALL PER CONTROL, OVER ITS OWN ROW.
 * ==================================================================== */

describe('the affordance for each control', () => {
  it('enables every authoring control for the Quality Manager', () => {
    const controls = blockControls(scenario({ persona: 'quality-manager' }))
    expect(controls).toHaveLength(4)
    for (const control of controls) expect(control.affordance.kind, control.id).toBe('enabled')
  })

  it('renders nothing at all for a Supervisor without the grant, and says why', () => {
    const controls = blockControls(scenario({ persona: 'supervisor-without-grant' }))
    expect(controls).toHaveLength(4)
    for (const control of controls) {
      expect(control.affordance.kind, control.id).toBe('absent')
      if (control.affordance.kind !== 'absent') continue
      expect(control.affordance.note).not.toBe('')
    }
  })

  it('renders row 5 ABSENT for every one of the eight personas — it routes nobody anywhere', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const decision = decisionForRow(stu06Row('reuse-a-block-in-another-workflow'), scenario({ persona }))
      expect(decision.outcome, persona).toBe('explicitlyProhibited')
    }
    // And no control is drawn for it anywhere: a disabled control would
    // imply a condition that could one day become true.
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const ids = blockControls(scenario({ persona })).map((c) => c.id)
      expect(ids, persona).not.toContain('reuse-a-block-in-another-workflow')
    }
  })

  it('disables a revoked grant-holder’s controls with the grant named, rather than hiding them', () => {
    const revoked: Partial<Stu06Scenario> = {
      persona: 'supervisor-with-authoring-grant',
      authoringGrant: 'Revoked',
    }
    const controls = blockControls(scenario(revoked))
    for (const control of controls) {
      expect(control.affordance.kind, control.id).toBe('disabled')
      if (control.affordance.kind !== 'disabled') continue
      expect(control.affordance.reason).toMatch(/GRANT-STU-AUTHOR/)
    }
  })
})

/* ==================================================================== *
 * SB-STU-09 — THE BLOCK EDITOR.
 * ==================================================================== */

function editorMarkup(over: Partial<Stu06Scenario> = {}, workflowId: string = WF_TORQUE): string {
  return renderToStaticMarkup(
    createElement(BlockEditorView, {
      scenario: scenario(over),
      register: SEEDED_BLOCK_REGISTER,
      workflowId,
    }),
  )
}

describe('SB-STU-09 — the block editor panel', () => {
  it('lists every block in this Workflow with its title, applying-screen count and coverage state', () => {
    const html = editorMarkup()
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    expect(s.blocks).toHaveLength(2)
    for (const block of s.blocks) expect(html).toContain(block.title)
    expect(html).toContain('8 applying screens')
    expect(html).toContain('no applying screens')
    // Coverage state, not merely a tick: the missing pairs are named.
    expect(html).toContain('Spanish · standard')
  })

  it('states the scoping rule prominently, in the storyboard’s own words', () => {
    expect(editorMarkup()).toContain(SCOPE_NOTICE)
  })

  it('names every applying screen on the disabled delete control', () => {
    const html = editorMarkup()
    const names = applyingScreens(scope(SEEDED_BLOCK_REGISTER, WF_TORQUE), TORQUE_BLOCK).map(
      (screen) => screen.name,
    )
    expect(names).toHaveLength(8)
    for (const name of names) expect(html).toContain(name)
  })

  it('reports the unused block without suggesting it blocks submission', () => {
    const html = editorMarkup()
    expect(html).toContain('Retired hoist advisory')
    expect(html).toMatch(/does not block/i)
  })

  it('says a block edit reaches the floor only through a new published version', () => {
    const html = editorMarkup()
    expect(html).toContain('new published version and its adoption')
    expect(html).toMatch(/no propagation occurs to a pinned package/i)
  })

  it('suggests live propagation nowhere, for any persona', () => {
    for (const persona of STUDIO_PERSONA_COLUMNS) {
      const text = editorMarkup({ persona }).replace(/<[^>]*>/g, ' ')
      expect(suggestsLivePropagation(text), persona).toBe(false)
    }
  })

  it('renders the empty state for a Workflow that holds no block, never a blank panel', () => {
    const html = editorMarkup({}, WF_INSPECTION)
    expect(html).toContain(SCOPE_NOTICE)
    expect(html).toMatch(/no shared instruction block/i)
  })

  it('renders a declared absence for a Workflow this register does not hold', () => {
    const html = editorMarkup({}, 'WF-NOT-HELD')
    expect(html).toMatch(/WF-NOT-HELD/)
    expect(html).not.toContain('Bolt Torque Procedure')
  })
})

/* ==================================================================== *
 * THE ROUTE.
 * ==================================================================== */

describe('the instruction-blocks route', () => {
  it('is keyed on the module slug and annotates SCR-STU-05, never routing on a screen id', () => {
    const module = stuModuleById(STU_MODULES, 'MOD-STU-06')
    expect(module.slug).toBe('instruction-blocks')
    expect(stuScreensForModule(STU_SCREENS, 'MOD-STU-06').map((s) => s.id)).toEqual(['SCR-STU-05'])
  })

  it('renders under the Studio shell, carrying the scoping rule and the propagation notice', () => {
    const html = renderToStaticMarkup(createElement(InstructionBlocksScreen))
    expect(html).toContain(SCOPE_NOTICE)
    expect(html).toContain('new published version and its adoption')
    expect(html).toContain('SCR-STU-05')
    expect(suggestsLivePropagation(html.replace(/<[^>]*>/g, ' '))).toBe(false)
  })
})

/* ==================================================================== *
 * SCOPE IS ENFORCED IN WHAT THE SCREEN READS, NOT IN WHAT IT DRAWS.
 * ==================================================================== */

describe('the read scope', () => {
  it('gives an authoring persona every block, drafts included', () => {
    const read = readableBlocks(scenario({ persona: 'quality-manager' }), scope(SEEDED_BLOCK_REGISTER, WF_TORQUE))
    expect(read.blocks).toHaveLength(2)
    expect(read.withheldCount).toBe(0)
    expect(read.withheldReason).toBeNull()
  })

  it('withholds the DRAFT from a persona who may read published content only, and names why', () => {
    const s = scope(SEEDED_BLOCK_REGISTER, WF_TORQUE)
    const read = readableBlocks(scenario({ persona: 'tenant-admin' }), s)
    expect(read.blocks.map((b) => b.title)).toEqual(['Bolt Torque Procedure'])
    expect(read.withheldCount).toBe(1)
    expect(read.withheldReason).not.toBeNull()
    expect(read.withheldReason).toMatch(/not read here rather than read and then hidden/i)
    // The draft never reaches the component at all.
    expect(editorMarkup({ persona: 'tenant-admin' })).not.toContain('Retired hoist advisory')
    // POSITIVE CONTROL on the same string and the same view.
    expect(editorMarkup({ persona: 'quality-manager' })).toContain('Retired hoist advisory')
  })

  it('reads nothing at all for the Worker, who meets the rendered result on the device', () => {
    const read = readableBlocks(scenario({ persona: 'worker' }), scope(SEEDED_BLOCK_REGISTER, WF_TORQUE))
    expect(read.blocks).toEqual([])
    expect(read.withheldCount).toBe(2)
    expect(editorMarkup({ persona: 'worker' })).not.toContain('Bolt Torque Procedure')
  })

  it('holds the Read-only Auditor’s answer open rather than guessing it', () => {
    const read = readableBlocks(scenario({ persona: 'read-only-auditor' }), scope(SEEDED_BLOCK_REGISTER, WF_TORQUE))
    expect(read.blocks).toEqual([])
    expect(read.withheldReason).toMatch(/DEC-AUDSTU-001/)
  })
})

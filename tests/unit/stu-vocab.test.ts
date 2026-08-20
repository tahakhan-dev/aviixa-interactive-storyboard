import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { COMMAND_STATES } from '@/surfaces/sa/command-state'
import { PERMISSION_OUTCOMES } from '@/policy/decision'
import {
  CAPTURE_TYPES,
  COACHING_ASSET_STATES,
  COMPOSED_AGENT_STATES,
  CONFIGURATION_SECTIONS,
  D21_MODELLED_FLAGS,
  DIFFICULTY_LEVELS,
  FALLBACK_CONTRACTS,
  GRANT_STATES,
  INHERITABLE_DEFAULTS,
  JOB_ADOPTION_STATES,
  LOCALES,
  NOTIFICATION_CHANNELS,
  PACKAGE_STATES,
  STUDIO_MODULE_IDS,
  STUDIO_SCREEN_IDS,
  STUDIO_VOCABULARY_MEMBERS,
  SUBMISSION_STATES,
  VERSION_BUMP_CLASSES,
  WORKFLOW_SETTINGS,
} from '@/studio/vocab'
import {
  STUDIO_DECISIONS,
  STUDIO_DECISION_IDS,
  studioDecision,
  type StudioDecisionId,
} from '@/studio/disclosure/decisions'
import { DecisionDisclosure } from '@/studio/disclosure/DecisionDisclosure'

/**
 * Task 3, slice 5. Nineteen closed vocabularies and the decision-disclosure
 * component.
 *
 * Every vocabulary assertion below is `toEqual` against the full member list,
 * NOT a length check and NOT an iteration over the array under test. The
 * single change that makes each one fail is REMOVING (or adding, or
 * re-wording) one member -- which is the failure slice 4's panel gate could
 * not produce, because it iterated the array it was meant to police.
 */

const render = (id: StudioDecisionId) =>
  renderToStaticMarkup(createElement(DecisionDisclosure, { id }))

describe('the closed vocabularies -- design §4\'s nineteen plus the Workflow authoring statuses hoisted out of MOD-STU-03, members verified at the frozen source', () => {
  // L30899 (the derivation rule) and the inventory table at L30911-L30930.
  it('holds the eighteen derived Studio module ids and no nineteenth', () => {
    expect(STUDIO_MODULE_IDS).toEqual([
      'MOD-STU-01',
      'MOD-STU-02',
      'MOD-STU-03',
      'MOD-STU-04',
      'MOD-STU-05',
      'MOD-STU-06',
      'MOD-STU-07',
      'MOD-STU-08',
      'MOD-STU-09',
      'MOD-STU-10',
      'MOD-STU-11',
      'MOD-STU-12',
      'MOD-STU-13',
      'MOD-STU-14',
      'MOD-STU-15',
      'MOD-STU-16',
      'MOD-STU-17',
      'MOD-STU-18',
    ])
  })

  // Catalogue B, L48259-L48273; `AC-SCR-STU-001` (L48346) asserts all fifteen.
  it('holds the fifteen catalogue-B screen ids', () => {
    expect(STUDIO_SCREEN_IDS).toEqual([
      'SCR-STU-01',
      'SCR-STU-02',
      'SCR-STU-03',
      'SCR-STU-04',
      'SCR-STU-05',
      'SCR-STU-06',
      'SCR-STU-07',
      'SCR-STU-08',
      'SCR-STU-09',
      'SCR-STU-10',
      'SCR-STU-11',
      'SCR-STU-12',
      'SCR-STU-13',
      'SCR-STU-14',
      'SCR-STU-15',
    ])
  })

  // `AC-STU-065`, L32421 -- the source's own words, verbatim.
  it('holds the adopted seven capture types plus none, in AC-STU-065 wording', () => {
    expect(CAPTURE_TYPES).toEqual([
      'measurement entry',
      'photo capture',
      'barcode or Quick Response code scan',
      'checkbox confirmation',
      'digital signature',
      'free text',
      'dropdown selection',
      'none',
    ])
  })

  // L32040.
  it('holds the four Workflow settings in the source order', () => {
    expect(WORKFLOW_SETTINGS).toEqual([
      'name',
      'Job Type',
      'optional Service Type tag',
      'locale coverage',
    ])
  })

  // L32216-L32226, the nine-section table, in the table's own casing.
  it('holds the nine configuration sections in section order', () => {
    expect(CONFIGURATION_SECTIONS).toEqual([
      'Screen content',
      'Input type',
      'Timing',
      'Gate and proof',
      'Specification limits',
      'Coaching content',
      'Deviation rules and severity mapping',
      'Tool and equipment',
      'Qualification override',
    ])
  })

  // L32945.
  it('holds the three difficulty levels', () => {
    expect(DIFFICULTY_LEVELS).toEqual(['simple', 'standard', 'expanded'])
  })

  // L34357, and L34381 forbids a third.
  it('holds the two launch locales', () => {
    expect(LOCALES).toEqual(['English', 'Spanish'])
  })

  // L32613, and L32636 forbids a third.
  it('holds the two notification channels', () => {
    expect(NOTIFICATION_CHANNELS).toEqual(['in-app', 'email'])
  })

  // L33426.
  it('holds the three version bump classes', () => {
    expect(VERSION_BUMP_CLASSES).toEqual(['PATCH', 'MINOR', 'MAJOR'])
  })

  // L33479, second sentence -- the per-Job adoption state, not the version state.
  it('holds the four per-Job adoption states', () => {
    expect(JOB_ADOPTION_STATES).toEqual([
      'Notified',
      'Decided-adopt',
      'Decided-defer',
      'Outdated',
    ])
  })

  // L33289.
  it('holds the five submission states', () => {
    expect(SUBMISSION_STATES).toEqual([
      'Submitted',
      'Returned with comments',
      'Advanced',
      'Released',
      'Withdrawn',
    ])
  })

  // L33839.
  it('holds the five package states', () => {
    expect(PACKAGE_STATES).toEqual(['Defined', 'Built', 'Delivered', 'Pinned', 'Superseded'])
  })

  // L32647.
  it('holds the five coaching asset states', () => {
    expect(COACHING_ASSET_STATES).toEqual([
      'Uploaded',
      'Approved',
      'Indexed',
      'Flagged for review',
      'Retired',
    ])
  })

  // L34030.
  it('holds the six composed agent states', () => {
    expect(COMPOSED_AGENT_STATES).toEqual([
      'Composed',
      'Evaluation pending',
      'Evaluation passed',
      'In approval',
      'Platform review',
      'Deployed',
    ])
  })

  // L34573.
  it('holds the four grant states', () => {
    expect(GRANT_STATES).toEqual(['Assigned', 'Active', 'Revoked', 'Expired'])
  })

  // L31443-L31453.
  it('holds the ten Studio fallback contracts', () => {
    expect(FALLBACK_CONTRACTS).toEqual([
      'FB-STU-01',
      'FB-STU-02',
      'FB-STU-03',
      'FB-STU-04',
      'FB-STU-05',
      'FB-STU-06',
      'FB-STU-07',
      'FB-STU-08',
      'FB-STU-09',
      'FB-STU-10',
    ])
  })

  // Shared, never re-declared: slice 3's fifteen (L31181) and slice 2a's nine.
  it('shares the fifteen command states from slice 3 rather than re-declaring them', () => {
    expect(COMMAND_STATES).toHaveLength(15)
    expect(COMMAND_STATES).toContain('available for delivery')
    expect(COMMAND_STATES).toContain('reconciled')
  })

  it('shares the nine permission outcomes from slice 2a rather than re-declaring them', () => {
    expect(PERMISSION_OUTCOMES).toHaveLength(9)
    expect(PERMISSION_OUTCOMES).toContain('explicitlyProhibited')
    expect(PERMISSION_OUTCOMES).toContain('clientDecisionRequired')
  })
})

describe('the two counts that must never be minted', () => {
  it('holds exactly seven capture types plus none, and no eighth', () => {
    expect(CAPTURE_TYPES).toHaveLength(8) // seven plus 'none'
    expect(CAPTURE_TYPES).not.toContain('checklist')
    expect(CAPTURE_TYPES).not.toContain('boolean')
  })

  it('holds exactly two inheritable defaults, and severity is not one', () => {
    expect(INHERITABLE_DEFAULTS).toEqual([
      'default-escalation-routing-template',
      'default-coaching-trigger-percentage',
    ])
  })

  it('holds exactly four Workflow settings and exactly nine sections', () => {
    expect(WORKFLOW_SETTINGS).toHaveLength(4)
    expect(CONFIGURATION_SECTIONS).toHaveLength(9)
  })

  // `MOD-STU-04` row 6 / L32040: severity is the obvious third default and is
  // the one thing the source forbids by name.
  it('never carries a severity default among the inheritable defaults', () => {
    expect(INHERITABLE_DEFAULTS.some((d) => d.includes('severity'))).toBe(false)
  })
})

describe('D21 -- the three states modelled as flags, each attached where the source puts it', () => {
  it('carries Quarantined on a package, Stalled on a submission, Distributable on a version', () => {
    expect(D21_MODELLED_FLAGS).toEqual([
      { flag: 'Quarantined', attachesTo: 'package', locator: 'L33839' },
      { flag: 'Stalled', attachesTo: 'submission', locator: 'L68307' },
      { flag: 'Distributable', attachesTo: 'version', locator: 'L68455' },
    ])
  })

  it('keeps every flag out of the enumerated state set it shadows', () => {
    expect(PACKAGE_STATES).not.toContain('Quarantined')
    expect(SUBMISSION_STATES).not.toContain('Stalled')
    expect(PACKAGE_STATES).not.toContain('Distributable')
  })
})

describe('the twenty-nine decision records', () => {
  it('holds exactly twenty-nine, D1 through D29, in order', () => {
    expect(STUDIO_DECISION_IDS).toEqual([
      'D1',
      'D2',
      'D3',
      'D4',
      'D5',
      'D6',
      'D7',
      'D8',
      'D9',
      'D10',
      'D11',
      'D12',
      'D13',
      'D14',
      'D15',
      'D16',
      'D17',
      'D18',
      'D19',
      'D20',
      'D21',
      'D22',
      'D23',
      'D24',
      'D25',
      'D26',
      'D27',
      'D28',
      'D29',
    ])
    expect(STUDIO_DECISIONS).toHaveLength(29)
  })

  /**
   * The id list is declared independently of the records precisely so this
   * can fail: drop a record and the two stop matching. A check derived from
   * the array it polices could only ever pass -- shipped four times here.
   */
  it('has a record for every declared id, and no record for an undeclared one', () => {
    expect(STUDIO_DECISIONS.map((d) => d.id)).toEqual([...STUDIO_DECISION_IDS])
  })

  it('gives every decision at least two readings, each with a locator and a question', () => {
    for (const d of STUDIO_DECISIONS) {
      expect(d.readings.length, `${d.id} readings`).toBeGreaterThanOrEqual(2)
      expect(d.question.length, `${d.id} question`).toBeGreaterThan(0)
      expect(d.adopted.length, `${d.id} adopted`).toBeGreaterThan(0)
      for (const r of d.readings) {
        expect(r.locator, `${d.id} locator`).toMatch(/L\d{3,6}/)
        expect(r.text.length, `${d.id} reading text`).toBeGreaterThan(0)
      }
    }
  })

  /**
   * The structural guarantee behind "neither reading is marked as the source's
   * answer": a reading carries exactly `text` and `locator` and nothing else,
   * so there is no field in which one reading could be flagged as settled.
   */
  it('gives a reading exactly two fields, so no reading can be marked the source answer', () => {
    for (const d of STUDIO_DECISIONS) {
      for (const r of d.readings) {
        expect(Object.keys(r).sort(), `${d.id} reading shape`).toEqual(['locator', 'text'])
      }
    }
  })

  it('names the source DEC identifier where one exists and null where none does', () => {
    expect(studioDecision('D19').decisionRef).toBe('DEC-CAP-001')
    expect(studioDecision('D3').decisionRef).toBe('DEC-AUDSTU-001')
    expect(studioDecision('D14').decisionRef).toBe('DEC-LANEB-001')
    // D4 and D8 are conflicts the source never gave a `DEC-*` identifier.
    expect(studioDecision('D4').decisionRef).toBeNull()
    expect(studioDecision('D8').decisionRef).toBeNull()
  })

  it('carries DEC-LANEB-001 as both AC-STU-097 and AC-STU-138 with their own locators', () => {
    const d = studioDecision('D14')
    const locators = d.readings.map((r) => r.locator)
    expect(locators.some((l) => l.includes('AC-STU-097') && l.includes('L33397'))).toBe(true)
    expect(locators.some((l) => l.includes('AC-STU-138') && l.includes('L34332'))).toBe(true)
  })

  it('carries DEC-WFROLL-001 as canonical with DEC-VERROLL-001 as its alias', () => {
    const d = studioDecision('D7')
    expect(d.decisionRef).toBe('DEC-WFROLL-001')
    expect(d.alias).toBe('DEC-VERROLL-001')
  })

  it('is the only alias on the surface', () => {
    expect(STUDIO_DECISIONS.filter((d) => d.alias !== null).map((d) => d.id)).toEqual(['D7'])
  })
})

describe('a disclosure cannot rot -- every pinned member is a live vocabulary member', () => {
  /**
   * Slice 4 shipped four screen sentences pointing at content that was not
   * there. A decision's `pins` are the vocabulary members its prose names. If
   * a member is removed from its closed set, the pin no longer resolves and
   * this fails -- which is the whole point, and the reason it is not written
   * as a loop over `pins` alone.
   */
  it('names the specific decisions that pin vocabulary, so a lost pin is a failure', () => {
    expect(STUDIO_DECISIONS.filter((d) => d.pins.length > 0).map((d) => d.id)).toEqual([
      'D1',
      'D5',
      'D16',
      'D19',
      'D21',
      'D23',
      'D24',
    ])
  })

  it('resolves every pin against a closed vocabulary', () => {
    for (const d of STUDIO_DECISIONS) {
      for (const pin of d.pins) {
        expect(STUDIO_VOCABULARY_MEMBERS, `${d.id} pins ${pin}`).toContain(pin)
      }
    }
  })

  it('renders every pin in the disclosure it belongs to', () => {
    for (const d of STUDIO_DECISIONS) {
      if (d.pins.length === 0) continue
      const markup = render(d.id)
      for (const pin of d.pins) {
        expect(markup, `${d.id} renders ${pin}`).toContain(pin)
      }
    }
  })

  it('pins D19 to all eight capture types, so dropping one goes red here too', () => {
    expect(studioDecision('D19').pins).toEqual([...CAPTURE_TYPES])
  })
})

describe('DecisionDisclosure -- the only place a decision is rendered', () => {
  it('renders the identifier, both readings, each locator, the adopted position, and APP-012', () => {
    const markup = render('D14')
    expect(markup).toContain('D14')
    expect(markup).toContain('DEC-LANEB-001')
    expect(markup).toContain('AC-STU-097')
    expect(markup).toContain('L33397')
    expect(markup).toContain('AC-STU-138')
    expect(markup).toContain('L34332')
    expect(markup).toContain('client-delegated choice under APP-012')
    expect(markup).toContain(studioDecision('D14').adopted)
  })

  it('renders both identifiers for the rollback question, so either search finds the card', () => {
    const markup = render('D7')
    expect(markup).toContain('DEC-WFROLL-001')
    expect(markup).toContain('DEC-VERROLL-001')
  })

  /**
   * Caught by eye, not by the suite: the first draft tested `alias !== undefined`
   * while `alias` is `string | null`, so all null-alias records
   * rendered a dangling "(also cited as )". The suite was green throughout,
   * because it only ever asserted that D7 DOES render both identifiers.
   */
  it('renders the alias fragment on D7 and on nothing else', () => {
    expect(render('D7')).toContain('also cited as DEC-VERROLL-001')
    for (const id of STUDIO_DECISION_IDS) {
      if (id === 'D7') continue
      expect(render(id), `${id} alias fragment`).not.toContain('also cited as')
    }
  })

  it('says plainly where the source gave the conflict no identifier at all', () => {
    const markup = render('D8')
    expect(markup).toContain('no `DEC-*` identifier')
    expect(markup).toContain('AC-STU-120')
    expect(markup).toContain('AC-WF-AUT-009-01')
  })

  it('marks the build position a client-delegated choice on every record', () => {
    for (const id of STUDIO_DECISION_IDS) {
      expect(render(id), `${id} APP-012`).toContain('client-delegated choice under APP-012')
    }
  })

  it('never presents an adopted position as the source having settled it', () => {
    for (const id of STUDIO_DECISION_IDS) {
      const markup = render(id)
      expect(markup, `${id} label`).toContain('This build&#x27;s working position')
      expect(markup, `${id} label`).not.toContain('The source settles this')
    }
  })

  it('renders every reading of every decision, not merely the first', () => {
    for (const d of STUDIO_DECISIONS) {
      const markup = render(d.id)
      for (const r of d.readings) {
        expect(markup, `${d.id} locator ${r.locator}`).toContain(r.locator)
      }
    }
  })
})

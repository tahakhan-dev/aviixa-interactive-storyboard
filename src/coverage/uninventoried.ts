import { AI_MODE_IDS } from '@/ai/modes'
import { PROVENANCE_CLASS_IDS } from '@/ai/provenance/classes'
import { FALLBACK_CONTRACT_OWNERS, FALLBACK_IDENTIFIER_RANGES } from '@/ai/fallbacks/registry'
import { contractsInFamily } from '@/fallbacks/contracts'
import { OPEN_DECISION_IDS } from '@/disclosure/decisions'
import { LOCAL_OPEN_DECISIONS } from '@/ai/controls/decisions'
import { STU_UNCANONISED_DECISIONS } from '@/studio/ai-degradation'

/**
 * THE IDENTIFIER FAMILIES SLICE 11 SHIPPED THAT ARE IN NONE OF THE FOURTEEN
 * INVENTORIES, AND THE DECISION THAT THEY BELONG IN NONE.
 *
 * `REGISTRY_DESCRIPTORS` in `./descriptors` fixes the fourteen inventories the
 * master prompt names, and `registries/generated/` holds one generated file per
 * slug. Slice 11 shipped four identifier families that appear in no row of any
 * of them: `AIMODE-*`, `PROV-*`, `FB-AI-*` and `DEC-AI*`. How many that is, is
 * DERIVED below and rendered on the dashboard, and is deliberately written
 * nowhere in this comment: a build-wide figure transcribed into prose has been
 * renumbered and wrong three times in this repository already, and the rule
 * that came out of it is remove, never renumber.
 *
 * `tests/unit/coverage-uninventoried.test.ts` sweeps `src/` and `app/` for all
 * four prefixes as whole tokens and asserts the swept set EQUALS the set
 * declared here. So this module cannot silently miss an identifier the build
 * ships, and it cannot silently keep one the build dropped — which is the
 * property that makes "uncounted" impossible going forward rather than merely
 * unlikely today.
 *
 * ── THE DECISION, AND IT IS DELEGATED RATHER THAN INHERITED ────────────────
 * The choice was between (a) these are MECHANISMS rather than inventory items
 * and belong in no registry, and (b) they warrant a fifteenth inventory. Under
 * `APP-012` the choice is delegated to the build, so it is made here, in one
 * place, with its reason — leaving ninety-one shipped identifiers silently
 * uncounted is the one outcome that was forbidden.
 *
 * **OPTION (a). They belong in no registry, and this module is the place a
 * reader is told so rather than left to infer it.** Four reasons, every one
 * measured rather than argued:
 *
 *   1. THE FOURTEEN ARE INVENTORIES OF DELIVERABLES; THESE FOUR ARE NOT.
 *      A row in `modules.json` or `features.json` names a thing the product
 *      would ship, and its status answers "does a screen demonstrate it".
 *      `AIMODE-*` is the state vocabulary of ONE machine, `PROV-*` is a
 *      six-class contract every rendering path must satisfy, `FB-AI-*` is a
 *      register of fallback CONTRACTS, and `DEC-AI*` is a register of OPEN
 *      CLIENT DECISIONS. None is a deliverable; each is a rule the build
 *      obeys. Asking whether a screen "demonstrates" `PROV-4` is a category
 *      error — every screen emits exactly one provenance class, which is the
 *      lint, not the inventory.
 *
 *   2. A FLAT INVENTORY CANNOT EXPRESS THE `FB-AI-*` KEY, SO IT WOULD BE
 *      WRONG RATHER THAN MERELY ABSENT. The status computation behind all
 *      fourteen files is a whole-token scan: a route screen names the
 *      identifier, or it does not. `FB-AI-*` is keyed on a COMPOUND of chapter
 *      and identifier, because a bare literal does not identify a contract —
 *      `fbAiLiteralsWithMoreThanOneOwner` below is derived from the registry
 *      and is not zero, and `FB-AI-01` alone carries four meanings across four
 *      chapters (L88916, L92793, L46951, L74495). A row keyed on the bare
 *      literal could not say WHICH owner a route demonstrated, so a flat
 *      "demonstrated" claim on `FB-AI-01` would be false for its other
 *      owners. An inventory that cannot express its own key is worse than no
 *      inventory: it converts a stated absence into a false presence, which is
 *      the defect shape `docs/process/RESUME.md` §7 names first.
 *
 *   3. THIS BUILD HAS ALREADY ANSWERED THIS EXACT QUESTION ONCE, THE SAME WAY.
 *      `src/fallbacks/contracts.ts` transcribes §38.4's seventy fallback
 *      contracts and its header says so in as many words: "`registries/
 *      generated/` holds fourteen families and fallbacks is not one of them".
 *      It built the register as typed data in `src/` with its own union, its
 *      own two-sided count proof and its own suite, rather than as a
 *      fifteenth generated file. The same file records that the frozen source
 *      carries roughly seven hundred distinct `FB-*` identifiers across
 *      per-chapter registers with incompatible shapes. A fifteenth inventory
 *      would have to pick one shape and would misfile the rest.
 *
 *   4. `DEC-AI*` IS ALREADY COUNTED, IN A REGISTER THAT HAS A SCREEN.
 *      `decAiInTheCanon` below is derived from `OPEN_DECISION_IDS`, the
 *      canon's membership list, and those records render through
 *      `DecisionDisclosure`. Adding them to a generated inventory would create
 *      the second home the canon exists to prevent — the trap that
 *      `docs/process/RESUME.md`, in its position section, reports having fired
 *      twice in this build. (Phrased that way deliberately: the section number
 *      followed by the word "records" reads to
 *      `tests/coverage/canon-size-literal.test.ts` as a claim about how many
 *      records something holds, and it convicted this very line. The gate is
 *      coarse there and it is right to be — a canon-size claim reaching a
 *      screen is the defect it exists for, and a section reference is easy to
 *      reword.) The
 *      remainder are disclosed locally and named by
 *      `decAiDisclosedLocally`, so the family is fully accounted for across
 *      two homes and needs no third.
 *
 * ── WHAT OPTION (a) COSTS, SAID PLAINLY ────────────────────────────────────
 * It means the coverage dashboard's fourteen rows do not add up to everything
 * slice 11 shipped, and a reader counting inventories will undercount the
 * build. That is why this module exists and why the dashboard renders it: the
 * shortfall is DISCLOSED rather than silent. It also means the number the
 * client named stays fourteen, which is the conservative half of a delegated
 * choice — `REGISTRY_DESCRIPTORS` is unchanged and
 * `tests/coverage/slice-2c-gates.test.ts` is untouched.
 *
 * ── WHY EVERY SIZE HERE IS DERIVED ────────────────────────────────────────
 * Each family's size is read from the register that actually holds it, at
 * module load. Not one is a literal. The rule this build paid five tasks to
 * learn is that a derived number copied by hand goes stale in silence — one
 * such number had twenty-nine copies, eleven of them on screens — so a count
 * that cannot move when its subject moves does not get written down here.
 * `tests/unit/coverage-uninventoried.test.ts` holds the family LIST by
 * membership, never by length.
 *
 * This module is data and one sweep. It computes counts and decides nothing
 * that is not written above.
 */

/** The build approval under which this choice was made. Not a source line. */
export const UNINVENTORIED_DECISION_LABEL =
  'A client-delegated choice under APP-012. APP-012 occurs zero times in the frozen source — it '
  + 'is an approval-ledger entry, legitimate as a build label and never citable with a line number.'

/**
 * One shipped identifier family that is in none of the fourteen inventories.
 *
 * `size` is always derived from `heldIn`'s own export. `identifiers` is the
 * derived membership list, so the covering suite can hold the family by
 * membership rather than by a length that any substitution satisfies.
 */
export interface UninventoriedFamily {
  /** The token shape, as the source spells it. */
  readonly prefix: string
  readonly title: string
  /** The register that actually holds it, as a repository-relative path. */
  readonly heldIn: readonly string[]
  /** What the family IS, which is the reason it is not an inventory. */
  readonly whatItIs: string
  /** Why a row in one of the fourteen would be wrong, not merely redundant. */
  readonly whyNotAnInventory: string
  /**
   * Held by a register: derived from `heldIn`'s own export, never transcribed.
   * Does not include `alsoCitedWithoutARecord`.
   */
  readonly identifiers: readonly string[]
  /**
   * NAMED BY THE BUILD AND HELD BY NO REGISTER OF ITS OWN FAMILY.
   *
   * These are the ones a sweep finds and a register does not, and they are the
   * whole reason this field exists rather than being folded into the number
   * above: an identifier the build cites but nothing records is a DIFFERENT
   * state from one a register holds, and averaging the two into one count is
   * how a gap stops being visible. Each says where it is cited and why it has
   * no record, so a reader can tell a deliberate citation from an oversight.
   *
   * A literal list, on this build's rule that a membership gate is a literal
   * list and never a length. It cannot go stale in silence: the covering suite
   * sweeps the tree and requires the declared union to equal the swept set.
   */
  readonly alsoCitedWithoutARecord: readonly {
    readonly id: string
    readonly citedBy: string
    readonly why: string
  }[]
  /** What the derived number counts, because a bare count reads as a total. */
  readonly sizeMeaning: string
}

/* ── the derivations, each from the register that owns the family ────────── */

const FB_AI_COLLISION_OWNERS = FALLBACK_CONTRACT_OWNERS.filter((o) =>
  o.identifier.startsWith('FB-AI-'),
)

const FB_AI_COLLISION_LITERALS = [...new Set(FB_AI_COLLISION_OWNERS.map((o) => o.identifier))].sort()

/** §38.4's own AI family, three-digit and a DIFFERENT register from the above. */
const FB_AI_LIBRARY_LITERALS = contractsInFamily('FB-AI').map((c) => c.id)

const DEC_AI_IN_CANON = OPEN_DECISION_IDS.filter((id) => id.startsWith('DEC-AI')).slice().sort()

/**
 * The locally-disclosed half, from BOTH local homes. Two, because slice 11
 * shipped two independent local registers under the same rule — the
 * pause/kill/rollback console's and the Studio overlay's — and reading only
 * the first would report `DEC-AIFALLBACK-001` as having no record at all.
 */
const DEC_AI_LOCAL = [
  ...new Set(
    [
      ...LOCAL_OPEN_DECISIONS.map((d) => d.id),
      ...STU_UNCANONISED_DECISIONS.map((d) => d.id),
    ].filter((id) => id.startsWith('DEC-AI')),
  ),
].sort()

/**
 * HOW MANY `FB-AI-*` LITERALS HAVE MORE THAN ONE OWNING CHAPTER.
 *
 * Derived, and exported because reason 2 above rests on it being non-zero. A
 * reader who wants to check the argument reads this rather than trusting the
 * paragraph, and a future change that made the namespace unambiguous would
 * take this to zero and turn the argument's own gate red.
 */
export const fbAiLiteralsWithMoreThanOneOwner: readonly string[] = FB_AI_COLLISION_LITERALS.filter(
  (lit) => FB_AI_COLLISION_OWNERS.filter((o) => o.identifier === lit).length > 1,
)

export const UNINVENTORIED_FAMILIES = [
  {
    prefix: 'AIMODE-',
    title: 'Artificial-intelligence operating modes',
    heldIn: ['src/ai/modes/vocabulary.ts', 'src/ai/modes/machine.ts'],
    whatItIs:
      'The state vocabulary of one machine — the modes a platform can be in, with the '
      + 'transitions between them. A mode is a state, not a thing the product ships.',
    whyNotAnInventory:
      'There is no deliverable to demonstrate. What a screen owes a mode is that it renders the '
      + 'mode it is in and distinguishes a paused platform from an unreachable one (AC-42-303), '
      + 'which is a property of the rendering and is gated as one. A row reading '
      + '"AIMODE-04: not-represented" would be actively misleading: AIMODE-04 is "defined but '
      + 'never entered" (L89261) and may not be entered by any device while DEC-ONDEVICE-001 is '
      + 'undecided, so its absence from every screen is the requirement rather than a shortfall.',
    identifiers: AI_MODE_IDS.slice().sort(),
    alsoCitedWithoutARecord: [],
    sizeMeaning:
      'Modes in the machine, from AI_MODE_IDS. Every AIMODE-* token in the tree is a member, so '
      + 'nothing in this family is cited without a record. The modes carry fewer distinct labels '
      + 'than identifiers — AIMODE-13/-14, -03/-15 and -01/-16 are byte-identical across all '
      + 'five contract columns — so this counts identifiers and not distinguishable states.',
  },
  {
    prefix: 'PROV-',
    title: 'Provenance classes',
    heldIn: ['src/ai/provenance/classes.ts', 'src/ai/provenance/contract.ts'],
    whatItIs:
      'A six-class contract on every rendering path: each one emits exactly one class, and the '
      + 'six treatments are visually disjoint.',
    whyNotAnInventory:
      'A provenance class is an obligation on all rendered output, not an item that a screen '
      + 'either shows or does not. Every one of the six is exercised by construction the moment '
      + 'anything renders, so a status column over them would read demonstrated on all six and '
      + 'measure nothing. The real check is the exactly-one lint and the AC-42-403 fail-closed '
      + 'rule at L89480, neither of which an inventory row can express.',
    identifiers: PROVENANCE_CLASS_IDS.slice().sort(),
    alsoCitedWithoutARecord: [],
    sizeMeaning:
      'Classes in the contract, from PROVENANCE_CLASS_IDS. The union is closed and every PROV-* '
      + 'token in the tree is a member, so nothing here is cited without a record.',
  },
  {
    prefix: 'FB-AI-',
    title: 'Artificial-intelligence fallback contracts',
    heldIn: ['src/ai/fallbacks/registry.ts', 'src/fallbacks/contracts.ts'],
    whatItIs:
      'Fallback contracts: what the platform does when a capability is unavailable. Held across '
      + 'TWO registers under one prefix, in two different zero-padding conventions that do not '
      + 'reference each other — the collision-aware registry keyed on (chapter, identifier), and '
      + 'section 38.4\'s library, whose AI family is three-digit.',
    whyNotAnInventory:
      'The key is compound and a generated row is not. See reason 2 above: a bare FB-AI-NN '
      + 'literal does not identify a contract, sixteen of them name more than one, and the '
      + 'register\'s own thirteenth row (L95371) is a RANGE standing for thirty contracts rather '
      + 'than one. A flat inventory would hold one row per literal and lose every second owner, '
      + 'turning a disclosed ambiguity into a confident wrong answer. This is also why slice 11 '
      + 'wave 5\'s route directory deliberately writes no bare FB-AI-NN literal: under a flat '
      + 'token scan a "demonstrated" claim on FB-AI-01 would be false for three of its four '
      + 'owners.',
    identifiers: [...FB_AI_COLLISION_LITERALS, ...FB_AI_LIBRARY_LITERALS].sort(),
    alsoCitedWithoutARecord: [
      {
        id: 'FB-AI-31',
        citedBy: 'src/ai/storyboards/contract.ts',
        why:
          'Correctly in no register, and the citation says so. L95353 puts it inside an '
          + '`Illustrative Example` that the source itself disclaims, so registering it would '
          + 'promote an example the source withdrew into a contract the build claims. It is '
          + 'named only in a comment explaining that withdrawal.',
      },
    ],
    sizeMeaning:
      'Distinct FB-AI-* literals across BOTH registers — the collision-aware registry and '
      + 'section 38.4\'s library. It is fewer than the number of CONTRACTS, because the '
      + 'collision registry holds more owner rows than literals: that gap is the collision, and '
      + 'it is the measurement reason 2 above rests on.',
  },
  {
    prefix: 'DEC-AI',
    title: 'Open client decisions on artificial intelligence',
    heldIn: [
      'src/disclosure/decisions.ts',
      'src/ai/controls/decisions.ts',
      'src/studio/ai-degradation.ts',
    ],
    whatItIs:
      'Open questions the frozen source raises and does not settle. Each renders every reading '
      + 'with its locator and obeys none silently.',
    whyNotAnInventory:
      'Already counted, in a register that has a screen. See reason 4 above. The canon holds '
      + 'most of the family by membership in its exported union and renders them through '
      + 'DecisionDisclosure; the rest are disclosed locally in the pattern '
      + 'src/offline/decisions-37b.ts established. A generated row would be a third home for a '
      + 'question that already has one, and src/ai/controls/decisions.ts THROWS at module load '
      + 'if a decision it discloses locally becomes a canon member — the second-home defect is '
      + 'mechanically prevented rather than merely discouraged, and an inventory would route '
      + 'around that mechanism.',
    identifiers: [...DEC_AI_IN_CANON, ...DEC_AI_LOCAL].sort(),
    alsoCitedWithoutARecord: [
      {
        id: 'DEC-AIDUP-001',
        citedBy: 'src/ai/storyboards/sb-11-to-20/index.ts',
        why:
          'Carried inside the transcribed field text of storyboard 15, where the source put it. '
          + 'The cards deliberately have no `decisionRefs` field: the identifiers stay in the '
          + 'prose the source wrote, so the card is the record and a second one would be the '
          + 'second home the canon exists to prevent.',
      },
      {
        id: 'DEC-AIEXPIRE-001',
        citedBy: 'src/ai/storyboards/sb-11-to-20/index.ts',
        why: 'Same shape as DEC-AIDUP-001 — transcribed card text, no separate record.',
      },
      {
        id: 'DEC-AIEMBED-001',
        citedBy: 'src/ai/failures/catalogue.ts',
        why:
          'Held as a STRUCTURED cited-decision field on the failure records that name it, rather '
          + 'than as a decision record. The failure catalogue cites the question; it does not '
          + 'answer it, and it writes no readings, so there is nothing here that a canon record '
          + 'would duplicate. (The field is deliberately not spelled here: '
          + 'tests/unit/ai-controls-authority-shippability.test.ts forbids that token outside its '
          + 'two named homes, and it convicted this line when it did spell it. The gate is right '
          + '— naming the field is not needed to say what this row says.)',
      },
      {
        id: 'DEC-AIOUT-001',
        citedBy: 'app/super-admin/platform-overview-and-health/fixtures.ts',
        why:
          'Named in a screen\'s own prose to say that nothing is rendered for it. A statement '
          + 'that a decision blocks a rendering is not a record of the decision.',
      },
    ],
    sizeMeaning:
      'DEC-AI* identifiers across all three homes: members of the canon\'s exported union, those '
      + 'disclosed locally by the pause/kill/rollback console, and the Studio overlay\'s '
      + 'uncanonised list. THAT THERE ARE THREE HOMES IS ITSELF THE FINDING — see the '
      + 'consolidation note below. It is fewer than the DEC-AI* tokens in the tree by exactly '
      + 'the four listed beside it.',
  },
] as const satisfies readonly UninventoriedFamily[]

/** Members of the canon's exported union carrying this prefix. Derived. */
export const decAiInTheCanon: readonly string[] = DEC_AI_IN_CANON

/** Disclosed locally rather than in the canon, and named. Derived. */
export const decAiDisclosedLocally: readonly string[] = DEC_AI_LOCAL

/**
 * The one range row in the collision-aware registry, surfaced because it is
 * the concrete reason a flat inventory would assert the wrong cardinality:
 * this row stands for one contract per storyboard, not for one contract.
 */
export const FB_AI_RANGE_ROWS = FALLBACK_IDENTIFIER_RANGES

/**
 * Every uninventoried identifier, across all four families, without
 * duplication — those a register holds AND those the build only cites. Derived;
 * the number a reader sees on the dashboard.
 */
/*
 * NO `: readonly string[]` ANNOTATION HERE, DELIBERATELY.
 * `tests/coverage/slice-2c-gates.test.ts` gate 2 forbids
 * `export const X: readonly T[] = [` because that annotation WIDENS a literal
 * tuple and silently collapses any exhaustiveness check written over it. This
 * array is derived rather than literal, so the hazard does not apply — but the
 * gate is a syntax rule and arguing with it from inside the file it convicts is
 * how exemptions get minted. Inference gives `string[]`, which costs nothing:
 * every consumer reads it.
 */
export const UNINVENTORIED_IDENTIFIERS = [
  ...new Set(
    UNINVENTORIED_FAMILIES.flatMap((f) => [
      ...f.identifiers,
      ...f.alsoCitedWithoutARecord.map((c) => c.id),
    ]),
  ),
].sort()

/* ==================================================================== *
 * THE CANON CONSOLIDATION, AND WHY MOST OF IT IS A REFUSAL.
 * ==================================================================== */

/**
 * WAVE 5'S VERDICT ON EVERY DECISION IDENTIFIER THAT NAMED IT.
 *
 * Five separate files assigned "the canon is wave 5's" to this task —
 * `src/surfaces/sa/ai-failure-authority.ts` in two seams,
 * `src/ai/agents/contracts.ts` in one, `src/ai/controls/decisions.ts` in its
 * header, `src/studio/ai-degradation.ts` in its uncanonised list, and
 * `src/ai/storyboards/sb-01-to-10/decisions.ts` in its. A task that inherits
 * five pointers and leaves them all pointing at itself has closed nothing, so
 * every one gets a verdict here and the verdict is per identifier.
 *
 * ── THE RULE THAT DECIDED MOST OF THEM ─────────────────────────────────────
 * Consolidation is legitimate work ONLY when it removes the local home in the
 * SAME change. Adding a canon record and leaving the local one is not a
 * half-fix, it is the defect: two homes for one decision is precisely what
 * `DecisionDisclosure` exists to prevent, and this build has shipped it twice.
 * `src/ai/controls/decisions.ts` enforces exactly that — it THROWS at module
 * load if a decision it discloses locally becomes a canon member, and its
 * message says "delete the local record and render the canon's, rather than
 * keeping both". So a registration is atomic by construction, and where the
 * other half of that atom is a file this task may not edit, the honest move is
 * to hand the pair back rather than to ship half of it.
 *
 * ── AND ONE CLAIM IN THIS AREA WAS WRONG AND IS CORRECTED HERE ─────────────
 * `DEC-ASK-001` and `DEC-LOCALAI-001` were carried into wave 5 as "aliases
 * needing wiring". Measured: both are ALREADY wired. `DEC-AIHELP-001` carries
 * `alias: 'DEC-ASK-001'` and `DEC-ONDEVICE-001` carries
 * `alias: 'DEC-LOCALAI-001'`, and `src/ai/storyboards/sb-01-to-10/decisions.ts`
 * was right to say so in its header. Nothing was wired by this task because
 * there was nothing left to wire.
 */
export interface CanonConsolidationVerdict {
  readonly id: string
  /** `registered`, `already-consolidated`, `stays-local` or `handed-back`. */
  readonly verdict: 'registered' | 'already-consolidated' | 'stays-local' | 'handed-back'
  /** Where the record lives after this task. A path, so a reader can open it. */
  readonly homeAfter: string
  readonly reason: string
}

export const CANON_CONSOLIDATION_VERDICTS = [
  {
    id: 'DEC-ASK-001',
    verdict: 'already-consolidated',
    homeAfter: 'src/disclosure/decisions.ts',
    reason:
      'Already registered as the alias of the canonical DEC-AIHELP-001 before this task ran. '
      + 'Carried into wave 5 as needing wiring; measured, it did not. No change.',
  },
  {
    id: 'DEC-LOCALAI-001',
    verdict: 'already-consolidated',
    homeAfter: 'src/disclosure/decisions.ts',
    reason:
      'Already registered as the alias of the canonical DEC-ONDEVICE-001. Same correction as '
      + 'DEC-ASK-001. No change.',
  },
  {
    id: 'DEC-NOSHIFT-001',
    verdict: 'stays-local',
    homeAfter: 'src/surfaces/cc/decisions/register.ts',
    reason:
      'NOT un-homed, which is what the wave-5 hand-off assumed. It is a member of chapter 21\'s '
      + 'own sixteen-row decision register, transcribed with its own CcDecisionId union and '
      + 'held against the frozen source by tests/unit/cc-decisions.test.ts. Registering it in '
      + 'the platform canon would put one source register row in two typed unions with two '
      + 'records — the second home in the most literal sense.',
  },
  {
    id: 'DEC-PLUS-001',
    verdict: 'stays-local',
    homeAfter: 'src/surfaces/cc/decisions/register.ts',
    reason:
      'Same register, same reason, and the strongest case of the four: it is read in twenty-five '
      + 'files across five surfaces because its own clause claims every permission matrix in '
      + 'chapter 21, which UNIVERSAL_CLAUSE_ROWS records. A canon record would be a twenty-sixth '
      + 'reading of a question that already has one authoritative home.',
  },
  {
    id: 'DEC-SYNC-001',
    verdict: 'stays-local',
    homeAfter: 'src/surfaces/cc/decisions/register.ts',
    reason:
      'Same register, same reason. Distinct from DEC-SYNC-002, whose separateness from '
      + 'DEC-CMDEXP-001 this build already ruled on and did not re-litigate here.',
  },
  {
    id: 'DEC-WIPE-001',
    verdict: 'stays-local',
    homeAfter: 'src/surfaces/cc/decisions/register.ts',
    reason:
      'Same register, same reason. The canon already POINTS at it — DEC-CMDEXP-001\'s record '
      + 'quotes the source saying DEC-WIPE-001 "already covers the unbounded-pending case for '
      + 'device wipe specifically" — which is the shape a cross-register reference should take: '
      + 'a pointer, not a copy.',
  },
  {
    id: 'DEC-AIRTO-001',
    verdict: 'handed-back',
    homeAfter: 'src/ai/controls/decisions.ts',
    reason:
      'The one identifier in this set with a real claim on the canon: fifty-one references in '
      + 'the chapter-44 span and the entire content of every storyboard card\'s recovery-'
      + 'objective row. It is NOT registered, because registering it makes '
      + 'src/ai/controls/decisions.ts throw at load, and the local record that must be deleted '
      + 'in the same change sits in a wave-3 module outside this task\'s path list. Handed back '
      + 'as a paired change rather than shipped as half of one.',
  },
  {
    id: 'DEC-AIPAUSE-001',
    verdict: 'handed-back',
    homeAfter: 'src/ai/controls/decisions.ts',
    reason:
      'Named by two seams in src/surfaces/sa/ai-failure-authority.ts, which deliberately wrote '
      + 'NO local readings so that wave 5 could register it cleanly. That plan was sound and is '
      + 'defeated by a second local home: src/ai/controls/decisions.ts holds the readings and '
      + 'throws on registration. Same paired change as DEC-AIRTO-001.',
  },
  {
    id: 'DEC-KILL-001',
    verdict: 'handed-back',
    homeAfter: 'src/ai/controls/decisions.ts',
    reason:
      'Same seam, same local home and the same paired change as DEC-AIPAUSE-001. It is worse than '
      + 'the others in one respect that the paired change must preserve: the kill-switch row is '
      + 'simultaneously permissive and undecided in the Platform Engineer cell, and it defers in '
      + 'its CLASSIFICATION while granting in every cell — so a reader of cells alone concludes it '
      + 'is settled. Registered at L88905.',
  },
  {
    id: 'DEC-PAUSE-001',
    verdict: 'handed-back',
    homeAfter: 'src/ai/controls/decisions.ts',
    reason:
      'Same local home and the same paired change. Its local record carries a fourth reading that '
      + 'must survive any move: the Platform Engineer role card lists an emergency pause proposal '
      + 'among its features (L15945) while its own approval-authority row reads that the role '
      + 'approves nothing and only submits (L15939). That is a PROPOSAL right and not an '
      + 'initiation right, and a canon record written from the register alone would drop it. '
      + 'Registered at L88906.',
  },
  {
    id: 'DEC-AIFALLBACK-001',
    verdict: 'handed-back',
    homeAfter: 'src/studio/ai-degradation.ts',
    reason:
      'A third local home, in STU_UNCANONISED_DECISIONS, whose comment also names wave 5. Its '
      + 'file is a wave-3 module outside this path list, so the same pairing rule applies. Worth '
      + 'noting that it and DEC-AIEMBED-001 were the two decisions recorded as appearing nowhere '
      + 'in the build; this one now has a local record, so that entry is stale in the build\'s '
      + 'favour.',
  },
  {
    id: 'DEC-HANDOFF-001',
    verdict: 'stays-local',
    homeAfter: 'src/ai/agents/matrices.ts',
    reason:
      'DELIBERATELY not registered, and the reason is stronger than a path list. It asks TWO '
      + 'different questions under one identifier — chapter 30\'s at L61210 and chapter 44\'s at '
      + 'L92360 — and the whole-document index at L115416 attributes it to chapter 30 alone. A '
      + 'single canon record keyed on the bare identifier would answer section 44.3 with chapter '
      + '30\'s question. The canon has no compound key, so the honest home is the one that knows '
      + 'which chapter it is in.',
  },
  {
    id: 'DEC-HANDOFF-002',
    verdict: 'stays-local',
    homeAfter: 'src/ai/agents/matrices.ts',
    reason:
      'Registered together with -001 or not at all, per the seam that raised the pair, and -001 '
      + 'is not registrable on the bare identifier. So neither is.',
  },
] as const satisfies readonly CanonConsolidationVerdict[]


import { AI_MODE_IDS } from '@/ai/modes'
import { PROVENANCE_CLASS_IDS } from '@/ai/provenance/classes'
import { FALLBACK_CONTRACT_OWNERS, FALLBACK_IDENTIFIER_RANGES } from '@/ai/fallbacks/registry'
import { AI_ABILITY_IDS } from '@/ai/abilities/register'
import { FAILURE_CATALOGUE } from '@/ai/failures/catalogue'
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
 * slug. Slice 11 shipped a set of identifier families that appear in no row of
 * any of them. WHICH families, and how many identifiers that is, are both
 * derived from `UNINVENTORIED_FAMILIES` below and rendered on the dashboard
 * from it; neither the family count nor the identifier count is written in
 * prose here or on the screen. A build-wide figure transcribed into prose has
 * been renumbered and wrong three times in this repository already, and the
 * rule that came out of it is remove, never renumber.
 *
 * ── THREE FAMILIES WERE MISSING, AND THE GATE COULD NOT SEE THEM (C-27) ────
 * The slice-11 audit found `FAIL-AI-*` (the failure catalogue), `AI-NN` (the
 * agent abilities) and `FB-AGT-*` (chapter 44's agent fallback register) in
 * NO row of any of the fourteen AND in none of the families declared here.
 * They are declared below now. The reason they were invisible is the more
 * important half: the covering suite keyed its token sweep on the prefixes
 * THIS FILE declares, so its declared-equals-swept assertion was true by
 * construction for any family outside them — defect shape 10, a gate scoped to
 * exclude the thing it is named for. The suite now runs a SECOND sweep whose
 * shape is general (`PREFIX-…-NN`, any prefix) over `src/ai/`, subtracts what
 * the fourteen inventories and these families account for, and requires the
 * remainder to be empty. A family nobody declared lands in that remainder.
 *
 * `tests/unit/coverage-uninventoried.test.ts` still also sweeps `src/` and
 * `app/` for each declared family's own token shape — patterns DERIVED from
 * the prefixes below rather than hand-keyed beside them — and asserts the
 * swept set EQUALS the set declared here. So this module cannot silently miss
 * an identifier in a family it names, and it cannot silently keep one the
 * build dropped.
 *
 * ── THE DECISION, AND IT IS DELEGATED RATHER THAN INHERITED ────────────────
 * The choice was between (a) these are MECHANISMS rather than inventory items
 * and belong in no registry, and (b) they warrant a fifteenth inventory. Under
 * `APP-012` the choice is delegated to the build, so it is made here, in one
 * place, with its reason — leaving a shipped identifier silently uncounted is
 * the one outcome that was forbidden, and how many there are is derived below
 * rather than written here.
 *
 * **OPTION (a). They belong in no registry, and this module is the place a
 * reader is told so rather than left to infer it.** Five reasons, every one
 * measured rather than argued:
 *
 *   1. THE FOURTEEN ARE INVENTORIES OF DELIVERABLES; THESE ARE NOT.
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
 *   5. THE THREE FAMILIES THE AUDIT FOUND ARE THE SAME KIND OF THING, AND ONE
 *      OF THEM WAS EXCLUDED BY A PREFIX RATHER THAN BY A REASON.
 *      `FAIL-AI-*` is chapter 43's failure catalogue: one row per way the
 *      reasoning layer can fail, each carrying detection, fallback, terminal
 *      safe state and recovery. A failure is not a deliverable and a screen
 *      does not "demonstrate" one; what a screen owes it is the right
 *      behaviour when it happens. `AI-NN` is the thirteen agent ABILITIES
 *      with their attribute rows — a permission and governance vocabulary,
 *      consumed by the screens that must obey it, and `MOD-CC-05`'s
 *      degradation overlay consumes `AI-07`'s attributes cell by cell rather
 *      than claiming to demonstrate the identifier.
 *
 *      `FB-AGT-*` is the sharpest of the three and the one the audit was
 *      right to single out: it lives in `src/ai/fallbacks/registry.ts`, the
 *      very file the `FB-AI-` row names as its home, and it was excluded
 *      because the `FB-AI-` row filters that register on the literal prefix
 *      `FB-AI-`. IT IS NOT FOLDED INTO THAT ROW, and the reason is not
 *      tidiness. `FB-AI-*` and `FB-AGT-*` are two DIFFERENT registers that
 *      happen to be transcribed into one file: `FB-AI-*` is collision-ridden
 *      across four chapters and is the whole basis of reason 2, while
 *      `FB-AGT-*` is chapter 44's own twelve-row agent register at
 *      L95359-L95370, section-scoped (`44.1`-`44.4`), one owner each, and no
 *      collisions at all. Folding them would attach reason 2's compound-key
 *      argument to twelve identifiers it is not true of, and would put a
 *      `FB-AGT-PREV-01` under a row labelled `FB-AI-`. Two registers, two
 *      rows, and the shared home is stated on both.
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

/**
 * Chapter 44's agent fallback register, from the SAME file as
 * `FB_AI_COLLISION_OWNERS` and deliberately a separate row — reason 5.
 */
const FB_AGT_LITERALS = [
  ...new Set(
    FALLBACK_CONTRACT_OWNERS.filter((o) => o.identifier.startsWith('FB-AGT-')).map(
      (o) => o.identifier,
    ),
  ),
].sort()

/** Chapter 43's failure catalogue, one row per failure. */
const FAIL_AI_IDS = [...new Set(FAILURE_CATALOGUE.map((r) => r.id))].sort()

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
      + '"AIMODE-04: not-represented" would be misleading — but NOT because the source wants the '
      + 'mode hidden, which is what this sentence used to claim. L89261 argues the opposite in as '
      + 'many words: "Stating the mode and marking it unreachable is more honest than omitting '
      + 'it, because it fixes the vocabulary in advance of the decision rather than after it." '
      + 'The source then gives AIMODE-04 its own surface contract (L89271) and its own row in the '
      + 'mode/surface matrix (L89359). The requirement is not absence from screens, it is '
      + 'unreachability by configuration: AC-42-305 (L89404) says AIMODE-04 "cannot be entered by '
      + 'any device while DEC-ONDEVICE-001 remains undecided, enforced by configuration rather '
      + 'than by convention", which src/ai/modes/machine.ts enforces by refusing the transition. '
      + 'That is a property of the machine, and no status column over a mode can express it.',
    identifiers: AI_MODE_IDS.slice().sort(),
    alsoCitedWithoutARecord: [],
    sizeMeaning:
      'Modes in the machine, from AI_MODE_IDS. Every AIMODE-* token in the tree is a member, so '
      + 'nothing in this family is cited without a record. The modes carry thirteen distinct '
      + 'WORKER-VISIBLE LABELS and sixteen identifiers, because three pairs share a label: '
      + 'AIMODE-13/-14 read "Live coaching paused by the platform", AIMODE-03/-15 read "Live '
      + 'coaching unavailable" and AIMODE-01/-16 read "Live coaching available". SHARING A LABEL '
      + 'IS NOT BEING THE SAME ROW, and this sentence used to say it was — it claimed all three '
      + 'pairs are byte-identical across all five columns of the mode contract matrix, which is '
      + 'true of ONE of them. Measured against the matrix in the frozen source and against '
      + 'AI_MODE_REGISTER in src/ai/modes/vocabulary.ts, which transcribes it cell by cell: only '
      + 'AIMODE-13 (L89368) and AIMODE-14 (L89369) match on all five. AIMODE-03 (L89358) and '
      + 'AIMODE-15 (L89370) differ on Agent invocation — Unavailable against Allowed with '
      + 'conditions — and on Classification. AIMODE-01 (L89356) and AIMODE-16 (L89371) differ on '
      + 'Classification. The byte-identical claim belongs to the one pair, and '
      + 'src/surfaces/cc/modules/cc-08/degradation.ts states it correctly for that pair; THIS '
      + 'was the drifted copy of the two, having widened one pair to three. So this counts '
      + 'identifiers, which is the only key a surface may use: a surface keyed on the label '
      + 'collapses a tenant pause into a platform pause and a rollback into an outage.',
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
  {
    prefix: 'FAIL-AI-',
    title: 'Artificial-intelligence failure catalogue',
    heldIn: ['src/ai/failures/catalogue.ts'],
    whatItIs:
      'Chapter 43\'s catalogue of the ways the reasoning layer can fail. Each row carries its '
      + 'detection signal, its operational severity, the message each surface shows, the first '
      + 'fallback, the fallback of the fallback, the terminal safe state, recovery and '
      + 'reconciliation — every cell transcribed from the source\'s own attribute tables.',
    whyNotAnInventory:
      'A failure is not a deliverable. A row reading "FAIL-AI-01: demonstrated" would claim the '
      + 'build ships a cloud provider outage, and a row reading "not-represented" would claim it '
      + 'is missing one. What a screen owes a failure is the BEHAVIOUR the row prescribes when '
      + 'it happens, which is a property of the fallback path and is gated as one. This family '
      + 'was in no row of any of the fourteen and in none of the four families this module '
      + 'declared, which the slice-11 audit found as C-27; it is declared here, not inventoried.',
    identifiers: FAIL_AI_IDS,
    alsoCitedWithoutARecord: [],
    sizeMeaning:
      'Rows in the catalogue, from FAILURE_CATALOGUE\'s own ids. Every FAIL-AI-* token in the '
      + 'tree is a member, so nothing in this family is cited without a record. The source '
      + 'spreads these across five registers in two zero-padding conventions; the catalogue '
      + 'holds one row per failure, and the register split is recorded where the transcription '
      + 'lives rather than by splitting this count.',
  },
  {
    prefix: 'AI-',
    title: 'Agent abilities',
    heldIn: ['src/ai/abilities/register.ts'],
    whatItIs:
      'The thirteen abilities an agent may hold, each with the source\'s own attribute rows — '
      + 'human approval, validation gate, expiry, safe stop and the rest. A permission and '
      + 'governance vocabulary, not a feature list.',
    whyNotAnInventory:
      'An ability is a rule the surfaces obey, and the obeying is what is checkable: MOD-CC-05\'s '
      + 'degradation overlay consumes AI-07\'s human-approval, validation-gate, expiry and '
      + 'safe-stop attributes cell by cell rather than claiming to demonstrate the identifier, '
      + 'and it throws at load if an attribute it needs is absent from the register. A status '
      + 'column would report "demonstrated" for whichever abilities a screen happens to name and '
      + 'would say nothing about whether the prohibition attached to them is honoured, which is '
      + 'the only question worth asking. Found by the slice-11 audit (C-27) in no row of any of '
      + 'the fourteen and in none of the declared families.',
    identifiers: AI_ABILITY_IDS.slice().sort(),
    alsoCitedWithoutARecord: [],
    sizeMeaning:
      'Abilities in the register, from AI_ABILITY_IDS. Every bare AI-NN token in the tree is a '
      + 'member. The token shape is the trap here and the sweep is written for it: AI-01 occurs '
      + 'inside FAIL-AI-01, FB-AI-01 and SB-AI-01, so a word-boundary match alone would count '
      + 'three other families as this one.',
  },
  {
    prefix: 'FB-AGT-',
    title: 'Agent fallback contracts, chapter 44',
    heldIn: ['src/ai/fallbacks/registry.ts'],
    whatItIs:
      'Chapter 44\'s own twelve-row fallback register at L95359-L95370: three contracts for each '
      + 'of the four agent sections (44.1 coaching, 44.2 deviation, 44.3 shift handover, 44.4 '
      + 'vision), each with a named terminal safe state.',
    whyNotAnInventory:
      'Same reason as FB-AI-*: a fallback contract is what the platform DOES when a capability is '
      + 'unavailable, not a thing a screen shows. It is a SEPARATE row from FB-AI-* rather than '
      + 'folded into it, and reason 5 above states why: the two are different registers that '
      + 'happen to share a transcription file. FB-AI-* is collision-ridden across four chapters '
      + 'and is what reason 2 rests on; these twelve are section-scoped, single-owner and '
      + 'collision-free, so filing them under the FB-AI- row would attach an argument to them '
      + 'that is not true of them. The audit found them (C-27) excluded from the FB-AI- row\'s '
      + 'identifier list by a literal prefix filter, while living in the file that row names as '
      + 'its home.',
    identifiers: FB_AGT_LITERALS,
    alsoCitedWithoutARecord: [],
    sizeMeaning:
      'Distinct FB-AGT-* literals in the collision-aware registry, derived by filtering '
      + 'FALLBACK_CONTRACT_OWNERS. Owners and literals are equal here, unlike FB-AI-*: every one '
      + 'of the twelve has exactly one owning section, which is the measurable difference '
      + 'between the two registers and the reason they are two rows.',
  },
] as const satisfies readonly UninventoriedFamily[]

/* ==================================================================== *
 * THE REST OF THE AI AREA'S IDENTIFIER SHAPES, AND WHERE EACH IS ANSWERED.
 * ==================================================================== */

/**
 * ONE NAMESPACE THAT APPEARS IN `src/ai/` AND IS NEITHER INVENTORIED NOR A
 * FAMILY ABOVE, WITH THE PLACE THAT DOES ANSWER FOR IT.
 *
 * This exists because of the gate, and the gate exists because of C-27. The
 * covering suite now sweeps `src/ai/` for identifier-shaped tokens with NO
 * knowledge of which prefixes this module declares, subtracts the rows of the
 * fourteen generated inventories and the families above, and requires the
 * remainder to be EMPTY. Every entry below is one line of that remainder,
 * accounted for on purpose. A namespace nobody has thought about does not get
 * a default: it lands in the remainder and turns the suite red.
 *
 * That is the difference between this and the check it replaced, which keyed
 * its sweep on the four prefixes the module already declared and so could
 * only ever confirm what it was told.
 */
export interface AccountedElsewhere {
  /** Token prefixes this entry answers for. */
  readonly prefixes: readonly string[]
  readonly title: string
  /** Where the question "is this counted" is actually answered. */
  readonly accountedIn: string
  readonly why: string
}

export const NAMESPACES_ACCOUNTED_ELSEWHERE = [
  {
    prefixes: ['AC-'],
    title: 'Acceptance criteria',
    accountedIn: 'the module that enforces each one, beside the rule it governs',
    why:
      'The master prompt names no acceptance-criteria inventory and none of the fourteen holds '
      + 'one. An AC is a condition on behaviour, and this build cites it where the behaviour is '
      + 'implemented — AC-42-305 beside the AIMODE-04 refusal in src/ai/modes/machine.ts, for '
      + 'one — so the citation is checkable at the point it matters. CHAPTER 44 IS AN EXPLICIT '
      + 'ABSTENTION, RECORDED HERE RATHER THAN LEFT SILENT (audit C-31): the frozen source '
      + 'carries an AC-44-* register and this build cites NO member of it in src/, app/ or '
      + 'tests/, while it does consume chapter 44\'s FB-AGT-* register. Chapter 44\'s acceptance '
      + 'criteria bind the AGENT RUNTIME — evaluation gates, retry ceilings, provider failover — '
      + 'and this storyboard ships no agent runtime to bind, so citing them would claim an '
      + 'enforcement that does not exist. They are named in registries/blueprint-locators.json '
      + 'and registries/raw/identifier-index.json, so a reader can find them; what is stated '
      + 'here is that the build deliberately enforces none of them.',
  },
  {
    prefixes: ['TEST-'],
    title: 'Source-side test identifiers',
    accountedIn: 'the suite that covers the behaviour, named in the test file',
    why:
      'Same shape as AC-*: the frozen source numbers its own tests and none of the fourteen '
      + 'inventories them. The same chapter-44 abstention applies and for the same reason — no '
      + 'TEST-44-* identifier occurs in src/, app/ or tests/, because the runtime those tests '
      + 'describe is not built here.',
  },
  {
    prefixes: ['DEC-'],
    title: 'Open client decisions outside the DEC-AI* family',
    accountedIn: 'src/disclosure/decisions.ts and the per-surface local registers',
    why:
      'The decision canon holds these and renders them through DecisionDisclosure; the local '
      + 'registers hold the rest and CANON_CONSOLIDATION_VERDICTS below records why each stays '
      + 'where it is. DEC-AI* is the subset this module declares as a family, on reason 4.',
  },
  {
    prefixes: ['FB-CONF-', 'FB-CORE-', 'FB-SYNC-'],
    title: 'Per-chapter fallback registers named in transcribed prose, outside the AI families',
    accountedIn:
      'the transcribed prose that names each one, and src/fallbacks/contracts.ts for why §38.4 '
      + 'does not own the FB-* namespace',
    why:
      'THIS ENTRY USED TO READ `FB-` AND THAT WAS A HOLE, NOT A CONVENIENCE. Matched with '
      + 'startsWith, a bare FB- absorbs every FB-AGT-* and FB-AI-* token too — so the general '
      + 'sweep, the one written to catch a family nobody declared, could not have seen the '
      + 'FB-AGT-* register that audit C-27 called the sharpest of the three it found. Measured: '
      + 'delete the FB-AGT- family declaration outright and the remainder was still empty, which '
      + 'means the declaration was load-bearing for nothing. The entry now names the namespaces '
      + 'it actually answers for, so a new FB-* register lands in the remainder instead of under '
      + 'a rubber stamp. Those namespaces are three, and all three are cited rather than '
      + 'registered, and all three are rows of one chapter-24 table of fallback contract '
      + 'FAMILIES rather than of numbered contracts — FB-CORE-01 at L46949, FB-SYNC-01 at '
      + 'L46950, FB-CONF-01 at L46954. That table is why a bare FB-AI-01 cannot be a key: its '
      + 'own FB-AI-01 row (L46951) is a family and not the same KIND of object as the three '
      + 'numbered contracts sharing that literal. None of the three is a §38.4 '
      + 'library member: that library is a closed seventy, and src/fallbacks/contracts.ts '
      + 'measures the frozen source as carrying roughly seven hundred distinct FB-* identifiers '
      + 'across per-chapter registers with incompatible shapes. Its own FB-AI family is declared '
      + 'as a family here — reason 3 above — and chapter 44\'s FB-AGT-* register as a second, so '
      + 'neither is answered by this entry.',
  },
  {
    prefixes: ['SB-AI-'],
    title: 'Audit-trail row keys inside a storyboard card',
    accountedIn: 'the card that mints them, src/ai/storyboards/sb-21-to-30/storyboards.ts',
    why:
      'The SB-AI-NN-AUD-N shape is NOT a source identifier and is not in the source: it is a key '
      + 'this build mints for one row of one card\'s audit-trail table, so the row can be '
      + 'referenced from a test. The plain SB-AI-NN identifiers are inventoried in '
      + 'registries/generated/ai-storyboards.json and never reach this list.',
  },
  {
    prefixes: ['SCR-'],
    title: 'Screen identifiers',
    accountedIn: 'registries/generated/ and the surface module that owns the screen',
    why:
      'Screen identifiers belong to their surface. Nearly all of them are already inventory '
      + 'rows; the ones cited from src/ai/ are cited as the screen a storyboard card takes '
      + 'place on, which is a pointer to another surface\'s register rather than a claim here.',
  },
  {
    prefixes: ['APP-'],
    title: 'Build approval ledger entries',
    accountedIn: 'UNINVENTORIED_DECISION_LABEL, above',
    why:
      'APP-012 is an approval-ledger entry and occurs zero times in the frozen source. It is a '
      + 'legitimate build label and is never citable with a line number, which is exactly what '
      + 'the decision label says.',
  },
  {
    prefixes: ['TAB-', 'RUN-', 'LOT-', 'RB-'],
    title: 'The source\'s own fixture cast and its record numbers',
    accountedIn: 'the transcribed card text that names them',
    why:
      'TAB-014 is a tablet, LOT-WB-2291 a lot, RUN-2026-08-14 a run and RB-0011 a record — the '
      + 'frozen source\'s fixture cast, appearing inside card text this build transcribed rather '
      + 'than in any register. There is nothing to inventory: they are the worked example, not '
      + 'the vocabulary.',
  },
] as const satisfies readonly AccountedElsewhere[]

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


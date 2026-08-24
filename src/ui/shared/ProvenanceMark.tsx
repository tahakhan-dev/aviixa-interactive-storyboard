import { AI_AGENT_ROSTER, aiRosterAgent, type AiAgentId } from '@/ai/agents/roster'
import { DecisionDisclosure } from '@/disclosure/DecisionDisclosure'
import { provenanceClass, type ProvenanceClassId } from '@/ai/provenance/classes'
import { contractPermits } from '@/ai/provenance/contract'

/**
 * THE ONLY RENDERING PATH FOR A PROVENANCE CLASS, ON ANY SURFACE.
 *
 * Section 42.4's contract is one class per guidance element, six treatments
 * with no shared visual language, and one absolute rule: cached approved
 * guidance and deterministic rules are never labelled live artificial
 * intelligence. A surface writing its own provenance label is how the second
 * screen labels the same thing differently and how the fifth labels a cached
 * asset as live. So there is one component, and it takes one class.
 *
 * ── WHAT IT REFUSES TO RENDER, AND WHY THAT IS THE FEATURE ─────────────────
 * The three identity details are gated by the contract's own columns rather
 * than by the caller's care. Hand an agent to a `PROV-3` element and nothing
 * renders — L89469 reads `Explicitly prohibited` under "Carries model or agent
 * identity", and a prohibition enforced by asking callers to behave is
 * enforced nowhere. The same gate carries the content version and the human
 * identity: each of those columns is enforced here as behaviour rather than
 * carried as data. No count — the number was stale on arrival and this build
 * removes a stale count rather than renumbering it, because a fresh number
 * reships the identical defect and the count was never the claim a reader
 * could act on. The columns themselves are `ContractColumn` in
 * `@/ai/provenance/classes`, which is where a reader should go to enumerate
 * them.
 *
 * ── IT IS MOUNTED NOW, AND THIS PARAGRAPH IS THE CLOSURE IT ASKED FOR ──────
 * This paragraph used to read "Measured: nothing under `app/` renders this
 * component", state that as a deliberate wave-0 abstention, and end with
 * "whoever mounts the first one closes this paragraph". Waves 2, 3 and 4
 * mounted it and none of them came back, so the abstention outlived its own
 * truth — which is the same defect class as a stale count on a screen, in the
 * one kind of paragraph written specifically to prevent it. A gate found it.
 *
 * NO COUNT IS WRITTEN HERE, and the first attempt at this paragraph wrote one
 * anyway — in the very sentence saying it would not. A later mount made that
 * figure stale within the hour, which is the whole argument in miniature. The
 * number moves every time a surface mounts a mark, and
 * `tests/coverage/slice-11-gates.test.ts` measures it from `out/` on every
 * release run, which is the only place a figure like that can be true. What
 * matters to a reader of this file is that it is reached from routes at all,
 * and that the reachability claim is made by a gate rather than by a sentence
 * nobody re-measures.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ───────────────────────────────────────
 * It does not draw the six SHAPES. `SB-42-401` (L89459) gives `PROV-1` a card,
 * `PROV-3` a bordered panel, `PROV-4` an inline treatment beside the field it
 * governs, and `PROV-6` a muted panel — and those are containers belonging to
 * the surfaces that own the field, the card and the panel. This is the mark
 * that goes inside them, and the disjointness property it carries is textual
 * for exactly that reason: text survives being placed in someone else's
 * container, and a colour or a shape does not. The property is asserted in
 * `tests/component/provenance-mark.test.tsx` by stripping every `class` and
 * `style` attribute and requiring the six to stay distinct.
 *
 * ── NO CLIENT BOUNDARY, AND THAT IS A DECISION RATHER THAN AN OMISSION ─────
 * A mark is a label. It has no state, no handler and nothing to act through,
 * so it is a server component and carries no `'use client'`. Where a surface
 * needs interactivity around it — the "Why you are seeing this" link `PROV-1`'s
 * treatment names — the boundary belongs at that caller, which is where this
 * build learned to put it after marking a shared control turned one broken
 * route into seven.
 *
 * ── PROV-2 CANNOT BE RENDERED AS A WORKING CLASS ───────────────────────────
 * Its offline cell reads `Client Decision Required` and it is the only cell in
 * the column that does. The mark therefore carries the canon's disclosure for
 * `DEC-ONDEVICE-001`, which renders the alias `DEC-LOCALAI-001` and every
 * reading of both. Driven by the record's own `decisionRefs`, not by an
 * identifier check, so a class that becomes undecided later discloses without
 * this file changing.
 */
export interface ProvenanceMarkProps {
  readonly classId: ProvenanceClassId
  /** Rendered only where the contract permits a model or agent identity. */
  readonly agent?: AiAgentId
  /** Rendered only where the contract permits a content version. */
  readonly contentVersion?: string
  /** Rendered only where the contract permits a human identity. */
  readonly humanIdentity?: string
  /**
   * The caller's own sentence. `PROV-6`'s treatment asks for one naming the
   * current operating mode and what the worker may do instead; the mode
   * vocabulary belongs to section 42.3 and to the surface that knows it, so
   * it is supplied rather than reached for from here.
   */
  readonly statement?: string
}

export function ProvenanceMark({
  classId,
  agent,
  contentVersion,
  humanIdentity,
  statement,
}: ProvenanceMarkProps) {
  const record = provenanceClass(classId)

  const agentName =
    agent !== undefined && contractPermits(classId, 'carriesModelOrAgentIdentity')
      ? aiRosterAgent(AI_AGENT_ROSTER, agent).name
      : null
  const version =
    contentVersion !== undefined && contractPermits(classId, 'carriesContentVersion')
      ? contentVersion
      : null
  const person =
    humanIdentity !== undefined && contractPermits(classId, 'carriesHumanIdentity')
      ? humanIdentity
      : null

  return (
    <div
      data-provenance-class={record.id}
      className="text-sm text-[var(--color-ink)]"
    >
      <p>
        <span
          data-testid="provenance-marker"
          className="rounded-[var(--radius-chip)] border border-[var(--color-border-strong)] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
        >
          {record.markerText}
        </span>{' '}
        <span className="text-[var(--color-ink-muted)]">{record.meaning}</span>
      </p>

      {agentName === null ? null : (
        <p data-testid="provenance-agent" className="mt-1">
          {agentName}
        </p>
      )}
      {version === null ? null : (
        <p data-testid="provenance-content-version" className="mt-1">
          Content version {version}
        </p>
      )}
      {person === null ? null : (
        <p data-testid="provenance-human-identity" className="mt-1">
          {person}
        </p>
      )}
      {statement === undefined ? null : (
        <p data-testid="provenance-statement" className="mt-1">
          {statement}
        </p>
      )}

      {/* THE OFFLINE CELL RENDERS WHEN IT IS NOT A PLAIN YES. Three of the six
          say something a reader needs — cannot happen at all, undecided, or
          permitted with conditions — and the sense of each is recorded on the
          record because `Unavailable` carries two senses across this source
          that render oppositely. */}
      {record.permittedWhileOffline === 'Allowed' ? null : (
        <p data-testid="provenance-offline" className="mt-1 text-xs text-[var(--color-ink-subtle)]">
          Permitted while offline: {record.permittedWhileOffline}. {record.permittedWhileOfflineSense}
        </p>
      )}

      <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
        {record.classification.replaceAll('`', '')} · {record.sourceRef}
      </p>

      {record.decisionRefs.map((id) => (
        <div key={id} className="mt-2">
          <DecisionDisclosure id={id} />
        </div>
      ))}
    </div>
  )
}

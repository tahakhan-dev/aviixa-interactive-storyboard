/**
 * The artificial-intelligence operating-mode machine, for all five surfaces.
 *
 * Named re-exports rather than `export *`: star re-exports through a barrel do
 * not resolve in this build's knowledge graph, so "who uses this mode
 * vocabulary" would be unanswerable for every consumer that came through here.
 * The list is short and the graph stays honest.
 */
export {
  AGENT_INVOCATION_VALUES,
  AI_MODE_IDS,
  AI_MODE_ROWS,
  AI_MODE_TRANSITIONS,
  ESCALATION_DELIVERY_VALUES,
  aiMode,
  modesCarryingWorkerLabel,
} from './vocabulary'
export type {
  AgentInvocation,
  AiModeId,
  AiModeRow,
  AiModeTransition,
  EscalationDelivery,
  TransitionSource,
  TransitionTarget,
} from './vocabulary'

export {
  AIMODE_WORKER_DISCLOSURE_DECISION,
  applyTransition,
  boundedLiveness,
  enterMode,
  transitionsFrom,
} from './machine'
export type {
  AiModeContext,
  AiModeRuling,
  LivenessEvidence,
  LivenessRuling,
  OutstandingWork,
} from './machine'

/**
 * Slice 5, task 3 -- the nineteen closed vocabularies of `SURF-STU`, design
 * §4, plus the Workflow authoring statuses hoisted out of `MOD-STU-03`.
 * Eighteen are declared here; two are **shared, never re-declared**:
 *
 * - the fifteen command states, slice 3 -- `@/surfaces/sa/command-state`
 *   (`COMMAND_STATES`, L31181). S10: the fifteen are the ONLY adoption
 *   vocabulary, and no Studio view ever claims a device state.
 * - the nine permission outcomes, slice 2a -- `@/policy/decision`
 *   (`PERMISSION_OUTCOMES`, slice-4 D8).
 *
 * Both are re-exported below so a Studio module has one import site, and
 * neither is copied: a second declaration of either is what lets two lists
 * drift apart, which is the whole failure `DEC-CAP-001` records.
 */
export * from './identity'
export * from './authoring'
export * from './lifecycle'

export { COMMAND_STATES, type CommandState } from '@/surfaces/sa/command-state'
export { PERMISSION_OUTCOMES, type PermissionOutcome } from '@/policy/decision'

import { CAPTURE_TYPES, CONFIGURATION_SECTIONS, DIFFICULTY_LEVELS, LOCALES, NOTIFICATION_CHANNELS, WORKFLOW_SETTINGS } from './authoring'
import { FALLBACK_CONTRACTS, STUDIO_MODULE_IDS, STUDIO_SCREEN_IDS } from './identity'
import {
  COACHING_ASSET_STATES,
  COMPOSED_AGENT_STATES,
  D21_MODELLED_FLAGS,
  GRANT_STATES,
  JOB_ADOPTION_STATES,
  PACKAGE_STATES,
  SUBMISSION_STATES,
  VERSION_BUMP_CLASSES,
  WORKFLOW_STATUSES,
} from './lifecycle'

/**
 * Every member of every closed set above, flattened once.
 *
 * This exists for one purpose: a decision disclosure that names a vocabulary
 * member in its prose pins that member here, and the pin fails to resolve the
 * moment the member is removed from its set. That is the difference between a
 * pointer and a rotting pointer -- slice 4 shipped four of the latter, one of
 * them created by the fix for another.
 *
 * `INHERITABLE_DEFAULTS` is deliberately absent: its two members are settings
 * keys, never rendered prose, so nothing can honestly pin them.
 */
export const STUDIO_VOCABULARY_MEMBERS = [
  ...STUDIO_MODULE_IDS,
  ...STUDIO_SCREEN_IDS,
  ...FALLBACK_CONTRACTS,
  ...CAPTURE_TYPES,
  ...WORKFLOW_SETTINGS,
  ...CONFIGURATION_SECTIONS,
  ...DIFFICULTY_LEVELS,
  ...LOCALES,
  ...NOTIFICATION_CHANNELS,
  ...WORKFLOW_STATUSES,
  ...VERSION_BUMP_CLASSES,
  ...JOB_ADOPTION_STATES,
  ...SUBMISSION_STATES,
  ...PACKAGE_STATES,
  ...COACHING_ASSET_STATES,
  ...COMPOSED_AGENT_STATES,
  ...GRANT_STATES,
  ...D21_MODELLED_FLAGS.map((f) => f.flag),
] as const satisfies readonly string[]

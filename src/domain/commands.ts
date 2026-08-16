import type { TenantId } from './ids'

/**
 * Every product action is a typed command. Slices 2 to 13 extend this union;
 * the shape of a member never changes once a later slice depends on it.
 */
export type ScenarioCommand =
  | {
      readonly type: 'CC_RELEASE_LOT_HOLD'
      readonly tenant: TenantId
      readonly lotId: string
      readonly note: string
    }
  | {
      readonly type: 'PLATFORM_SET_FEATURE_CONTROL'
      readonly feature: string
      readonly enabled: boolean
    }
  | {
      readonly type: 'TENANT_SET_DESIRED_FEATURE'
      readonly tenant: TenantId
      readonly feature: string
      readonly enabled: boolean
    }

export type CommandType = ScenarioCommand['type']

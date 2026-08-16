declare const brandSymbol: unique symbol

type Brand<T, B extends string> = T & { readonly [brandSymbol]: B }

export type TenantId = Brand<string, 'TenantId'>
export type ScenarioRunId = Brand<string, 'ScenarioRunId'>
export type ObjectId = Brand<string, 'ObjectId'>
export type ModuleId = Brand<string, 'ModuleId'>
export type RouteId = Brand<string, 'RouteId'>
export type PersonaId = Brand<string, 'PersonaId'>
export type CorrelationId = Brand<string, 'CorrelationId'>
export type IdempotencyKey = Brand<string, 'IdempotencyKey'>

export const tenantId = (raw: string): TenantId => raw as TenantId
export const scenarioRunId = (raw: string): ScenarioRunId =>
  raw as ScenarioRunId
export const objectId = (raw: string): ObjectId => raw as ObjectId
export const moduleId = (raw: string): ModuleId => raw as ModuleId
export const routeId = (raw: string): RouteId => raw as RouteId
export const personaId = (raw: string): PersonaId => raw as PersonaId
export const correlationId = (raw: string): CorrelationId =>
  raw as CorrelationId
export const idempotencyKey = (raw: string): IdempotencyKey =>
  raw as IdempotencyKey

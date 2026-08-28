// Task 1 — the product runtime's public surface. The raw contexts
// (`RuntimeDataContext`, `ProductSessionContext`) are deliberately NOT
// re-exported here: `ProductRuntime` is the only component that may render
// either Provider, and every other consumer reads through a hook below.
export { ProductRuntime } from './ProductRuntime'
export {
  useAccessContext,
  useProductSession,
  useRepository,
  useRepositoryQuery,
  useRuntimeReady,
  useStore,
  reviewerAccessContext,
} from './useRepository'
export {
  resolveSignIn,
  SIGNED_OUT,
  type ProductSessionApi,
  type ProductSessionState,
  type SignInOutcome,
} from './session'

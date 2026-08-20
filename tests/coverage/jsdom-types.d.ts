/**
 * The one slice of `jsdom`'s surface `slice-04-gates.test.ts` uses, typed
 * against the project's own `lib: ["dom"]`.
 *
 * `jsdom` is already a devDependency (it backs the `component` project's
 * environment); it simply ships no types, and `@types/jsdom` is not
 * installed. Declaring the two members actually used is cheaper and safer
 * than adding a dependency for a gate file — and far safer than a blanket
 * `declare module 'jsdom'`, which would make every misuse of it an `any`
 * and silently disarm `strict` inside the gates that read the built pages.
 */
declare module 'jsdom' {
  export class JSDOM {
    constructor(html: string)
    readonly window: { readonly document: Document }
  }
}

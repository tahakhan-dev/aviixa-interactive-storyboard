import { JSDOM } from 'jsdom'

/**
 * THE RENDERED TEXT, NOT THE MARKUP. React splits every interpolated value
 * with an HTML comment — `316<!-- --> of <!-- -->5018` — so a raw substring
 * search for a sentence a reader actually sees fails on markup a reader
 * never sees. Comments are dropped, tags are replaced by a space, the four
 * entities this build's prose actually uses are decoded, and runs of
 * whitespace collapse. That is what a client reads.
 *
 * SCRIPT AND STYLE CONTENTS GO FIRST, AND THAT IS THE WHOLE POINT (R5-Q01).
 * Next inlines the entire React flight payload as
 * `<script>self.__next_f.push(...)</script>` — on
 * `out/coverage/actionable-controls/index.html` that is 790KB of a 1.3MB file
 * — and it carries every prop of every server component: every sentence a
 * gate asserts, and every row id as a React key. Stripping tags alone leaves
 * all of it in the string, so a `toContain` over the result is satisfiable by
 * a page whose visible body has been deleted. That is not a hypothesis: fix
 * stream Q changed a figure in the DOM, the payload still carried the old
 * one, and the assertion passed. Three gates carried a local `readerText`
 * doing this; they now call straight through here.
 *
 * A `<script>` or `<style>` element is dropped whole rather than having its
 * tags replaced by a space, because its CONTENT is not text a reader sees —
 * the same reason `<!-- -->` is dropped rather than spaced.
 */
export function renderedText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<!--.*?-->/gs, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
}

/**
 * THE SAME HOLE BY THE OTHER ROUTE (R5-Q01, second half).
 *
 * A gate that parses a built page with JSDOM and reads `doc.body.textContent`
 * is exposed exactly as `renderedText` was, and worse, because it does not
 * look like string handling at all. `textContent` INCLUDES the text of
 * `<script>` and `<style>` descendants, and Next emits its flight payload as
 * three `<script>` children of `<body>`. Measured on this build:
 * `out/coverage/index.html` gives 162,733 characters of `body.textContent`,
 * of which 104,842 — 64% — are the payload; `/hub` 41%, `/studio` 40%.
 *
 * So the elements are removed from the parsed document, once, here. No gate
 * in `tests/coverage/` queries a `<script>` or a `<style>`, so nothing else
 * changes; `querySelectorAll`, `hidden` and every attribute walk behave as
 * before. Planted pages are parsed through the same function deliberately —
 * a plant that took a different route from the read it is proving would be
 * proving the wrong thing.
 */
export function readerDocument(html: string): Document {
  const doc = new JSDOM(html).window.document
  for (const el of doc.querySelectorAll('script, style')) el.remove()
  return doc
}


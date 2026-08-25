/**
 * THE RENDERED TEXT, NOT THE MARKUP. React splits every interpolated value
 * with an HTML comment — `316<!-- --> of <!-- -->5018` — so a raw substring
 * search for a sentence a reader actually sees fails on markup a reader
 * never sees. Comments are dropped, tags are replaced by a space, the four
 * entities this build's prose actually uses are decoded, and runs of
 * whitespace collapse. That is what a client reads.
 */
export function renderedText(html: string): string {
  return html
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

